import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-12 md:py-32">
      <div className="container px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-primary p-6 sm:p-8 md:p-16">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 sm:mb-6">
              Ready to Make Your Website Accessible to Everyone?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of websites that trust AccessibilityAI to provide a better experience for all their users.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 transition-colors group w-full sm:w-auto"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 transition-colors w-full sm:w-auto"
              >
                Schedule a Demo
              </Button>
            </div>

            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-primary-foreground/60">
              14-day free trial • No credit card required • Setup in under 5 minutes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
