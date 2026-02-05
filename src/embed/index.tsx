import React from "react";
import { createRoot } from "react-dom/client";
import { EmbeddableWidget } from "./EmbeddableWidget";

// Debug logging for embed troubleshooting
const DEBUG = false;
function log(...args: unknown[]) {
  if (DEBUG || (window as unknown as Record<string, unknown>).A11Y_DEBUG) {
    console.log("[A11yWidget]", ...args);
  }
}

// Global configuration interface
interface A11yWidgetConfig {
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  apiEndpoint?: string;
  apiKey?: string;
}

declare global {
  interface Window {
    A11yWidget?: {
      init: (config?: A11yWidgetConfig) => void;
      version: string;
    };
    A11yWidgetConfig?: A11yWidgetConfig;
  }
}

const VERSION = "1.0.1";

// Initialize the widget
function init(config: A11yWidgetConfig = {}) {
  log("Initializing widget with config:", config);
  
  try {
    // Create container if it doesn't exist
    let container = document.getElementById("a11y-widget-root");
    if (!container) {
      container = document.createElement("div");
      container.id = "a11y-widget-root";
      document.body.appendChild(container);
      log("Created widget container");
    }

    // Render the widget
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <EmbeddableWidget
          position={config.position || "bottom-right"}
          primaryColor={config.primaryColor || "#6366f1"}
          apiEndpoint={config.apiEndpoint}
          apiKey={config.apiKey}
        />
      </React.StrictMode>
    );
    
    log("Widget rendered successfully");
    console.log(`[A11yWidget] v${VERSION} loaded successfully`);
  } catch (error) {
    console.error("[A11yWidget] Failed to initialize:", error);
  }
}

// Expose to window
window.A11yWidget = { init, version: VERSION };

// Auto-init if config is present
if (typeof window !== "undefined") {
  log("Checking for auto-init config...");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.A11yWidgetConfig) {
        log("Auto-init from DOMContentLoaded");
        init(window.A11yWidgetConfig);
      }
    });
  } else if (window.A11yWidgetConfig) {
    log("Auto-init immediately (DOM ready)");
    init(window.A11yWidgetConfig);
  }
}

export { init, EmbeddableWidget };
