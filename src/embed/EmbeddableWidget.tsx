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
  Settings2,
  ClipboardCheck,
  Type,
  Contrast,
  BookOpen,
  Ruler,
  Eye,
  ImageOff,
  Focus,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Keyboard,
  Space,
  Minimize2,
  AlignVerticalSpaceAround,
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

type TabType = "chat" | "visual" | "audit" | "settings";
type ChatMode = "voice" | "text";
type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";
type ContrastMode = "normal" | "high" | "inverted";

interface AccessibilitySettings {
  textScale: number;
  lineHeight: number;
  letterSpacing: number;
  contrastMode: ContrastMode;
  dyslexiaFont: boolean;
  readingGuide: boolean;
  colorBlindMode: ColorBlindMode;
  hideImages: boolean;
  focusHighlight: boolean;
  speechRate: number;
}

interface AuditIssue {
  id: string;
  type: "error" | "warning" | "info";
  wcagCriteria: string;
  title: string;
  description: string;
  element?: string;
  howToFix: string;
}

interface AuditResult {
  score: number;
  issues: AuditIssue[];
  passedChecks: number;
  totalChecks: number;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textScale: 100,
  lineHeight: 100,
  letterSpacing: 0,
  contrastMode: "normal",
  dyslexiaFont: false,
  readingGuide: false,
  colorBlindMode: "normal",
  hideImages: false,
  focusHighlight: false,
  speechRate: 1.0,
};

// Strip markdown, emojis, and special characters for clean speech output
function stripForSpeech(text: string): string {
  return text
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove emojis (comprehensive emoji regex)
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{1FA00}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu, '')
    // Remove bullet points and list markers
    .replace(/^[\s]*[-*•]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract clean domain name (e.g., lovable.dev, google.com)
function getCleanDomain(): string {
  const hostname = window.location.hostname.replace('www.', '');
  
  // Handle Lovable preview URLs - extract a readable form
  if (hostname.includes('lovableproject.com')) {
    return 'lovableproject.com';
  }
  if (hostname.includes('lovable.app')) {
    return hostname; // Keep as-is for published lovable.app domains
  }
  
  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  return hostname;
}

const STORAGE_KEY = "a11y-embed-settings";

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all properties have valid values (handle old settings without new properties)
      return {
        textScale: parsed.textScale ?? DEFAULT_SETTINGS.textScale,
        lineHeight: parsed.lineHeight ?? DEFAULT_SETTINGS.lineHeight,
        letterSpacing: parsed.letterSpacing ?? DEFAULT_SETTINGS.letterSpacing,
        contrastMode: parsed.contrastMode ?? DEFAULT_SETTINGS.contrastMode,
        dyslexiaFont: parsed.dyslexiaFont ?? DEFAULT_SETTINGS.dyslexiaFont,
        readingGuide: parsed.readingGuide ?? DEFAULT_SETTINGS.readingGuide,
        colorBlindMode: parsed.colorBlindMode ?? DEFAULT_SETTINGS.colorBlindMode,
        hideImages: parsed.hideImages ?? DEFAULT_SETTINGS.hideImages,
        focusHighlight: parsed.focusHighlight ?? DEFAULT_SETTINGS.focusHighlight,
        speechRate: parsed.speechRate ?? DEFAULT_SETTINGS.speechRate,
      };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

// Inline styles to avoid Tailwind dependency in embed
const createStyles = (primaryColor: string) => ({
  container: (position: string): React.CSSProperties => ({
    position: "fixed",
    bottom: "20px",
    [position === "bottom-right" ? "right" : "left"]: "20px",
    zIndex: 9999,
    fontFamily: "system-ui, -apple-system, sans-serif",
  }),
  button: (): React.CSSProperties => ({
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
    width: "min(400px, calc(100vw - 40px))",
    height: "min(580px, calc(100vh - 120px))",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    display: isOpen ? "flex" : "none",
    flexDirection: "column",
    overflow: "hidden",
  }),
  header: (): React.CSSProperties => ({
    background: "#ffffff",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
  }),
  headerIcon: (): React.CSSProperties => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  }),
  headerText: (): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
  }),
  headerTitle: (): React.CSSProperties => ({
    fontWeight: 600,
    fontSize: "15px",
    margin: 0,
    color: "#1f2937",
  }),
  headerSubtitle: (): React.CSSProperties => ({
    fontSize: "12px",
    color: "#6b7280",
    margin: 0,
  }),
  headerButton: (): React.CSSProperties => ({
    background: "transparent",
    border: "none",
    color: "#6b7280",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  tabBar: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
  } as React.CSSProperties,
  tab: (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "12px 8px",
    fontSize: "13px",
    fontWeight: 500,
    color: isActive ? primaryColor : "#6b7280",
    background: "transparent",
    border: "none",
    borderBottom: isActive ? `2px solid ${primaryColor}` : "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  content: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
  },
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
    background: "#1f2937",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "16px 16px 4px 16px",
    maxWidth: "80%",
    fontSize: "14px",
  },
  assistantMessage: (): React.CSSProperties => ({
    alignSelf: "flex-start",
    background: "#f0f4f8",
    color: "#1f2937",
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
    background: "#ffffff",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    border: "2px solid #374151",
    borderRadius: "24px",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff",
    color: "#1f2937",
  },
  iconButton: (active?: boolean): React.CSSProperties => ({
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
  slider: {
    width: "100%",
    height: "8px",
    borderRadius: "4px",
    appearance: "none" as const,
    background: "#e5e7eb",
    outline: "none",
    cursor: "pointer",
  },
  toggleSwitch: (isOn: boolean): React.CSSProperties => ({
    width: "44px",
    height: "24px",
    borderRadius: "12px",
    background: isOn ? primaryColor : "#e5e7eb",
    border: "none",
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
  }),
  toggleThumb: (isOn: boolean): React.CSSProperties => ({
    position: "absolute",
    top: "2px",
    left: isOn ? "22px" : "2px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "left 0.2s",
  }),
  optionButton: (isActive: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: "13px",
    borderRadius: "8px",
    border: isActive ? `2px solid ${primaryColor}` : "1px solid #e5e7eb",
    background: isActive ? primaryColor + "15" : "white",
    color: isActive ? primaryColor : "#374151",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  issueCard: (type: string): React.CSSProperties => ({
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    borderLeft: `4px solid ${type === "error" ? "#ef4444" : type === "warning" ? "#f59e0b" : "#6366f1"}`,
  }),
  scoreBar: (score: number): React.CSSProperties => ({
    height: "8px",
    borderRadius: "4px",
    background: "#e5e7eb",
    overflow: "hidden",
  }),
  scoreBarFill: (score: number): React.CSSProperties => ({
    width: `${score}%`,
    height: "100%",
    background: score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444",
    transition: "width 0.5s",
  }),
});

export function EmbeddableWidget({
  position = "bottom-right",
  primaryColor = "#6366f1",
  apiEndpoint,
  apiKey,
}: EmbeddableWidgetProps) {
  const styles = createStyles(primaryColor);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [chatMode, setChatMode] = useState<ChatMode>("voice");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [conversationMode, setConversationMode] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  const [readingGuideY, setReadingGuideY] = useState(0);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasSpeakingRef = useRef(false);

  const { speak, stop: stopSpeaking, isSpeaking, unlockAudio } = useSpeechSynthesis({
    rate: settings.speechRate,
    onError: (error) => console.error("Speech synthesis error:", error),
  });

  const handleVoiceResult = useCallback((finalTranscript: string) => {
    if (finalTranscript.trim()) {
      setInput(finalTranscript);
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

  // Generate welcome announcement - kept short for faster speech
  const getWelcomeAnnouncement = useCallback(() => {
    const domain = getCleanDomain();
    return `Hi! I'm your accessibility assistant for ${domain}. To switch to text chat, just say "switch to text". How can I help navigate you through this site?`;
  }, []);

  // Auto-start voice mode when widget opens with announcement
  useEffect(() => {
    if (isOpen && activeTab === "chat" && chatMode === "voice" && isSpeechRecognitionSupported && !isLoading && !hasShownWelcome && messages.length === 0) {
      setHasShownWelcome(true);
      
      // Immediately show and speak welcome - no delay
      unlockAudio();
      const welcomeMessage = getWelcomeAnnouncement();
      
      // Add welcome as first assistant message
      setMessages([{ role: "assistant", content: welcomeMessage }]);
      
      // Speak the welcome, then start listening after it finishes
      if (isSpeechEnabled) {
        speak(welcomeMessage);
        setConversationMode(true);
      } else {
        setConversationMode(true);
        startListening();
      }
    }
  }, [isOpen, activeTab, chatMode, isSpeechRecognitionSupported, isLoading, hasShownWelcome, messages.length, unlockAudio, getWelcomeAnnouncement, isSpeechEnabled, speak, startListening]);

  // Stop listening when switching to text mode
  useEffect(() => {
    if (chatMode === "text" && isListening) {
      stopListening();
      setConversationMode(false);
    }
  }, [chatMode, isListening, stopListening]);

  // Auto-restart listening after AI finishes speaking
  useEffect(() => {
    if (wasSpeakingRef.current && !isSpeaking && conversationMode && chatMode === "voice" && !isListening) {
      const timer = setTimeout(() => {
        if (conversationMode && chatMode === "voice" && !isListening) {
          startListening();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, conversationMode, chatMode, isListening, startListening]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update setting helper
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // Apply visual settings to the page
  useEffect(() => {
    const root = document.documentElement;
    
    // Text scaling
    if (settings.textScale !== 100) {
      root.style.setProperty("--a11y-text-scale", String(settings.textScale / 100));
      root.classList.add("a11y-text-scaled");
    } else {
      root.style.removeProperty("--a11y-text-scale");
      root.classList.remove("a11y-text-scaled");
    }
    
    // Line height
    if (settings.lineHeight !== 100) {
      root.style.setProperty("--a11y-line-height", String(settings.lineHeight / 100));
      root.classList.add("a11y-line-height-scaled");
    } else {
      root.style.removeProperty("--a11y-line-height");
      root.classList.remove("a11y-line-height-scaled");
    }
    
    // Letter spacing
    if (settings.letterSpacing !== 0) {
      root.style.setProperty("--a11y-letter-spacing", `${settings.letterSpacing / 100}em`);
      root.classList.add("a11y-letter-spacing-scaled");
    } else {
      root.style.removeProperty("--a11y-letter-spacing");
      root.classList.remove("a11y-letter-spacing-scaled");
    }
    
    // Contrast modes
    root.classList.remove("a11y-high-contrast", "a11y-inverted");
    if (settings.contrastMode === "high") {
      root.classList.add("a11y-high-contrast");
    } else if (settings.contrastMode === "inverted") {
      root.classList.add("a11y-inverted");
    }
    
    // Dyslexia font
    root.classList.toggle("a11y-dyslexia-font", settings.dyslexiaFont);
    
    // Reading guide
    root.classList.toggle("a11y-reading-guide-active", settings.readingGuide);
    
    // Color blind modes
    root.classList.remove("a11y-protanopia", "a11y-deuteranopia", "a11y-tritanopia");
    if (settings.colorBlindMode !== "normal") {
      root.classList.add(`a11y-${settings.colorBlindMode}`);
    }
    
    // Hide images
    root.classList.toggle("a11y-hide-images", settings.hideImages);
    
    // Focus highlight
    root.classList.toggle("a11y-focus-highlight", settings.focusHighlight);
    
    return () => {
      root.classList.remove(
        "a11y-high-contrast", "a11y-inverted", "a11y-dyslexia-font",
        "a11y-reading-guide-active", "a11y-protanopia", "a11y-deuteranopia", "a11y-tritanopia",
        "a11y-text-scaled", "a11y-line-height-scaled", "a11y-letter-spacing-scaled",
        "a11y-hide-images", "a11y-focus-highlight"
      );
      root.style.removeProperty("--a11y-text-scale");
      root.style.removeProperty("--a11y-line-height");
      root.style.removeProperty("--a11y-letter-spacing");
    };
  }, [settings]);

  // Reading guide mouse tracking
  useEffect(() => {
    if (!settings.readingGuide) return;
    const handleMouseMove = (e: MouseEvent) => setReadingGuideY(e.clientY);
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.readingGuide]);

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  const hasCustomSettings = Object.keys(DEFAULT_SETTINGS).some(
    (key) => settings[key as keyof AccessibilitySettings] !== DEFAULT_SETTINGS[key as keyof AccessibilitySettings]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      
      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          setIsOpen(prev => !prev);
          break;
        case 'r':
          e.preventDefault();
          updateSetting("readingGuide", !settings.readingGuide);
          break;
        case 'd':
          e.preventDefault();
          updateSetting("dyslexiaFont", !settings.dyslexiaFont);
          break;
        case 'h':
          e.preventDefault();
          updateSetting("contrastMode", settings.contrastMode === "high" ? "normal" : "high");
          break;
        case '+':
        case '=':
          e.preventDefault();
          updateSetting("textScale", Math.min(150, settings.textScale + 10));
          break;
        case '-':
          e.preventDefault();
          updateSetting("textScale", Math.max(100, settings.textScale - 10));
          break;
        case '0':
          e.preventDefault();
          resetSettings();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settings, updateSetting]);

  // Quick chat send helper
  const sendQuickMessage = useCallback((text: string) => {
    setInput(text);
    setTimeout(() => {
      const form = document.getElementById("widget-form") as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  }, []);

  // Run accessibility audit
  const runAudit = useCallback(() => {
    setIsScanning(true);
    
    setTimeout(() => {
      const issues: AuditIssue[] = [];
      let passedChecks = 0;
      const totalChecks = 12;

      // 1. Images without alt
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
      if (imagesWithoutAlt.length > 0) {
        issues.push({
          id: "img-alt",
          type: "error",
          wcagCriteria: "1.1.1",
          title: "Images missing alt text",
          description: `${imagesWithoutAlt.length} image(s) are missing alternative text.`,
          element: `<img src="...">`,
          howToFix: "Add descriptive alt attributes to all images.",
        });
      } else passedChecks++;

      // 2. Empty links
      const emptyLinks = document.querySelectorAll('a:not([aria-label])');
      let emptyLinkCount = 0;
      emptyLinks.forEach((link) => {
        if (!link.textContent?.trim() && !link.querySelector('img[alt]')) emptyLinkCount++;
      });
      if (emptyLinkCount > 0) {
        issues.push({
          id: "empty-links",
          type: "error",
          wcagCriteria: "2.4.4",
          title: "Empty or unclear links",
          description: `${emptyLinkCount} link(s) have no accessible text.`,
          element: `<a href="..."></a>`,
          howToFix: "Add descriptive text or aria-label to links.",
        });
      } else passedChecks++;

      // 3. Form inputs without labels
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
      let unlabeledInputs = 0;
      inputs.forEach((input) => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        const isInsideLabel = input.closest('label');
        if (!hasLabel && !hasAriaLabel && !isInsideLabel) unlabeledInputs++;
      });
      if (unlabeledInputs > 0) {
        issues.push({
          id: "form-labels",
          type: "error",
          wcagCriteria: "1.3.1",
          title: "Form inputs missing labels",
          description: `${unlabeledInputs} form field(s) are missing labels.`,
          element: `<input type="text">`,
          howToFix: "Associate inputs with <label> elements.",
        });
      } else passedChecks++;

      // 4. Missing language
      const htmlLang = document.documentElement.getAttribute('lang');
      if (!htmlLang) {
        issues.push({
          id: "html-lang",
          type: "error",
          wcagCriteria: "3.1.1",
          title: "Missing page language",
          description: "The page language is not specified.",
          element: `<html>`,
          howToFix: 'Add lang="en" to the <html> element.',
        });
      } else passedChecks++;

      // 5. Missing title
      if (!document.title?.trim()) {
        issues.push({
          id: "page-title",
          type: "error",
          wcagCriteria: "2.4.2",
          title: "Missing page title",
          description: "The page has no title.",
          element: `<title></title>`,
          howToFix: "Add a descriptive <title> element.",
        });
      } else passedChecks++;

      // 6. H1 checks
      const h1s = document.querySelectorAll('h1');
      if (h1s.length === 0) {
        issues.push({
          id: "missing-h1",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Missing main heading",
          description: "No H1 heading found.",
          element: `<h1>...</h1>`,
          howToFix: "Add a single H1 heading.",
        });
      } else if (h1s.length > 1) {
        issues.push({
          id: "multiple-h1",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Multiple H1 headings",
          description: `${h1s.length} H1 headings found.`,
          element: `<h1>...</h1>`,
          howToFix: "Use only one H1 per page.",
        });
      } else passedChecks++;

      // 7. Skipped heading levels
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let skippedLevels = false;
      let lastLevel = 0;
      headings.forEach((h) => {
        const level = parseInt(h.tagName[1]);
        if (lastLevel > 0 && level > lastLevel + 1) skippedLevels = true;
        lastLevel = level;
      });
      if (skippedLevels) {
        issues.push({
          id: "heading-order",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Skipped heading levels",
          description: "Headings skip levels (e.g., H2 to H4).",
          element: `<h2>...<h4>`,
          howToFix: "Use headings in order.",
        });
      } else passedChecks++;

      // 8. Buttons without names
      const buttons = document.querySelectorAll('button, [role="button"]');
      let unlabeledButtons = 0;
      buttons.forEach((btn) => {
        if (!btn.textContent?.trim() && !btn.hasAttribute('aria-label') && !btn.hasAttribute('title')) {
          unlabeledButtons++;
        }
      });
      if (unlabeledButtons > 0) {
        issues.push({
          id: "button-names",
          type: "error",
          wcagCriteria: "4.1.2",
          title: "Buttons missing names",
          description: `${unlabeledButtons} button(s) have no accessible name.`,
          element: `<button></button>`,
          howToFix: "Add text or aria-label to buttons.",
        });
      } else passedChecks++;

      // 9. Skip link
      const skipLink = document.querySelector('a[href^="#main"], a[href^="#content"], [class*="skip"]');
      if (!skipLink) {
        issues.push({
          id: "skip-link",
          type: "info",
          wcagCriteria: "2.4.1",
          title: "No skip link found",
          description: "A skip link helps keyboard users.",
          element: `<a href="#main">`,
          howToFix: "Add a 'Skip to main content' link.",
        });
      } else passedChecks++;

      // 10. Main landmark
      if (!document.querySelector('main, [role="main"]')) {
        issues.push({
          id: "landmark-main",
          type: "warning",
          wcagCriteria: "1.3.1",
          title: "Missing main landmark",
          description: "No <main> element found.",
          element: `<main>...</main>`,
          howToFix: "Wrap content in <main>.",
        });
      } else passedChecks++;

      // 11. Nav landmark
      if (!document.querySelector('nav, [role="navigation"]')) {
        issues.push({
          id: "landmark-nav",
          type: "info",
          wcagCriteria: "1.3.1",
          title: "Missing navigation landmark",
          description: "No <nav> element found.",
          element: `<nav>...</nav>`,
          howToFix: "Wrap navigation in <nav>.",
        });
      } else passedChecks++;

      // 12. Positive tabindex
      const badTabindex = document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
      let positiveTabindex = 0;
      badTabindex.forEach((el) => {
        if (parseInt(el.getAttribute('tabindex') || '0') > 0) positiveTabindex++;
      });
      if (positiveTabindex > 0) {
        issues.push({
          id: "tabindex-positive",
          type: "warning",
          wcagCriteria: "2.4.3",
          title: "Positive tabindex values",
          description: `${positiveTabindex} element(s) have tabindex > 0.`,
          element: `tabindex="1"`,
          howToFix: "Use tabindex=\"0\" or \"-1\" only.",
        });
      } else passedChecks++;

      const score = Math.round((passedChecks / totalChecks) * 100);
      setAuditResult({ score, issues, passedChecks, totalChecks });
      setIsScanning(false);
    }, 500);
  }, []);

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
        ];

        let element: Element | null = null;
        for (const selector of selectors) {
          try {
            element = document.querySelector(selector);
            if (element) break;
          } catch {
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

    if (isListening) stopListening();

    // Set up delayed "please wait" message
    let hasReceivedResponse = false;
    const waitMessageTimeout = setTimeout(() => {
      if (!hasReceivedResponse && isSpeechEnabled) {
        speak("Please give me a second while I find that for you...");
      }
    }, 3000); // 3 seconds before showing wait message

    const longWaitTimeout = setTimeout(() => {
      if (!hasReceivedResponse && isSpeechEnabled) {
        speak("Sorry this is taking longer than usual. I'm still working on it...");
      }
    }, 8000); // 8 seconds for apology

    try {
      const context = getPageContext();
      const endpoint = apiEndpoint || `${window.location.origin}/functions/v1/widget-chat`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers["x-api-key"] = apiKey;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage, ...context }),
      });

      // Clear timeouts once we get a response
      hasReceivedResponse = true;
      clearTimeout(waitMessageTimeout);
      clearTimeout(longWaitTimeout);

      if (!response.ok) throw new Error("Failed to get response");

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
                    updated[updated.length - 1] = { role: "assistant", content: fullResponse };
                    return updated;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        const cleanedResponse = parseAndExecuteActions(fullResponse);
        if (isSpeechEnabled && cleanedResponse) {
          const speechText = stripForSpeech(cleanedResponse);
          if (speechText) speak(speechText);
        }
      }
    } catch (error) {
      // Clear timeouts on error
      hasReceivedResponse = true;
      clearTimeout(waitMessageTimeout);
      clearTimeout(longWaitTimeout);
      
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
    if (isSpeechEnabled) stopSpeaking();
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  const exportAuditJSON = () => {
    if (!auditResult) return;
    const report = {
      url: window.location.href,
      title: document.title,
      scannedAt: new Date().toISOString(),
      score: auditResult.score,
      passedChecks: auditResult.passedChecks,
      totalChecks: auditResult.totalChecks,
      issues: auditResult.issues,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accessibility-audit-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderToggle = (isOn: boolean, onChange: () => void, label: string) => (
    <button
      onClick={onChange}
      style={styles.toggleSwitch(isOn)}
      aria-label={label}
      aria-pressed={isOn}
    >
      <span style={styles.toggleThumb(isOn)} />
    </button>
  );

  return (
    <div style={styles.container(position)}>
      {/* SVG Filters for Color Blindness */}
      <svg style={{ position: "absolute", height: 0, width: 0 }} aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>

      {/* Reading Guide Overlay */}
      {settings.readingGuide && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998 }} aria-hidden="true">
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: Math.max(0, readingGuideY - 20), background: "rgba(0,0,0,0.4)", transition: "height 75ms" }} />
          <div style={{ position: "absolute", left: 0, right: 0, height: 40, top: Math.max(0, readingGuideY - 20), borderTop: `2px solid ${primaryColor}`, borderBottom: `2px solid ${primaryColor}` }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: readingGuideY + 20, background: "rgba(0,0,0,0.4)", transition: "top 75ms" }} />
        </div>
      )}

      <div style={styles.panel(isOpen)} role="dialog" aria-label="Accessibility Assistant" aria-hidden={!isOpen}>
        {/* Header */}
        <div style={styles.header()}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={styles.headerIcon()}>
              <Accessibility size={20} aria-hidden="true" />
            </div>
            <div style={styles.headerText()}>
              <h2 style={styles.headerTitle()}>Accessibility Assistant</h2>
              <p style={styles.headerSubtitle()}>
                {activeTab === "chat" ? "Ask me anything about this page" : 
                 activeTab === "visual" ? "Adjust visual settings" :
                 activeTab === "audit" ? "Check page accessibility" : "Speech settings"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {activeTab === "chat" && (
              <button onClick={toggleSpeech} style={styles.headerButton()} aria-label={isSpeechEnabled ? "Disable speech" : "Enable speech"} aria-pressed={isSpeechEnabled}>
                {isSpeechEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
              </button>
            )}
            <button onClick={() => setIsOpen(false)} style={styles.headerButton()} aria-label="Close accessibility assistant">
              <Minimize2 size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={styles.tabBar} role="tablist">
          <button onClick={() => setActiveTab("chat")} style={styles.tab(activeTab === "chat")} role="tab" aria-selected={activeTab === "chat"}>
            <MessageCircle size={16} aria-hidden="true" /> Chat
          </button>
          <button onClick={() => setActiveTab("visual")} style={styles.tab(activeTab === "visual")} role="tab" aria-selected={activeTab === "visual"}>
            <Settings2 size={16} aria-hidden="true" /> Visual
          </button>
          <button onClick={() => setActiveTab("audit")} style={styles.tab(activeTab === "audit")} role="tab" aria-selected={activeTab === "audit"}>
            <ClipboardCheck size={16} aria-hidden="true" /> Audit
          </button>
          <button onClick={() => setActiveTab("settings")} style={styles.tab(activeTab === "settings")} role="tab" aria-selected={activeTab === "settings"}>
            <Volume2 size={16} aria-hidden="true" /> Speech
          </button>
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <>
            {/* Voice/Text Mode Toggle */}
            <div style={{ padding: "12px 16px 8px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {chatMode === "voice" ? (
                    <Mic size={16} color={primaryColor} aria-hidden="true" />
                  ) : (
                    <Type size={16} color="#6b7280" aria-hidden="true" />
                  )}
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>
                    {chatMode === "voice" ? "Voice Chat" : "Text Chat"}
                  </span>
                </div>
                <button
                  onClick={() => setChatMode(chatMode === "voice" ? "text" : "voice")}
                  style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px", background: "#e5e7eb", border: "none", cursor: "pointer", color: "#6b7280" }}
                >
                  Switch to {chatMode === "voice" ? "Text" : "Voice"}
                </button>
              </div>
              {chatMode === "voice" && isSpeechRecognitionSupported && isSpeaking && (
                <p style={{ fontSize: "12px", color: primaryColor, marginTop: "6px" }}>
                  🔊 Speaking... I'll start listening when I'm done.
                </p>
              )}
              {chatMode === "voice" && isSpeechRecognitionSupported && !isSpeaking && isListening && (
                <p style={{ fontSize: "12px", color: primaryColor, marginTop: "6px" }}>
                  🎤 Listening... Speak now or click "Switch to Text" to type instead.
                </p>
              )}
              {chatMode === "voice" && isSpeechRecognitionSupported && !isSpeaking && !isListening && (
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                  Click the microphone below to start speaking, or "Switch to Text" to type.
                </p>
              )}
              {chatMode === "voice" && !isSpeechRecognitionSupported && (
                <p style={{ fontSize: "12px", color: "#f59e0b", marginTop: "6px" }}>
                  Voice not supported in this browser. Please use text mode.
                </p>
              )}
            </div>

            <div style={{ ...styles.messages, height: "220px" }} role="log" aria-live="polite" aria-label="Chat messages">
              {messages.length === 0 ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#374151", padding: "20px" }}>
                  {chatMode === "voice" && isSpeechRecognitionSupported ? (
                    <>
                      <Volume2 size={48} color={primaryColor} style={{ marginBottom: "16px" }} aria-hidden="true" />
                      <p style={{ marginBottom: "8px", fontWeight: 500 }}>Preparing your assistant...</p>
                      <p style={{ fontSize: "13px", color: "#4b5563" }}>Please wait while I introduce myself</p>
                    </>
                  ) : (
                    <>
                      <Accessibility size={48} color="#d1d5db" style={{ marginBottom: "16px" }} aria-hidden="true" />
                      <p style={{ marginBottom: "8px", fontWeight: 500 }}>How can I help you today?</p>
                      <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "16px" }}>Type your question below</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "280px" }}>
                        <button
                          type="button"
                          onClick={() => sendQuickMessage("Summarize this page for me")}
                          style={{ padding: "10px 12px", fontSize: "13px", borderRadius: "8px", background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left", color: "#374151" }}
                        >
                          Summarize this page
                        </button>
                        <button
                          type="button"
                          onClick={() => sendQuickMessage("What is this website about?")}
                          style={{ padding: "10px 12px", fontSize: "13px", borderRadius: "8px", background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left", color: "#374151" }}
                        >
                          What is this website about?
                        </button>
                        <button
                          type="button"
                          onClick={() => sendQuickMessage("Help me navigate to the main content")}
                          style={{ padding: "10px 12px", fontSize: "13px", borderRadius: "8px", background: "#f3f4f6", border: "1px solid #e5e7eb", cursor: "pointer", textAlign: "left", color: "#374151" }}
                        >
                          Navigate to main content
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} style={msg.role === "user" ? styles.userMessage : styles.assistantMessage()}>
                    {msg.content}
                  </div>
                ))
              )}
              {isLoading && messages.length > 0 && (
                <div style={styles.assistantMessage()}>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} aria-label="Loading response" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form id="widget-form" onSubmit={sendMessage} style={styles.inputContainer}>
              {chatMode === "voice" && isSpeechRecognitionSupported ? (
                // Voice mode: Show listening status with stop button
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isListening) {
                          stopListening();
                          setConversationMode(false);
                        } else {
                          unlockAudio();
                          setConversationMode(true);
                          startListening();
                        }
                      }}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        border: "none",
                        background: isListening ? "#ef4444" : primaryColor,
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: isListening ? "pulse 2s infinite" : "none",
                      }}
                      aria-label={isListening ? "Stop listening" : "Start listening"}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff size={20} aria-hidden="true" /> : <Mic size={20} aria-hidden="true" />}
                    </button>
                    {input && (
                      <button type="submit" disabled={isLoading || !input.trim()} style={{ ...styles.iconButton(true), opacity: isLoading || !input.trim() ? 0.5 : 1 }} aria-label="Send message">
                        <Send size={18} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {isListening && (
                    <p style={{ fontSize: "12px", color: primaryColor, textAlign: "center" }}>
                      {input ? `"${input}"` : "Listening..."}
                    </p>
                  )}
                  {!isListening && !isLoading && (
                    <p style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                      Click the microphone to start speaking
                    </p>
                  )}
                </div>
              ) : (
                // Text mode: Show standard input
                <>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    style={styles.input}
                    disabled={isLoading}
                    aria-label="Message input"
                  />
                  <button type="submit" disabled={isLoading || !input.trim()} style={{ ...styles.iconButton(true), opacity: isLoading || !input.trim() ? 0.5 : 1 }} aria-label="Send message">
                    <Send size={18} aria-hidden="true" />
                  </button>
                </>
              )}
            </form>
          </>
        )}

        {/* Visual Tab */}
        {activeTab === "visual" && (
          <div style={styles.content}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Text Size */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Type size={16} color="#6b7280" />
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>Text Size</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>{settings.textScale}%</span>
                </div>
                <input type="range" min={100} max={150} step={10} value={settings.textScale} onChange={(e) => updateSetting("textScale", parseInt(e.target.value))} style={styles.slider} />
              </div>

              {/* Line Spacing */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlignVerticalSpaceAround size={16} color="#6b7280" />
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>Line Spacing</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>{settings.lineHeight}%</span>
                </div>
                <input type="range" min={100} max={200} step={25} value={settings.lineHeight} onChange={(e) => updateSetting("lineHeight", parseInt(e.target.value))} style={styles.slider} />
              </div>

              {/* Letter Spacing */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Space size={16} color="#6b7280" aria-hidden="true" />
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>Letter Spacing</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>{settings.letterSpacing}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={10}
                  value={settings.letterSpacing}
                  onChange={(e) => updateSetting("letterSpacing", parseInt(e.target.value))}
                  style={styles.slider}
                  aria-label="Letter spacing slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Normal</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Wide</span>
                </div>
              </div>

              {/* Contrast Mode */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Contrast size={16} color="#6b7280" aria-hidden="true" />
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>Contrast Mode</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {(["normal", "high", "inverted"] as ContrastMode[]).map((mode) => (
                    <button key={mode} onClick={() => updateSetting("contrastMode", mode)} style={styles.optionButton(settings.contrastMode === mode)} aria-pressed={settings.contrastMode === mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen size={16} color="#6b7280" aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 500, display: "block" }}>Dyslexia Font</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Uses OpenDyslexic</span>
                  </div>
                </div>
                {renderToggle(settings.dyslexiaFont, () => updateSetting("dyslexiaFont", !settings.dyslexiaFont), "Toggle dyslexia font")}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Ruler size={16} color="#6b7280" aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 500, display: "block" }}>Reading Guide</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Highlights current line</span>
                  </div>
                </div>
                {renderToggle(settings.readingGuide, () => updateSetting("readingGuide", !settings.readingGuide), "Toggle reading guide")}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ImageOff size={16} color="#6b7280" aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 500, display: "block" }}>Hide Images</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Reduces visual clutter</span>
                  </div>
                </div>
                {renderToggle(settings.hideImages, () => updateSetting("hideImages", !settings.hideImages), "Toggle hide images")}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Focus size={16} color="#6b7280" aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 500, display: "block" }}>Focus Highlight</span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>Enhanced focus outlines</span>
                  </div>
                </div>
                {renderToggle(settings.focusHighlight, () => updateSetting("focusHighlight", !settings.focusHighlight), "Toggle focus highlight")}
              </div>

              {/* Color Vision */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Eye size={16} color="#6b7280" aria-hidden="true" />
                  <span style={{ fontSize: "14px", fontWeight: 500 }}>Color Vision</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {(["normal", "protanopia", "deuteranopia", "tritanopia"] as ColorBlindMode[]).map((mode) => (
                    <button key={mode} onClick={() => updateSetting("colorBlindMode", mode)} style={styles.optionButton(settings.colorBlindMode === mode)} aria-pressed={settings.colorBlindMode === mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button onClick={resetSettings} disabled={!hasCustomSettings} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: hasCustomSettings ? "pointer" : "not-allowed", opacity: hasCustomSettings ? 1 : 0.5, fontSize: "14px" }} aria-disabled={!hasCustomSettings}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset to Defaults
              </button>

              {/* Keyboard Shortcuts */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Keyboard size={14} color="#6b7280" aria-hidden="true" />
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Keyboard Shortcuts</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px", fontSize: "11px", color: "#6b7280" }}>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+A</kbd> Toggle Panel</span>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+R</kbd> Reading Guide</span>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+D</kbd> Dyslexia Font</span>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+H</kbd> High Contrast</span>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt++</kbd> Increase Text</span>
                  <span><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+-</kbd> Decrease Text</span>
                  <span style={{ gridColumn: "span 2" }}><kbd style={{ padding: "1px 4px", background: "#f3f4f6", borderRadius: "2px", fontSize: "10px" }}>Alt+0</kbd> Reset All</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && (
          <div style={styles.content}>
            {!auditResult ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                <ClipboardCheck size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
                <h3 style={{ fontWeight: 500, marginBottom: "8px" }}>Accessibility Audit</h3>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                  Scan this page for WCAG accessibility issues
                </p>
                <button onClick={runAudit} disabled={isScanning} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: primaryColor, color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer", opacity: isScanning ? 0.7 : 1 }}>
                  {isScanning ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <ClipboardCheck size={16} />}
                  {isScanning ? "Scanning..." : "Run Audit"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Score Card */}
                <div style={{ padding: "16px", borderRadius: "8px", background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500 }}>Accessibility Score</span>
                    <span style={{ fontSize: "24px", fontWeight: 700, color: auditResult.score >= 80 ? "#22c55e" : auditResult.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                      {auditResult.score}%
                    </span>
                  </div>
                  <div style={styles.scoreBar(auditResult.score)}>
                    <div style={styles.scoreBarFill(auditResult.score)} />
                  </div>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                    {auditResult.passedChecks}/{auditResult.totalChecks} checks passed
                  </p>
                </div>

                {/* Issues List */}
                {auditResult.issues.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={16} color="#ef4444" />
                      Issues Found ({auditResult.issues.length})
                    </h4>
                    {auditResult.issues.map((issue) => (
                      <div key={issue.id} style={styles.issueCard(issue.type)}>
                        <button onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)} style={{ width: "100%", padding: "12px", display: "flex", alignItems: "flex-start", gap: "8px", textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}>
                          {issue.type === "error" ? <AlertCircle size={16} color="#ef4444" /> : issue.type === "warning" ? <AlertTriangle size={16} color="#f59e0b" /> : <Info size={16} color="#6366f1" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 500 }}>{issue.title}</span>
                              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#e5e7eb", color: "#6b7280" }}>{issue.wcagCriteria}</span>
                            </div>
                          </div>
                          {expandedIssue === issue.id ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                        </button>
                        {expandedIssue === issue.id && (
                          <div style={{ padding: "0 12px 12px 36px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>{issue.description}</p>
                            <p style={{ fontSize: "12px", marginTop: "8px" }}>
                              <strong>How to fix:</strong> <span style={{ color: "#6b7280" }}>{issue.howToFix}</span>
                            </p>
                            {issue.element && (
                              <code style={{ display: "block", fontSize: "11px", padding: "4px 8px", marginTop: "8px", background: "#e5e7eb", borderRadius: "4px", fontFamily: "monospace", color: "#374151" }}>
                                {issue.element}
                              </code>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", textAlign: "center" }}>
                    <CheckCircle2 size={40} color="#22c55e" style={{ marginBottom: "8px" }} />
                    <p style={{ fontWeight: 500, fontSize: "14px" }}>No issues found!</p>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>This page passes basic accessibility checks.</p>
                  </div>
                )}

                {/* Export */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Download size={16} color="#6b7280" />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "#6b7280" }}>Export Report</span>
                  </div>
                  <button onClick={exportAuditJSON} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px" }}>
                    <Download size={16} />
                    Export as JSON
                  </button>
                  <button onClick={() => { setAuditResult(null); setExpandedIssue(null); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "10px", marginTop: "8px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "14px" }}>
                    <RotateCcw size={16} />
                    Run New Scan
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div style={styles.content}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Speech Rate */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Volume2 size={16} color="#374151" aria-hidden="true" />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>Speech Rate</span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#374151", fontWeight: 500 }}>{settings.speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={settings.speechRate}
                  onChange={(e) => updateSetting("speechRate", parseFloat(e.target.value))}
                  style={styles.slider}
                  aria-label="Speech rate slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Slower (0.5x)</span>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>Faster (2.0x)</span>
                </div>
              </div>

              {/* Speech Toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isSpeechEnabled ? <Volume2 size={16} color="#374151" aria-hidden="true" /> : <VolumeX size={16} color="#374151" aria-hidden="true" />}
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>Enable Speech Output</span>
                </div>
                {renderToggle(isSpeechEnabled, toggleSpeech, "Toggle speech output")}
              </div>

              {/* Info Section */}
              <div style={{ padding: "12px", background: "#f0f4f8", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
                  <strong>Speech settings:</strong> Control how the assistant reads responses aloud. 
                  Adjust the rate to speed up or slow down speech output.
                </p>
              </div>

              {/* Test Speech Button */}
              <button
                onClick={() => {
                  unlockAudio();
                  speak("This is a test of the speech output at your selected rate.");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  background: primaryColor,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                aria-label="Test speech output"
              >
                <Volume2 size={16} aria-hidden="true" />
                Test Speech
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.button(),
          transform: isOpen ? "rotate(90deg) scale(0.9)" : "none",
        }}
        aria-label={isOpen ? "Close accessibility assistant" : "Open accessibility assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} color="white" aria-hidden="true" /> : <Accessibility size={24} color="white" aria-hidden="true" />}
      </button>

      <style>{`
        @import url('https://fonts.cdnfonts.com/css/opendyslexic');
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${primaryColor};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${primaryColor};
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input:focus {
          border-color: ${primaryColor} !important;
          box-shadow: 0 0 0 2px ${primaryColor}33 !important;
        }
        /* Accessibility CSS classes applied to host page */
        .a11y-text-scaled * { font-size: calc(1em * var(--a11y-text-scale, 1)) !important; }
        .a11y-line-height-scaled * { line-height: calc(1.5 * var(--a11y-line-height, 1)) !important; }
        .a11y-letter-spacing-scaled * { letter-spacing: var(--a11y-letter-spacing, 0) !important; }
        .a11y-high-contrast { filter: contrast(1.5) !important; }
        .a11y-inverted { filter: invert(1) hue-rotate(180deg) !important; }
        .a11y-dyslexia-font * { font-family: 'OpenDyslexic', sans-serif !important; }
        .a11y-hide-images img { opacity: 0 !important; }
        .a11y-focus-highlight *:focus { outline: 3px solid ${primaryColor} !important; outline-offset: 2px !important; }
        .a11y-protanopia { filter: url(#protanopia-filter) !important; }
        .a11y-deuteranopia { filter: url(#deuteranopia-filter) !important; }
        .a11y-tritanopia { filter: url(#tritanopia-filter) !important; }
      `}</style>
    </div>
  );
}

export default EmbeddableWidget;
