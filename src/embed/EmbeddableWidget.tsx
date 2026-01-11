import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Accessibility,
} from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface EmbeddableWidgetProps {
  position?: "bottom-right" | "bottom-left";
  primaryColor?: string;
  apiEndpoint?: string;
  apiKey?: string;
}

// Inline styles to avoid Tailwind dependency in embed
const styles = {
  container: (position: string): React.CSSProperties => ({
    position: "fixed",
    bottom: "20px",
    [position === "bottom-right" ? "right" : "left"]: "20px",
    zIndex: 9999,
    fontFamily: "system-ui, -apple-system, sans-serif",
  }),
  button: (primaryColor: string): React.CSSProperties => ({
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: primaryColor,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "transform 0.2s, box-shadow 0.2s",
  }),
  panel: (isOpen: boolean): React.CSSProperties => ({
    position: "absolute",
    bottom: "70px",
    right: "0",
    width: "min(380px, calc(100vw - 40px))",
    height: "min(500px, calc(100vh - 120px))",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    display: isOpen ? "flex" : "none",
    flexDirection: "column",
    overflow: "hidden",
  }),
  header: (primaryColor: string): React.CSSProperties => ({
    background: primaryColor,
    color: "white",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  messages: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  userMessage: {
    alignSelf: "flex-end" as const,
    background: "#f3f4f6",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    maxWidth: "80%",
    fontSize: "14px",
  },
  assistantMessage: (primaryColor: string): React.CSSProperties => ({
    alignSelf: "flex-start",
    background: primaryColor + "15",
    padding: "10px 14px",
    borderRadius: "16px 16px 16px 4px",
    maxWidth: "80%",
    fontSize: "14px",
  }),
  inputContainer: {
    padding: "12px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    fontSize: "14px",
    outline: "none",
  },
  iconButton: (primaryColor: string, active?: boolean): React.CSSProperties => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: active ? primaryColor : "#f3f4f6",
    color: active ? "white" : "#6b7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  }),
};

export function EmbeddableWidget({
  position = "bottom-right",
  primaryColor = "#6366f1",
  apiEndpoint,
  apiKey,
}: EmbeddableWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasSpeakingRef = useRef(false);

  const { speak, stop: stopSpeaking, isSpeaking, unlockAudio } = useSpeechSynthesis({
    rate: 0.9,
    onError: (error) => console.error("Speech synthesis error:", error),
  });

  const handleVoiceResult = useCallback((finalTranscript: string) => {
    if (finalTranscript.trim()) {
      setInput(finalTranscript);
      // Auto-send after voice input
      setTimeout(() => {
        const form = document.getElementById("widget-form") as HTMLFormElement;
        if (form) form.requestSubmit();
      }, 100);
    }
  }, []);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported: isSpeechRecognitionSupported,
  } = useSpeechRecognition({
    onResult: handleVoiceResult,
    continuous: true,
    autoSendDelay: 1500,
  });

  // Auto-restart listening after AI finishes speaking in conversation mode
  useEffect(() => {
    if (wasSpeakingRef.current && !isSpeaking && conversationMode && !isListening) {
      const timer = setTimeout(() => {
        if (conversationMode && !isListening) {
          startListening();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, conversationMode, isListening, startListening]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getPageContext = () => {
    const mainContent = document.body.innerText.slice(0, 3000);
    const interactiveElements = Array.from(
      document.querySelectorAll("a, button, input, [role='button']")
    )
      .slice(0, 50)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 50) || "",
        id: el.id || undefined,
      }))
      .filter((el) => el.text);

    return {
      pageContent: mainContent,
      interactiveElements: JSON.stringify(interactiveElements),
      pageUrl: window.location.href,
    };
  };

  const parseAndExecuteActions = (text: string) => {
    const actionRegex = /\[ACTION:(CLICK|SCROLL|FOCUS|FILL):([^\]]+)\]/gi;
    let match;

    while ((match = actionRegex.exec(text)) !== null) {
      const [, action, target] = match;
      const [elementTarget, fillValue] = target.split(":");

      setTimeout(() => {
        const selectors = [
          `#${elementTarget}`,
          `[aria-label*="${elementTarget}" i]`,
          `button:has-text("${elementTarget}")`,
          `a:has-text("${elementTarget}")`,
        ];

        let element: Element | null = null;
        for (const selector of selectors) {
          try {
            element = document.querySelector(selector);
            if (element) break;
          } catch {
            // Try text content match
            const allElements = document.querySelectorAll("a, button, input, section, [id]");
            element = Array.from(allElements).find(
              (el) =>
                el.textContent?.toLowerCase().includes(elementTarget.toLowerCase()) ||
                el.id?.toLowerCase().includes(elementTarget.toLowerCase())
            ) || null;
            if (element) break;
          }
        }

        if (element) {
          switch (action.toUpperCase()) {
            case "CLICK":
              (element as HTMLElement).click();
              break;
            case "SCROLL":
              element.scrollIntoView({ behavior: "smooth", block: "start" });
              break;
            case "FOCUS":
              (element as HTMLElement).focus();
              break;
            case "FILL":
              if (element instanceof HTMLInputElement) {
                element.value = fillValue || "";
                element.dispatchEvent(new Event("input", { bubbles: true }));
              }
              break;
          }
        }
      }, 500);
    }

    return text.replace(actionRegex, "").trim();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    if (isListening) {
      stopListening();
    }

    try {
      const context = getPageContext();
      const endpoint = apiEndpoint || `${window.location.origin}/functions/v1/widget-chat`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: userMessage,
          ...context,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || "";
                if (content) {
                  fullResponse += content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: fullResponse,
                    };
                    return updated;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Process actions and speak
        const cleanedResponse = parseAndExecuteActions(fullResponse);
        if (isSpeechEnabled && cleanedResponse) {
          speak(cleanedResponse);
        }
      }
    } catch (error) {
      console.error("Widget error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    unlockAudio();

    if (isListening) {
      stopListening();
      setConversationMode(false);
    } else {
      setConversationMode(true);
      startListening();
    }
  };

  const toggleSpeech = () => {
    unlockAudio();
    if (isSpeechEnabled) {
      stopSpeaking();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  return (
    <div style={styles.container(position)}>
      <div style={styles.panel(isOpen)}>
        <div style={styles.header(primaryColor)}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Accessibility size={20} />
            <span style={{ fontWeight: 600 }}>Accessibility Assistant</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={toggleSpeech}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label={isSpeechEnabled ? "Disable speech" : "Enable speech"}
            >
              {isSpeechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
              <p style={{ marginBottom: "8px" }}>👋 Hi! I can help you navigate this page.</p>
              <p style={{ fontSize: "13px" }}>Ask me anything or use voice commands!</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={
                msg.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage(primaryColor)
              }
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div style={styles.assistantMessage(primaryColor)}>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form id="widget-form" onSubmit={sendMessage} style={styles.inputContainer}>
          {isSpeechRecognitionSupported && (
            <button
              type="button"
              onClick={handleVoiceToggle}
              style={styles.iconButton(primaryColor, isListening)}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type or speak..."}
            style={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              ...styles.iconButton(primaryColor, true),
              opacity: isLoading || !input.trim() ? 0.5 : 1,
            }}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button(primaryColor)}
        aria-label={isOpen ? "Close accessibility assistant" : "Open accessibility assistant"}
      >
        {isOpen ? <X size={24} color="white" /> : <MessageCircle size={24} color="white" />}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default EmbeddableWidget;
