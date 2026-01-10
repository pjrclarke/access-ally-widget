import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Embed = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  // Get the current origin for the API endpoint
  const apiEndpoint = `${window.location.origin}/functions/v1/widget-chat`;

  const embedCode = `<!-- Accessibility Widget -->
<script>
  window.A11yWidgetConfig = {
    position: "${position}",
    primaryColor: "${primaryColor}",
    apiEndpoint: "${apiEndpoint}"
  };
</script>
<script src="${window.location.origin}/a11y-widget.iife.js" defer></script>`;

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

        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>
              Copy and paste this code before the closing <code>&lt;/body&gt;</code> tag
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{embedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(embedCode, "embed")}
              >
                {copied === "embed" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Alternative: Direct script loading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you prefer, you can also initialize the widget programmatically:
            </p>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{`<script src="${window.location.origin}/a11y-widget.iife.js"></script>
<script>
  A11yWidget.init({
    position: "bottom-right",
    primaryColor: "#6366f1",
    apiEndpoint: "${apiEndpoint}"
  });
</script>`}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`<script src="${window.location.origin}/a11y-widget.iife.js"></script>
<script>
  A11yWidget.init({
    position: "bottom-right",
    primaryColor: "#6366f1",
    apiEndpoint: "${apiEndpoint}"
  });
</script>`, "direct")}
              >
                {copied === "direct" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200">Important Note</CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
            <p>
              The widget script needs to be built and hosted. For testing, you can:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Build the widget bundle locally</li>
              <li>Host the generated <code>a11y-widget.iife.js</code> file</li>
              <li>Or use an iframe to embed this app directly</li>
            </ol>
            <p className="mt-4">
              <strong>For immediate testing</strong>, use the iframe method below:
            </p>
            <div className="relative mt-2">
              <pre className="bg-white dark:bg-gray-900 p-3 rounded-lg overflow-x-auto text-xs border">
                <code>{`<iframe 
  src="${window.location.origin}/?embed=true" 
  style="position:fixed;bottom:0;right:0;width:400px;height:550px;border:none;z-index:9999;"
></iframe>`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Embed;
