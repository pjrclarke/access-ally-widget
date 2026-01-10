import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Mic, MessageSquare, Volume2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="container relative py-12 sm:py-16 md:py-32 px-4 sm:px-6">
        <div className="grid gap-8 md:gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="hidden sm:inline">Now with AI-Powered Voice Navigation</span>
              <span className="sm:hidden">AI Voice Navigation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 animate-fade-in-up">
              Enhance Your Website's{" "}
              <span className="text-gradient-primary">Accessibility</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              An AI-powered widget that adds voice navigation, content summarization, and visual adjustments to help more users access your content.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity group w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" className="group w-full sm:w-auto">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Widget Preview */}
          <div className="relative lg:justify-self-end animate-fade-in w-full max-w-md mx-auto lg:max-w-none" style={{ animationDelay: "0.4s" }}>
            <div className="relative">
              {/* Browser mockup */}
              <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-border bg-secondary/50">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-destructive/60" />
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-warning/60" />
                    <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div className="h-5 sm:h-6 rounded-md bg-secondary flex items-center px-2 sm:px-3 text-[10px] sm:text-xs text-muted-foreground">
                      yourwebsite.com
                    </div>
                  </div>
                </div>

                {/* Content area */}
                <div className="p-4 sm:p-6 md:p-8 min-h-[200px] sm:min-h-[250px] md:min-h-[300px] bg-gradient-to-b from-secondary/20 to-background relative">
                  {/* Placeholder content lines */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="h-3 sm:h-4 w-3/4 bg-secondary rounded" />
                    <div className="h-3 sm:h-4 w-full bg-secondary rounded" />
                    <div className="h-3 sm:h-4 w-5/6 bg-secondary rounded" />
                    <div className="h-3 sm:h-4 w-2/3 bg-secondary rounded" />
                  </div>
                  <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                    <div className="h-2 sm:h-3 w-full bg-secondary/60 rounded" />
                    <div className="h-2 sm:h-3 w-4/5 bg-secondary/60 rounded" />
                    <div className="h-2 sm:h-3 w-full bg-secondary/60 rounded" />
                  </div>

                  {/* Widget floating button */}
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4">
                    <div className="relative">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full bg-gradient-primary shadow-lg flex items-center justify-center animate-pulse-glow cursor-pointer">
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-foreground" />
                      </div>
                      {/* Tooltip - hidden on mobile */}
                      <div className="absolute bottom-full right-0 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-card border border-border rounded-lg shadow-lg text-xs sm:text-sm whitespace-nowrap hidden sm:block">
                        <span className="text-foreground font-medium">Ask me anything!</span>
                        <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 h-2 w-2 bg-card border-r border-b border-border" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating feature cards - hidden on small screens */}
              <div className="absolute -left-4 top-1/4 p-2 sm:p-3 bg-card border border-border rounded-lg shadow-lg animate-float hidden lg:flex items-center gap-2">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
                </div>
                <span className="text-xs sm:text-sm font-medium">Voice Navigation</span>
              </div>

              <div className="absolute -right-4 top-1/2 p-2 sm:p-3 bg-card border border-border rounded-lg shadow-lg animate-float hidden lg:flex items-center gap-2" style={{ animationDelay: "1s" }}>
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="text-xs sm:text-sm font-medium">Ask Questions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
