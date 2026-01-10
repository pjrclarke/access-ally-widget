import { useState, useCallback } from "react";

export interface AuditIssue {
  id: string;
  type: "error" | "warning" | "info";
  wcagCriteria: string;
  title: string;
  description: string;
  element?: string;
  howToFix: string;
}

export interface AuditResult {
  score: number;
  issues: AuditIssue[];
  passedChecks: number;
  totalChecks: number;
}

export function useAccessibilityAudit() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  const runAudit = useCallback(() => {
    setIsScanning(true);
    
    // Run audit asynchronously to not block UI
    setTimeout(() => {
      const issues: AuditIssue[] = [];
      let passedChecks = 0;
      const totalChecks = 12;

      // 1. Check for images without alt text (WCAG 1.1.1)
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          id: "img-alt",
          type: "error",
          wcagCriteria: "1.1.1",
          title: "Images missing alt text",
          description: `${imagesWithoutAlt.length} image(s) are missing alternative text, making them inaccessible to screen reader users.`,
          element: `<img src="...">`,
          howToFix: "Add descriptive alt attributes to all images. Use alt=\"\" for decorative images.",
        });
      } else {
        passedChecks++;
      }

      // 2. Check for empty links (WCAG 2.4.4)
      const emptyLinks = document.querySelectorAll('a:not([aria-label])');
      let emptyLinkCount = 0;
      emptyLinks.forEach((link) => {
        if (!link.textContent?.trim() && !link.querySelector('img[alt]')) {
          emptyLinkCount++;
        }
      });
      if (emptyLinkCount > 0) {
        issues.push({
          id: "empty-links",
          type: "error",
          wcagCriteria: "2.4.4",
          title: "Empty or unclear links",
          description: `${emptyLinkCount} link(s) have no accessible text, making their purpose unclear.`,
          element: `<a href="..."></a>`,
          howToFix: "Add descriptive text inside links or use aria-label attribute.",
        });
      } else {
        passedChecks++;
      }

      // 3. Check for form inputs without labels (WCAG 1.3.1)
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
      let unlabeledInputs = 0;
      inputs.forEach((input) => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        const isInsideLabel = input.closest('label');
        if (!hasLabel && !hasAriaLabel && !isInsideLabel) {
          unlabeledInputs++;
        }
      });
      if (unlabeledInputs > 0) {
        issues.push({
          id: "form-labels",
          type: "error",
          wcagCriteria: "1.3.1",
          title: "Form inputs missing labels",
          description: `${unlabeledInputs} form field(s) are missing associated labels.`,
          element: `<input type="text">`,
          howToFix: "Associate each input with a <label> element using the 'for' attribute, or add aria-label.",
        });
      } else {
        passedChecks++;
      }

      // 4. Check for missing document language (WCAG 3.1.1)
      const htmlLang = document.documentElement.getAttribute('lang');
      if (!htmlLang) {
        issues.push({
          id: "html-lang",
          type: "error",
          wcagCriteria: "3.1.1",
          title: "Missing page language",
          description: "The page language is not specified, which affects screen reader pronunciation.",
          element: `<html>`,
          howToFix: "Add a lang attribute to the <html> element, e.g., lang=\"en\".",
        });
      } else {
        passedChecks++;
      }

      // 5. Check for missing page title (WCAG 2.4.2)
      const pageTitle = document.title?.trim();
      if (!pageTitle) {
        issues.push({
          id: "page-title",
          type: "error",
          wcagCriteria: "2.4.2",
          title: "Missing page title",
          description: "The page has no title, making it hard for users to identify.",
          element: `<title></title>`,
          howToFix: "Add a descriptive <title> element in the <head> section.",
        });
      } else {
        passedChecks++;
      }

      // 6. Check for multiple H1s or missing H1 (WCAG 1.3.1)
      const h1s = document.querySelectorAll('h1');
      if (h1s.length === 0) {
        issues.push({
          id: "missing-h1",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Missing main heading",
          description: "The page has no H1 heading, which affects navigation for screen reader users.",
          element: `<h1>...</h1>`,
          howToFix: "Add a single H1 heading that describes the main content of the page.",
        });
      } else if (h1s.length > 1) {
        issues.push({
          id: "multiple-h1",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Multiple H1 headings",
          description: `The page has ${h1s.length} H1 headings. Pages should typically have only one.`,
          element: `<h1>...</h1>`,
          howToFix: "Use a single H1 for the main heading and H2-H6 for subheadings.",
        });
      } else {
        passedChecks++;
      }

      // 7. Check for skipped heading levels (WCAG 1.3.1)
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let skippedLevels = false;
      let lastLevel = 0;
      headings.forEach((h) => {
        const level = parseInt(h.tagName[1]);
        if (lastLevel > 0 && level > lastLevel + 1) {
          skippedLevels = true;
        }
        lastLevel = level;
      });
      if (skippedLevels) {
        issues.push({
          id: "heading-order",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Skipped heading levels",
          description: "Heading levels are not sequential (e.g., H2 followed by H4).",
          element: `<h2>...<h4>`,
          howToFix: "Use headings in order (H1 → H2 → H3) without skipping levels.",
        });
      } else {
        passedChecks++;
      }

      // 8. Check for buttons without accessible names (WCAG 4.1.2)
      const buttons = document.querySelectorAll('button, [role="button"]');
      let unlabeledButtons = 0;
      buttons.forEach((btn) => {
        const hasText = btn.textContent?.trim();
        const hasAriaLabel = btn.hasAttribute('aria-label');
        const hasAriaLabelledBy = btn.hasAttribute('aria-labelledby');
        const hasTitle = btn.hasAttribute('title');
        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
          unlabeledButtons++;
        }
      });
      if (unlabeledButtons > 0) {
        issues.push({
          id: "button-names",
          type: "error",
          wcagCriteria: "4.1.2",
          title: "Buttons missing accessible names",
          description: `${unlabeledButtons} button(s) have no accessible name.`,
          element: `<button></button>`,
          howToFix: "Add text content, aria-label, or title attribute to buttons.",
        });
      } else {
        passedChecks++;
      }

      // 9. Check for missing skip link (WCAG 2.4.1)
      const skipLink = document.querySelector('a[href^="#main"], a[href^="#content"], [class*="skip"]');
      if (!skipLink) {
        issues.push({
          id: "skip-link",
          type: "info",
          wcagCriteria: "2.4.1",
          title: "No skip link found",
          description: "A skip link helps keyboard users bypass navigation.",
          element: `<a href="#main">`,
          howToFix: "Add a 'Skip to main content' link at the top of the page.",
        });
      } else {
        passedChecks++;
      }

      // 10. Check for landmark regions (WCAG 1.3.1)
      const hasMain = document.querySelector('main, [role="main"]');
      const hasNav = document.querySelector('nav, [role="navigation"]');
      if (!hasMain) {
        issues.push({
          id: "landmark-main",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Missing main landmark",
          description: "No <main> element found. Landmarks help screen reader users navigate.",
          element: `<main>...</main>`,
          howToFix: "Wrap primary content in a <main> element.",
        });
      } else {
        passedChecks++;
      }
      if (!hasNav) {
        issues.push({
          id: "landmark-nav",
          type: "info",
          wcagCriteria: "1.3.1",
          title: "Missing navigation landmark",
          description: "No <nav> element found for navigation menus.",
          element: `<nav>...</nav>`,
          howToFix: "Wrap navigation menus in a <nav> element.",
        });
      } else {
        passedChecks++;
      }

      // 11. Check for tabindex > 0 (bad practice)
      const badTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
      let positiveTabindex = 0;
      badTabindex.forEach((el) => {
        const val = parseInt(el.getAttribute('tabindex') || '0');
        if (val > 0) positiveTabindex++;
      });
      if (positiveTabindex > 0) {
        issues.push({
          id: "tabindex-positive",
          type: "warning",
          wcagCriteria: "2.4.3",
          title: "Positive tabindex values",
          description: `${positiveTabindex} element(s) have tabindex > 0, which disrupts natural focus order.`,
          element: `tabindex="1"`,
          howToFix: "Remove positive tabindex values. Use tabindex=\"0\" or \"-1\" only.",
        });
      } else {
        passedChecks++;
      }

      // Calculate score
      const score = Math.round((passedChecks / totalChecks) * 100);

      setResult({
        score,
        issues,
        passedChecks,
        totalChecks,
      });
      setIsScanning(false);
    }, 500);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isScanning,
    result,
    runAudit,
    clearResult,
  };
}
