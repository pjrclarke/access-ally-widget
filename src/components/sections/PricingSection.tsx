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
    <section id="pricing" className="py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Scalable{" "}
            <span className="text-gradient-primary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. Cancel anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50 hover:border-primary/50"
            >
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">£{plan.price}</span>
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

        {/* Guarantee */}
        <div className="mt-12 text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-secondary border border-border">
            <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium">
              30-day money-back guarantee
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Need more AI interactions? Additional usage available at £0.004 per interaction.
          </p>
        </div>
      </div>
    </section>
  );
}
