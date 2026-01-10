import { Accessibility } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Demo", href: "#demo" },
    { label: "Documentation", href: "#docs" },
  ],
  company: [
    { label: "About", href: "#about" },
    { label: "Blog", href: "#blog" },
    { label: "Careers", href: "#careers" },
    { label: "Contact", href: "#contact" },
  ],
  legal: [
    { label: "Privacy Policy", href: "#privacy" },
    { label: "Terms of Service", href: "#terms" },
    { label: "Cookie Policy", href: "#cookies" },
    { label: "VPAT", href: "#vpat" },
  ],
  support: [
    { label: "Help Center", href: "#help" },
    { label: "Installation Guide", href: "#install" },
    { label: "API Reference", href: "#api" },
    { label: "Status", href: "#status" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-primary">
                <Accessibility className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span>
                <span className="text-gradient-primary">Accessibility</span>
                <span className="text-foreground">AI</span>
              </span>
            </a>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
              Making the web accessible for everyone with AI-powered voice navigation and content assistance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Product</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Company</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:block">
            <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Legal</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden sm:block">
            <h3 className="font-semibold text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Support</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile-only collapsed links */}
        <div className="grid grid-cols-2 gap-6 mt-6 sm:hidden">
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Legal</h3>
            <ul className="space-y-1.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm">Support</h3>
            <ul className="space-y-1.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} AccessibilityAI. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-success/10 text-success text-[10px] sm:text-xs font-medium">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-success animate-pulse" />
              WCAG 2.1 AA Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
