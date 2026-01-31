import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Accessibility } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a 
          href="/" 
          className="flex items-center gap-2 text-xl font-bold"
          aria-label="AccessibilityAI Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <Accessibility className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">
            <span className="text-gradient-primary">Accessibility</span>
            <span className="text-foreground">AI</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? null : user ? (
            <Button 
              size="sm" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "max-h-96 border-t border-border" : "max-h-0"
        )}
      >
        <nav className="container py-4 flex flex-col gap-2" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-3 text-sm font-medium text-muted-foreground rounded-md hover:bg-secondary hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-4 px-4 border-t border-border mt-2">
            {loading ? null : user ? (
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => { setIsMobileMenuOpen(false); navigate("/dashboard"); }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/auth"); }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/auth"); }}
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
