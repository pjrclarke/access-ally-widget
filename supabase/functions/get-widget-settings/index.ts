import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For internal demo, return default settings
    const origin = req.headers.get("origin") || "";
    const isInternalDemo = apiKey === "INTERNAL_DEMO" && (
      origin.includes("lovable.app") ||
      origin.includes("lovableproject.com") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    );

    if (isInternalDemo) {
      return new Response(
        JSON.stringify({
          primary_color: "#6366f1",
          secondary_color: "#8b5cf6",
          position: "bottom-right",
          voice_rate: 1.0,
          voice_pitch: 1.0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role for reading settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch settings for this API key
    const { data, error } = await supabase
      .from("widget_api_keys")
      .select("primary_color, secondary_color, position, voice_rate, voice_pitch, domain, is_active")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: validate domain if set
    if (data.domain && origin) {
      const originHost = new URL(origin).hostname.replace("www.", "");
      const allowedDomain = data.domain.replace("www.", "");
      if (!originHost.includes(allowedDomain) && !allowedDomain.includes(originHost)) {
        return new Response(
          JSON.stringify({ error: "API key not authorized for this domain" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        primary_color: data.primary_color || "#6366f1",
        secondary_color: data.secondary_color || "#8b5cf6",
        position: data.position || "bottom-right",
        voice_rate: data.voice_rate || 1.0,
        voice_pitch: data.voice_pitch || 1.0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
