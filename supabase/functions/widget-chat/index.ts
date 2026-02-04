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

    // Allow internal demo mode for Lovable preview domains
    const isInternalDemo = apiKey === "INTERNAL_DEMO" && origin && (
      origin.includes("lovable.app") || 
      origin.includes("lovableproject.com") ||
      origin.includes("localhost") || 
      origin.includes("127.0.0.1")
    );

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key. Include 'x-api-key' header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip validation for internal demo mode
    if (!isInternalDemo) {
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
    }


    const body = await req.json();
    const { message, pageContent, interactiveElements, pageUrl } = body;
    
    // Validate message - required and must be a string
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message length (max 2000 characters)
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Message too long. Maximum 2000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and truncate page content (max 10000 characters)
    let validatedPageContent = '';
    if (pageContent && typeof pageContent === 'string') {
      validatedPageContent = pageContent.length > 10000 ? pageContent.slice(0, 10000) : pageContent;
    }

    // Validate and truncate interactive elements (max 5000 characters)
    let validatedInteractiveElements = '';
    if (interactiveElements && typeof interactiveElements === 'string') {
      validatedInteractiveElements = interactiveElements.length > 5000 ? interactiveElements.slice(0, 5000) : interactiveElements;
    }

    // Validate pageUrl (max 2000 characters, must be string if provided)
    let validatedPageUrl = '';
    if (pageUrl && typeof pageUrl === 'string') {
      validatedPageUrl = pageUrl.length > 2000 ? pageUrl.slice(0, 2000) : pageUrl;
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful accessibility assistant on this website. Help users with visual impairments navigate and understand the page content. Use British English spelling (e.g. summarise, colour, organisation).

Page: ${validatedPageUrl || "this page"}
Content: ${validatedPageContent || "Not available"}
Clickable elements: ${validatedInteractiveElements || "None found"}

ACTIONS (include ONLY when you will perform an action):
[ACTION:CLICK:element_text] - to click a button or link
[ACTION:SCROLL:section_name] - to scroll to a section
[ACTION:FOCUS:field_name] - to focus on a form field
[ACTION:FILL:field_name:value] - to fill in a form field

When the user asks you to click something, navigate somewhere, or perform an action:
1. Find the matching element in the clickable elements list above
2. Include the appropriate [ACTION:...] tag with the exact element text
3. Briefly confirm what you are doing

SUGGESTED ACTIONS:
At the END of every response, you MUST include 2-6 helpful follow-up suggestions based on what the user might want to do next. These should be contextual to the page content and your response.

Format: [SUGGESTIONS:label1|prompt1||label2|prompt2||label3|prompt3]

Examples:
- After summarising: [SUGGESTIONS:📑 Read headings|Read out the page headings||🔗 Show links|What links are on this page||🏠 Go to home|Click the home link]
- After showing nav: [SUGGESTIONS:📞 Go to Contact|Click Contact||ℹ️ Go to About|Click About||💰 View Pricing|Click Pricing]
- For a form page: [SUGGESTIONS:📝 Help with form|What fields are in this form||✅ Submit|Submit the form||❓ Required fields|What fields are required]

Make suggestions specific to THIS page's content - use actual section names, link texts, and features you can see. Never show generic repeated options.

CAPABILITIES YOU CAN HELP WITH:
- Summarise page content clearly and concisely
- Read out menu/navigation options
- Find and list downloadable files or document links
- Read page headings to explain structure
- Help navigate to specific sections
- Click links and buttons when asked
- Answer questions about content

STRICT RULES:
- Reply in 1-3 short sentences max, be concise
- NEVER use any markdown, asterisks, bullets, or formatting (except for [ACTION:...] and [SUGGESTIONS:...] tags)
- NEVER output JSON, curly braces {}, square brackets [] (except for special tags)
- Sound natural, warm and helpful
- Use everyday words, avoid jargon
- For lists (like menu items), speak them naturally in a sentence
- If you cannot find what the user asked for, say so honestly
- When performing actions, briefly confirm what you are clicking/doing
- ALWAYS include [SUGGESTIONS:...] at the end with 2-6 contextual options`;


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
