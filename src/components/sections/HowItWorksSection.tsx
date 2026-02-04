import { Code, Palette, Rocket, Key, Volume2, Layout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: Key,
    title: "Create Your API Key",
    description: "Sign up and generate your unique API key in seconds. Domain-lock it for security.",
    code: null,
    showDashboardPreview: false,
  },
  {
    number: "02",
    icon: Palette,
    title: "Customise Your Widget",
    description: "Set your brand colours, widget position, and voice settings from your dashboard.",
    code: null,
    showDashboardPreview: true,
  },
  {
    number: "03",
    icon: Code,
    title: "Add One Line of Code",
    description: "Copy and paste your personalised embed code. That's it—you're live!",
    code: '<script src="https://cdn.a11ylabs.co.uk/widget.js" data-key="YOUR_KEY"></script>',
    showDashboardPreview: false,
  },
];

export function HowItWorksSection() {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="py-12 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Get Started in{" "}
            <span className="text-gradient-primary">Three Simple Steps</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Adding accessibility to your website has never been easier. Sign up and customise in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line - hidden on mobile */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary/20 hidden md:block" />

            <div className="space-y-8 md:space-y-12">
              {steps.map((step, index) => (
                <div 
                  key={step.number} 
                  className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8"
                >
                  {/* Step number */}
                  <div className="relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-base sm:text-lg shadow-lg">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 md:mb-4">
                      {step.description}
                    </p>
                    
                    {step.code && (
                      <div className="relative">
                        <pre className="p-3 sm:p-4 rounded-lg bg-foreground text-primary-foreground text-xs sm:text-sm overflow-x-auto">
                          <code className="break-all sm:break-normal">{step.code}</code>
                        </pre>
                        <button 
                          className="absolute top-2 right-2 px-2 sm:px-3 py-1 text-xs font-medium rounded bg-primary/20 text-primary-foreground hover:bg-primary/30 transition-colors"
                          onClick={() => navigator.clipboard.writeText(step.code!)}
                        >
                          Copy
                        </button>
                      </div>
                    )}

                    {/* Dashboard Preview for Customisation Step */}
                    {step.showDashboardPreview && (
                      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                          <div className="h-3 w-3 rounded-full bg-red-400" />
                          <div className="h-3 w-3 rounded-full bg-yellow-400" />
                          <div className="h-3 w-3 rounded-full bg-green-400" />
                          <span className="ml-2 text-xs text-muted-foreground">Dashboard Preview</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Color Picker Preview */}
                          <div className="p-3 rounded-lg border border-border bg-background">
                            <div className="flex items-center gap-2 mb-2">
                              <Palette className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">Brand Colors</span>
                            </div>
                            <div className="flex gap-2">
                              <div className="h-8 w-8 rounded-lg bg-primary border-2 border-primary-foreground/20" />
                              <div className="h-8 w-8 rounded-lg bg-accent border-2 border-primary-foreground/20" />
                            </div>
                          </div>

                          {/* Position Preview */}
                          <div className="p-3 rounded-lg border border-border bg-background">
                            <div className="flex items-center gap-2 mb-2">
                              <Layout className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">Position</span>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex-1 h-8 rounded border border-border relative">
                                <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-primary" />
                              </div>
                              <div className="flex-1 h-8 rounded border border-border/50 relative opacity-50">
                                <div className="absolute bottom-1 left-1 h-3 w-3 rounded-full bg-muted" />
                              </div>
                            </div>
                          </div>

                          {/* Voice Preview */}
                          <div className="p-3 rounded-lg border border-border bg-background">
                            <div className="flex items-center gap-2 mb-2">
                              <Volume2 className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">Voice</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full w-3/5 bg-primary rounded-full" />
                              </div>
                              <span className="text-[10px] text-muted-foreground">Rate: 1.0x</span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full mt-4 bg-gradient-primary"
                          onClick={() => navigate("/auth")}
                        >
                          Try the Dashboard
                        </Button>
                      </div>
                    )}

                    {index === 0 && (
                      <div className="flex items-center gap-3 sm:gap-4 mt-3 md:mt-4 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Key className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-primary text-sm sm:text-base">Public Key = Secure</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Domain-locked and rate-limited. Safe to embed.</p>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="flex items-center gap-3 sm:gap-4 mt-3 md:mt-4 p-3 sm:p-4 rounded-lg bg-success/10 border border-success/20">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                          <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-success text-sm sm:text-base">You're WCAG 2.1 AA Compliant!</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Ready for all users and ADA requirements.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
