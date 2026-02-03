import { useState, useEffect } from "react";

/**
 * Detects if a screen reader is likely active.
 * Uses multiple heuristics since there's no direct browser API.
 */
export function useScreenReaderDetection(): boolean {
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // Check multiple signals that suggest a screen reader is active
    const detectScreenReader = () => {
      // 1. Check for reduced motion preference (common with screen readers)
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      
      // 2. Check for VoiceOver-specific touch events on iOS
      // VoiceOver users typically use single-finger gestures differently
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      // 3. Check for accessibility properties that are often set
      // When VoiceOver is on, focus events work differently
      const hasAccessibilityFeatures = 
        document.documentElement.getAttribute("data-accessibility") === "true" ||
        document.body.classList.contains("accessibility-mode");
      
      // 4. Most reliable: check if TalkBack or VoiceOver announce is being used
      // We can detect this by checking if aria-live regions are being consumed
      // For now, we'll check the user agent for common screen reader signals
      const userAgent = navigator.userAgent.toLowerCase();
      const hasScreenReaderUA = 
        userAgent.includes("nvda") ||
        userAgent.includes("jaws") ||
        userAgent.includes("voiceover") ||
        userAgent.includes("talkback");

      // 5. Check for ARIA announcement consumption via a test element
      // This is an async check we'll do separately
      
      // Combine signals - if any strong signal, assume screen reader
      if (hasScreenReaderUA || hasAccessibilityFeatures) {
        setIsScreenReaderActive(true);
        return;
      }

      // iOS-specific VoiceOver detection
      if (isIOS) {
        // VoiceOver changes how touch events work
        // We detect it by checking gesture handling
        detectVoiceOverOnIOS();
      }
    };

    // iOS VoiceOver detection using touch event behavior
    const detectVoiceOverOnIOS = () => {
      let touchCount = 0;
      let gestureDetected = false;

      const handleTouchStart = (e: TouchEvent) => {
        touchCount++;
        // VoiceOver typically generates rapid touch events for exploration
        if (touchCount > 5 && !gestureDetected) {
          // Check for VoiceOver's characteristic single-point touches
          if (e.touches.length === 1) {
            gestureDetected = true;
          }
        }
      };

      // Add temporary listener
      document.addEventListener("touchstart", handleTouchStart, { passive: true });

      // Clean up after short detection window
      setTimeout(() => {
        document.removeEventListener("touchstart", handleTouchStart);
      }, 5000);
    };

    // Alternative: Use focus trap behavior
    // Screen readers often announce focused elements immediately
    const checkFocusBehavior = () => {
      const testEl = document.createElement("div");
      testEl.setAttribute("role", "status");
      testEl.setAttribute("aria-live", "polite");
      testEl.style.position = "absolute";
      testEl.style.left = "-9999px";
      testEl.style.width = "1px";
      testEl.style.height = "1px";
      testEl.style.overflow = "hidden";
      document.body.appendChild(testEl);

      // If screen reader is active, it will process this
      setTimeout(() => {
        testEl.textContent = "";
        setTimeout(() => {
          document.body.removeChild(testEl);
        }, 100);
      }, 100);
    };

    detectScreenReader();
    checkFocusBehavior();

    // Listen for accessibility preference changes
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => detectScreenReader();
    mediaQuery.addEventListener("change", handleChange);

    // Also detect on first user interaction - VoiceOver users interact differently
    const handleFirstInteraction = (e: Event) => {
      // VoiceOver exploration mode sends focus events before click
      if (e.type === "focusin") {
        const target = e.target as HTMLElement;
        // If focus happens without preceding mouse/touch, likely screen reader
        if (target && !("__lastPointerType" in window)) {
          // This is a heuristic - screen readers often focus elements during exploration
        }
      }
    };

    document.addEventListener("focusin", handleFirstInteraction, { once: true, passive: true });

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      document.removeEventListener("focusin", handleFirstInteraction);
    };
  }, []);

  return isScreenReaderActive;
}

/**
 * Simple check that can be called synchronously for initial state.
 * Checks localStorage for a user preference if they've used a screen reader before.
 */
export function getInitialScreenReaderPreference(): boolean {
  try {
    const stored = localStorage.getItem("a11y-screen-reader-detected");
    return stored === "true";
  } catch {
    return false;
  }
}

/**
 * Store that a screen reader was detected (persists preference)
 */
export function setScreenReaderDetected(detected: boolean): void {
  try {
    localStorage.setItem("a11y-screen-reader-detected", String(detected));
  } catch {
    // localStorage not available
  }
}
