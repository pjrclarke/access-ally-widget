import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mic, 
  MicOff, 
  X, 
  Send, 
  Volume2, 
  VolumeX,
  Accessibility,
  Loader2,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { speak, stop: stopSpeaking } = useSpeechSynthesis({
    rate: 0.9,
    onError: (error) => console.error("Speech synthesis error:", error),
  });

  const handleVoiceResult = useCallback((transcript: string) => {
    setInputValue(transcript);
  }, []);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported: isVoiceSupported 
  } = useSpeechRecognition({
    onResult: handleVoiceResult,
    onError: (error) => {
      toast({
        title: "Voice Error",
        description: error === "not-allowed" 
          ? "Microphone access denied. Please enable microphone permissions."
          : "Voice recognition error. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getPageContent = useCallback(() => {
    // Get main content for context
    const mainContent = document.querySelector("main")?.textContent || 
                       document.body.textContent || "";
    // Limit to first 2000 characters
    return mainContent.slice(0, 2000).trim();
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: messageText,
            pageContent: getPageContent(),
            pageUrl: window.location.href,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait for more
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Speak the response if enabled
      if (isSpeechEnabled && assistantContent) {
        speak(assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.` 
      }]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, getPageContent, isSpeechEnabled, speak, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    sendMessage(inputValue);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      // Send the message after stopping
      if (inputValue.trim()) {
        sendMessage(inputValue);
      }
    } else {
      startListening();
    }
  };

  const toggleSpeech = () => {
    if (isSpeechEnabled) {
      stopSpeaking();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "bg-gradient-primary hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30",
          "flex items-center justify-center",
          isOpen && "rotate-90 scale-90"
        )}
        aria-label={isOpen ? "Close accessibility assistant" : "Open accessibility assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <Accessibility className="h-6 w-6 text-primary-foreground" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]",
          "rounded-2xl border border-border bg-card shadow-2xl",
          "transition-all duration-300 origin-bottom-right",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        role="dialog"
        aria-label="Accessibility Assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Accessibility className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Accessibility Assistant</h2>
              <p className="text-xs text-muted-foreground">Ask me anything about this page</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSpeech}
              aria-label={isSpeechEnabled ? "Disable voice responses" : "Enable voice responses"}
              className="h-8 w-8"
            >
              {isSpeechEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize assistant"
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="h-[320px] overflow-y-auto p-4 space-y-4"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Accessibility className="h-12 w-12 mb-4 opacity-30" />
              <p className="font-medium">How can I help you today?</p>
              <p className="text-sm mt-1">Ask about this page or use voice commands</p>
              <div className="mt-4 grid gap-2 w-full max-w-[280px]">
                <button
                  onClick={() => sendMessage("Summarize this page for me")}
                  className="px-3 py-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  📄 Summarize this page
                </button>
                <button
                  onClick={() => sendMessage("What is this website about?")}
                  className="px-3 py-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  ❓ What is this website about?
                </button>
                <button
                  onClick={() => sendMessage("Help me navigate to the pricing section")}
                  className="px-3 py-2 text-sm rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-left"
                >
                  🧭 Navigate to pricing
                </button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-secondary-foreground rounded-bl-md"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type or speak your question..."}
                className={cn(
                  "pr-10 transition-all",
                  isListening && "border-primary ring-2 ring-primary/20"
                )}
                disabled={isLoading}
                aria-label="Your message"
              />
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
                    isListening 
                      ? "text-primary bg-primary/10 animate-pulse" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  aria-label={isListening ? "Stop listening" : "Start voice input"}
                  disabled={isLoading}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shrink-0"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isListening && (
            <p className="text-xs text-primary mt-2 animate-pulse text-center">
              🎤 Speak now... Click mic or press Enter when done
            </p>
          )}
        </form>
      </div>
    </>
  );
}
