import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI-powered voice navigation work?",
    answer: "Our widget uses advanced speech recognition to understand natural voice commands. Users can say things like 'scroll down', 'click the login button', or 'read this section' and the widget will perform the action. It works with all modern browsers and requires no setup from your users.",
  },
  {
    question: "Will this slow down my website?",
    answer: "Not at all! Our widget is less than 50KB and loads asynchronously, meaning it doesn't block any of your page content from loading. We've optimised every aspect for performance, so your Lighthouse scores won't be affected.",
  },
  {
    question: "Is this WCAG compliant?",
    answer: "Yes! Accessibility A11y helps your website meet WCAG 2.1 AA compliance requirements. Our widget itself is also fully accessible, supporting keyboard navigation and screen readers. We provide documentation for your compliance audits.",
  },
  {
    question: "What's included in the 'lifetime updates'?",
    answer: "Professional and Enterprise licences include all future updates and improvements to the widget at no additional cost. This includes new features, AI model improvements, language additions, and security updates, forever.",
  },
  {
    question: "Can I customise the widget's appearance?",
    answer: "Absolutely! You can customise the button colour, position (any corner), size, and even the icon. Professional and Enterprise plans allow full white-labelling, including custom branding and removing our 'Powered by' badge.",
  },
  {
    question: "How does the one-time licence work?",
    answer: "When you purchase a licence, you receive a unique licence key that activates the widget on your domain(s). There are no recurring fees. You pay once and use the widget forever. Different plans allow different numbers of domains.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee, no questions asked. If Accessibility A11y doesn't meet your needs, simply contact us within 30 days of purchase for a full refund.",
  },
  {
    question: "Can I try it before buying?",
    answer: "Yes! We offer a 14-day free trial with full functionality. No credit card required. You can test all features on your website before making a purchase decision.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-12 md:py-32 bg-secondary/30">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Frequently Asked{" "}
            <span className="text-gradient-primary">Questions</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Everything you need to know about Accessibility A11y. Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-4 sm:px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-3 sm:py-4">
                  <span className="font-medium text-sm sm:text-base pr-2">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-3 sm:pb-4 text-sm sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-16 text-center">
          <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">
            Still have questions?
          </p>
          <a 
            href="#contact" 
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline text-sm sm:text-base"
          >
            Contact our team
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
