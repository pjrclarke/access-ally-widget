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
    title: "Content Summarization",
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
    <section id="features" className="py-20 md:py-32">
      <div className="container">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features for{" "}
            <span className="text-gradient-primary">Complete Accessibility</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything your users need to navigate, understand, and interact with your website—powered by cutting-edge AI.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg mb-4 ${
                  feature.color === "primary" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent"
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
              {/* Hover gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Highlights */}
        <div className="grid gap-6 md:grid-cols-3 p-8 rounded-2xl bg-secondary/50 border border-border">
          {highlights.map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
