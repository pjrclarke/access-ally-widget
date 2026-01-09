import { Code, Palette, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Code,
    title: "Add One Line of Code",
    description: "Copy and paste a single script tag into your website. No complex setup or configuration needed.",
    code: '<script src="https://cdn.accessibilityai.com/widget.js" data-key="YOUR_KEY"></script>',
  },
  {
    number: "02",
    icon: Palette,
    title: "Customize Your Widget",
    description: "Match your brand with customizable colors, position, and behavior. Or use our beautiful defaults.",
    code: null,
  },
  {
    number: "03",
    icon: Rocket,
    title: "Launch & Delight Users",
    description: "Your website is now accessible to everyone. Users can navigate by voice, ask questions, and more.",
    code: null,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-secondary/30">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started in{" "}
            <span className="text-gradient-primary">Three Simple Steps</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Adding accessibility to your website has never been easier. No coding expertise required.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-primary/20 hidden md:block" />

            <div className="space-y-12">
              {steps.map((step, index) => (
                <div 
                  key={step.number} 
                  className="relative flex gap-6 md:gap-8"
                >
                  {/* Step number */}
                  <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg shadow-lg">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    
                    {step.code && (
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-foreground text-primary-foreground text-sm overflow-x-auto">
                          <code>{step.code}</code>
                        </pre>
                        <button 
                          className="absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded bg-primary/20 text-primary-foreground hover:bg-primary/30 transition-colors"
                          onClick={() => navigator.clipboard.writeText(step.code!)}
                        >
                          Copy
                        </button>
                      </div>
                    )}

                    {index === 1 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-3 rounded-lg border border-border bg-card text-center">
                          <div className="h-6 w-6 rounded-full bg-primary mx-auto mb-2" />
                          <span className="text-xs text-muted-foreground">Brand Color</span>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-card text-center">
                          <div className="text-lg mb-1">↘️</div>
                          <span className="text-xs text-muted-foreground">Position</span>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-card text-center">
                          <div className="text-lg mb-1">🔊</div>
                          <span className="text-xs text-muted-foreground">Voice Style</span>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="flex items-center gap-4 mt-4 p-4 rounded-lg bg-success/10 border border-success/20">
                        <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                          <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-success">You're WCAG 2.1 AA Compliant!</p>
                          <p className="text-sm text-muted-foreground">Ready for all users and ADA requirements.</p>
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
