import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small websites and blogs",
    price: 49,
    period: "/month",
    features: [
      "1 website",
      "1,000 AI interactions/month",
      "Voice navigation",
      "Visual accessibility tools",
      "Text-to-speech",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    name: "Business",
    description: "For growing companies",
    price: 149,
    period: "/month",
    features: [
      "Up to 5 websites",
      "10,000 AI interactions/month",
      "Everything in Starter",
      "Custom branding",
      "Priority support",
      "Analytics dashboard",
      "Remove widget branding",
    ],
    cta: "Get Started",
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: 399,
    period: "/month",
    features: [
      "Unlimited websites",
      "Unlimited AI interactions",
      "Everything in Business",
      "Custom AI training",
      "White-label solution",
      "Dedicated support",
      "SLA guarantee",
      "SSO & advanced security",
    ],
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-12 md:py-32">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Simple, Scalable{" "}
            <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Choose the plan that fits your needs. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/50"
            >
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                {/* Price */}
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-3xl sm:text-4xl font-bold">£{plan.price}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">billed monthly</p>
                </div>

                {/* Features */}
                <ul className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 sm:gap-3">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional usage note */}
        <div className="mt-8 sm:mt-12 text-center px-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Need more AI interactions? Additional usage available at £0.004 per interaction.
          </p>
        </div>
      </div>
    </section>
  );
}
