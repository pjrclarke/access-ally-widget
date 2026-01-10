import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small websites and blogs",
    price: 29,
    period: "/month",
    originalPrice: null,
    features: [
      "1 website",
      "1,000 AI interactions/month",
      "Voice navigation",
      "Visual accessibility tools",
      "Text-to-speech",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Business",
    description: "For growing companies",
    price: 79,
    period: "/month",
    originalPrice: 99,
    features: [
      "Up to 5 websites",
      "10,000 AI interactions/month",
      "Everything in Starter",
      "Custom branding",
      "Priority support",
      "Analytics dashboard",
      "Remove widget branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: 249,
    period: "/month",
    originalPrice: null,
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
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Scalable{" "}
            <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                plan.popular 
                  ? "border-primary shadow-lg scale-105 md:scale-110" 
                  : "border-border/50 hover:border-primary/50"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary" />
              )}
              
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${plan.originalPrice}
                      </span>
                    )}
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">billed monthly</p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  className={cn(
                    "w-full",
                    plan.popular 
                      ? "bg-gradient-primary hover:opacity-90" 
                      : ""
                  )}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Guarantee */}
        <div className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary border border-border">
            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium">
              14-day free trial • Cancel anytime • No credit card required
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Need more AI interactions? Additional usage available at $0.005 per interaction.
          </p>
        </div>
      </div>
    </section>
  );
}
