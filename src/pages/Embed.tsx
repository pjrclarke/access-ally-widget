import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ArrowLeft, Key, Globe, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Embed = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  // CDN URL for the widget bundle (hosted on jsDelivr via GitHub)
  const widgetCdnUrl = "https://cdn.jsdelivr.net/gh/pjrclarke/access-ally-widget@main/dist-embed/a11y-widget.iife.js";
  const cdnUrl = window.location.origin;
  const apiEndpoint = "https://orkmsolbgmfcdylexioq.supabase.co/functions/v1/widget-chat";

  // Fetch the default API key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase
          .from("widget_api_keys")
          .select("api_key")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        
        if (data && !error) {
          setApiKey(data.api_key);
        }
      } catch (e) {
        console.error("Failed to fetch API key:", e);
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  const scriptEmbedCode = `<!-- A11y Widget - Script Embed -->
<script>
  window.A11yWidgetConfig = {
    position: "${position}",
    primaryColor: "${primaryColor}",
    apiEndpoint: "${apiEndpoint}",
    apiKey: "${apiKey}"
  };
</script>
<script src="${widgetCdnUrl}" defer></script>`;

  const iframeEmbedCode = `<!-- A11y Widget - Iframe Embed (Recommended for testing) -->
<iframe 
  src="${cdnUrl}/widget?color=${encodeURIComponent(primaryColor)}&position=${position}&apiKey=${encodeURIComponent(apiKey)}" 
  style="position:fixed;bottom:0;${position === "bottom-right" ? "right" : "left"}:0;width:420px;height:600px;border:none;z-index:9999;pointer-events:none;"
  allow="microphone"
></iframe>
<style>
  /* Allow clicks only on the widget itself */
  iframe { pointer-events: none; }
  iframe:hover { pointer-events: auto; }
</style>`;

  const programmaticCode = `<script src="${widgetCdnUrl}"></script>
<script>
  A11yWidget.init({
    position: "${position}",
    primaryColor: "${primaryColor}",
    apiEndpoint: "${apiEndpoint}",
    apiKey: "${apiKey}"
  });
</script>`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Embed Widget</h1>
            <p className="text-muted-foreground">Add the accessibility widget to your website</p>
          </div>
        </div>

        {/* API Key Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Your API Key
            </CardTitle>
            <CardDescription>
              Required for the widget to communicate with our AI backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                value={isLoadingKey ? "Loading..." : apiKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => copyToClipboard(apiKey, "apiKey")}
                disabled={isLoadingKey || !apiKey}
              >
                {copied === "apiKey" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Keep this key secure. It's tied to your account and domain restrictions.
            </p>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Customize the widget appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <select
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Iframe Embed - Recommended */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Globe className="h-5 w-5" />
              Iframe Embed (Recommended)
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Works immediately - no build step required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-white dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border">
                <code>{iframeEmbedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(iframeEmbedCode, "iframe")}
              >
                {copied === "iframe" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Script Embed */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              Script Embed (CDN) 
              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">Ready to Use</span>
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Best for production - lightweight, no iframe needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-white dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm border">
                <code>{scriptEmbedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(scriptEmbedCode, "script")}
              >
                {copied === "script" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ✅ Hosted on jsDelivr CDN - ready for production use!
            </p>
          </CardContent>
        </Card>

        {/* Programmatic Init */}
        <Card>
          <CardHeader>
            <CardTitle>Programmatic Initialization</CardTitle>
            <CardDescription>For dynamic loading or single-page apps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{programmaticCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(programmaticCode, "programmatic")}
              >
                {copied === "programmatic" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test the Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Test the Widget</CardTitle>
            <CardDescription>Preview how the widget will look on your site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Visit the widget-only page to test it in isolation:
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={`${cdnUrl}/widget?color=${encodeURIComponent(primaryColor)}&position=${position}&apiKey=${encodeURIComponent(apiKey)}`}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="secondary"
                onClick={() => window.open(`/widget?color=${encodeURIComponent(primaryColor)}&position=${position}&apiKey=${encodeURIComponent(apiKey)}`, "_blank")}
              >
                Open
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300 text-sm space-y-3">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>API keys are <strong>domain-locked</strong> - they only work from your registered domain(s)</li>
              <li>Rate limited to 100 requests/minute to prevent abuse</li>
              <li>Keys can only access the chat feature - no sensitive data exposed</li>
              <li>Usage is tracked for monitoring and analytics</li>
            </ul>
            <Link 
              to="/security" 
              className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-200 hover:underline font-medium"
            >
              Learn more about API key security →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Embed;
