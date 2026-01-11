import { EmbeddableWidget } from "@/embed/EmbeddableWidget";
import { useSearchParams } from "react-router-dom";

const Widget = () => {
  const [searchParams] = useSearchParams();
  const primaryColor = searchParams.get("color") || "#6366f1";
  const position = (searchParams.get("position") as "bottom-right" | "bottom-left") || "bottom-right";
  const apiKey = searchParams.get("apiKey") || "";

  // Construct the API endpoint with the origin
  const apiEndpoint = `${window.location.origin}/functions/v1/widget-chat`;

  return (
    <div 
      style={{ 
        position: "fixed",
        inset: 0,
        background: "transparent",
        pointerEvents: "none"
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <EmbeddableWidget
          position={position}
          primaryColor={primaryColor}
          apiEndpoint={apiEndpoint}
          apiKey={apiKey}
        />
      </div>
    </div>
  );
};

export default Widget;
