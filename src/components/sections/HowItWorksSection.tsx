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
    <section id="how-it-works" className="py-12 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Get Started in{" "}
            <span className="text-gradient-primary">Three Simple Steps</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Adding accessibility to your website has never been easier. No coding expertise required.
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

                    {index === 1 && (
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 md:mt-4">
                        <div className="p-2 sm:p-3 rounded-lg border border-border bg-card text-center">
                          <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary mx-auto mb-1 sm:mb-2" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Brand Color</span>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg border border-border bg-card text-center">
                          <div className="text-base sm:text-lg mb-0.5 sm:mb-1">↘️</div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Position</span>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg border border-border bg-card text-center">
                          <div className="text-base sm:text-lg mb-0.5 sm:mb-1">🔊</div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Voice Style</span>
                        </div>
                      </div>
                    )}

                    {index === 2 && (
                      <div className="flex items-center gap-3 sm:gap-4 mt-3 md:mt-4 p-3 sm:p-4 rounded-lg bg-success/10 border border-success/20">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
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
