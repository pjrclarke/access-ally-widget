import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Rate limiting: Track requests per API key (in-memory for edge function)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(apiKey);
  
  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(apiKey, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count, resetIn: record.resetTime - now };
}

async function validateApiKey(apiKey: string, origin: string | null): Promise<{ valid: boolean; error?: string; domain?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return { valid: false, error: "Server configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase.rpc("validate_widget_api_key", {
    key_to_validate: apiKey,
  });

  if (error) {
    console.error("API key validation error:", error);
    return { valid: false, error: "Failed to validate API key" };
  }

  const result = data?.[0];
  if (!result?.is_valid) {
    return { valid: false, error: "Invalid or inactive API key" };
  }

  // STRICT domain validation - required unless domain is "*" or null
  const keyDomain = result.key_domain;
  
  if (keyDomain && keyDomain !== "*") {
    if (!origin) {
      console.warn("No origin header - rejecting request for domain-locked key");
      return { valid: false, error: "Origin header required for this API key" };
    }
    
    try {
      const allowedDomains = keyDomain.split(",").map((d: string) => d.trim().toLowerCase());
      const originHost = new URL(origin).hostname.toLowerCase();
      
      const domainMatch = allowedDomains.some((domain: string) => {
        // Exact match or subdomain match
        return originHost === domain || 
               originHost.endsWith(`.${domain}`) ||
               // Also allow www variants
               originHost === `www.${domain}` ||
               domain === `www.${originHost}`;
      });
      
      if (!domainMatch) {
        console.warn(`Domain mismatch: ${originHost} not in allowed list: ${allowedDomains.join(", ")}`);
        return { valid: false, error: `API key not authorized for domain: ${originHost}` };
      }
    } catch (e) {
      console.error("Error parsing origin:", e);
      return { valid: false, error: "Invalid origin header" };
    }
  }

  return { valid: true, domain: keyDomain };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for API key in header
    const apiKey = req.headers.get("x-api-key");
    const origin = req.headers.get("origin");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key. Include 'x-api-key' header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the API key
    const validation = await validateApiKey(apiKey, origin);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Limit": RATE_LIMIT.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(rateLimit.resetIn / 1000).toString()
          } 
        }
      );
    }

    const { message, pageContent, interactiveElements, pageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful voice assistant on this website. Help users navigate and understand the page.

Page: ${pageUrl || "this page"}
Content: ${pageContent || "Not available"}
Clickable elements: ${interactiveElements || "None found"}

ACTIONS (include when users want to interact):
[ACTION:CLICK:element] [ACTION:SCROLL:section] [ACTION:FOCUS:field] [ACTION:FILL:field:value]

RULES:
- Reply in 1-2 short sentences max
- No markdown, asterisks, bullets, or formatting
- Sound natural and friendly, like talking to a friend
- Use everyday words, avoid jargon
- Just answer the question directly
- For actions, briefly confirm what you're doing`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Widget chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
