import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Globe, Activity, Key, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Security = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link 
          to="/embed" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Embed Setup
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Security & API Keys
          </h1>
          <p className="text-muted-foreground">
            Understanding how we protect your widget and your users
          </p>
        </div>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              How API Key Security Works
            </CardTitle>
            <CardDescription>
              Your API key is designed to be embedded in your website's code - here's why that's safe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Like Google Analytics, Stripe's publishable key, or Intercom, our widget uses a 
              <strong> domain-locked API key</strong> model. This means:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>The API key only works from your registered domain(s)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>Even if someone copies your key, it won't work on their website</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>The key can only access the chat feature - no sensitive data</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>You can revoke and regenerate keys instantly if needed</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Security Layers */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="w-5 h-5 text-blue-500" />
                Domain Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Every request is validated server-side:
              </p>
              <ul className="text-sm space-y-1.5">
                <li>• Origin header checked against allowed domains</li>
                <li>• Supports multiple domains per key</li>
                <li>• Subdomain matching (*.yourdomain.com)</li>
                <li>• Requests from unauthorized domains are rejected</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-orange-500" />
                Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Protection against abuse:
              </p>
              <ul className="text-sm space-y-1.5">
                <li>• 100 requests per minute per API key</li>
                <li>• Automatic throttling when limit reached</li>
                <li>• Clear error messages for users</li>
                <li>• Usage tracking for monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* What the key can access */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Scope Limitations
            </CardTitle>
            <CardDescription>
              Your API key has strictly limited permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-600 mb-2">✓ Can Access</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Accessibility chat responses</li>
                  <li>• Page navigation assistance</li>
                  <li>• Content explanations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-600 mb-2">✗ Cannot Access</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Your database or user data</li>
                  <li>• Admin functions</li>
                  <li>• Other API keys</li>
                  <li>• Billing information</li>
                  <li>• Any server-side resources</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Best Practices for Your Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">1</span>
              <div>
                <p className="font-medium">Register your production domain(s)</p>
                <p className="text-sm text-muted-foreground">Add your domain in the embed settings to lock your API key</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">2</span>
              <div>
                <p className="font-medium">Use separate keys for staging/production</p>
                <p className="text-sm text-muted-foreground">Create different API keys for different environments</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">3</span>
              <div>
                <p className="font-medium">Monitor your usage</p>
                <p className="text-sm text-muted-foreground">Check request counts to detect unusual activity</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0">4</span>
              <div>
                <p className="font-medium">Rotate keys periodically</p>
                <p className="text-sm text-muted-foreground">Generate new keys and deactivate old ones as a security practice</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Common Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Is it safe to have my API key visible in my website's source code?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! The key is domain-locked, so it only works from your website. This is the same security model used by Google Analytics, Stripe (publishable keys), and most embeddable widgets.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">What happens if someone tries to use my API key?</h4>
              <p className="text-sm text-muted-foreground">
                Requests from unauthorized domains are rejected with a 403 error. The key simply won't work outside your registered domain(s).
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Can I use the same key for multiple websites?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can add multiple domains to a single API key (comma-separated), or create separate keys for each site for better tracking.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">What if I hit the rate limit?</h4>
              <p className="text-sm text-muted-foreground">
                The widget will show a friendly message asking users to wait a moment. Normal usage rarely hits the limit (100 requests/minute per key).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Security;
