import React from "react";
import { createRoot } from "react-dom/client";
import { EmbeddableWidget } from "./EmbeddableWidget";

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
    };
    A11yWidgetConfig?: A11yWidgetConfig;
  }
}

// Initialize the widget
function init(config: A11yWidgetConfig = {}) {
  // Create container if it doesn't exist
  let container = document.getElementById("a11y-widget-root");
  if (!container) {
    container = document.createElement("div");
    container.id = "a11y-widget-root";
    document.body.appendChild(container);
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
}

// Expose to window
window.A11yWidget = { init };

// Auto-init if config is present
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.A11yWidgetConfig) {
        init(window.A11yWidgetConfig);
      }
    });
  } else if (window.A11yWidgetConfig) {
    init(window.A11yWidgetConfig);
  }
}

export { init, EmbeddableWidget };
