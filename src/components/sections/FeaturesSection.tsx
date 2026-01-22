import { 
  Mic, 
  FileText, 
  MessageSquare, 
  Volume2, 
  Keyboard, 
  Eye,
  Zap,
  Shield,
  Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Mic,
    title: "Voice Navigation",
    description: "Navigate any website using natural voice commands. Just speak to scroll, click, and explore.",
    color: "primary",
  },
  {
    icon: FileText,
    title: "Content Summarisation",
    description: "Get AI-powered summaries of any page or section. Understand content faster and easier.",
    color: "accent",
  },
  {
    icon: MessageSquare,
    title: "Interactive Q&A",
    description: "Ask questions about any page content and get instant, accurate answers.",
    color: "primary",
  },
  {
    icon: Volume2,
    title: "Text-to-Speech",
    description: "Listen to any content with natural, human-like voices. Supports 29+ languages.",
    color: "accent",
  },
  {
    icon: Keyboard,
    title: "Keyboard Navigation",
    description: "Full keyboard support for all widget features. No mouse required.",
    color: "primary",
  },
  {
    icon: Eye,
    title: "Screen Reader Support",
    description: "Automatic detection and enhanced support for NVDA, JAWS, and VoiceOver.",
    color: "accent",
  },
];

const highlights = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Less than 50KB. Loads asynchronously with zero impact on page speed.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "No personal data collected. GDPR and CCPA compliant by design.",
  },
  {
    icon: Globe,
    title: "29+ Languages",
    description: "Full multilingual support for global accessibility.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 md:py-32">
      <div className="container px-4 sm:px-6">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
            Powerful Features for{" "}
            <span className="text-gradient-primary">Enhanced Accessibility</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Tools to help your users navigate, understand, and interact with your content more easily—powered by AI.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-10 md:mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4 sm:p-6">
                <div className={`inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg mb-3 sm:mb-4 ${
                  feature.color === "primary" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent"
                }`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Highlights */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 p-4 sm:p-6 md:p-8 rounded-2xl bg-secondary/50 border border-border">
          {highlights.map((item) => (
            <div key={item.title} className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base">{item.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
