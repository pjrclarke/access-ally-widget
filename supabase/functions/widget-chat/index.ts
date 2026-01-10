import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, pageContent, interactiveElements, pageUrl } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI accessibility assistant embedded on a website. Your job is to help users understand and navigate the website content. You can also PERFORM ACTIONS on the page when users ask you to click, scroll to, or interact with elements.

Current page URL: ${pageUrl || "Unknown"}

Page content summary:
${pageContent || "No page content provided"}

Interactive elements on this page:
${interactiveElements || "No interactive elements found"}

## ACTION COMMANDS
When users ask you to click something, scroll to something, or interact with the page, include an action command in your response. Use these formats:
- [ACTION:CLICK:button text or id] - Click an element
- [ACTION:SCROLL:section name or id] - Scroll to an element  
- [ACTION:FOCUS:input name or id] - Focus an input field
- [ACTION:FILL:input name:value to enter] - Fill an input field

Examples:
- User: "Click the pricing button" → "I'll click that for you. [ACTION:CLICK:Pricing]"
- User: "Scroll to the FAQ section" → "Scrolling to FAQ now. [ACTION:SCROLL:FAQ]"
- User: "Go to contact" → "Taking you to contact. [ACTION:SCROLL:Contact]"

Guidelines:
- Be concise and helpful
- Focus on answering questions about the page content
- When asked to navigate or click, use the ACTION commands above
- Use simple, clear language that's easy for screen readers
- If you don't know something, say so honestly
- Keep responses under 150 words unless more detail is needed
- Always confirm what action you're taking when you use an ACTION command`;

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
