import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Mic, 
  MicOff, 
  X, 
  Send, 
  Volume2, 
  VolumeX,
  Accessibility,
  Loader2,
  Minimize2,
  Type,
  Contrast,
  Settings2,
  MessageSquare,
  RotateCcw,
  BookOpen,
  Ruler,
  Eye,
  Keyboard,
  AlignVerticalSpaceAround,
  Space,
  ImageOff,
  Focus,
  ClipboardCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileJson,
  FileText,
  Mail
} from "lucide-react";
import { getInitialScreenReaderPreference, setScreenReaderDetected } from "@/hooks/useScreenReaderDetection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useToast } from "@/hooks/use-toast";
import { useAccessibilityAudit, AuditIssue } from "./useAccessibilityAudit";
import { exportToPDF, exportToJSON } from "./useAuditExport";
// LocalStorage key for persisting settings
const STORAGE_KEY = "a11y-widget-settings";

type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia";

interface WidgetCustomization {
  primary_color: string;
  secondary_color: string;
  position: string;
  voice_rate: number;
  voice_pitch: number;
}

const DEFAULT_CUSTOMIZATION: WidgetCustomization = {
  primary_color: "#6366f1",
  secondary_color: "#8b5cf6",
  position: "bottom-right",
  voice_rate: 1.0,
  voice_pitch: 1.0,
};

interface AccessibilitySettings {
  textScale: number;
  lineHeight: number;
  letterSpacing: number;
  contrastMode: "normal" | "high" | "inverted";
  dyslexiaFont: boolean;
  readingGuide: boolean;
  colorBlindMode: ColorBlindMode;
  hideImages: boolean;
  focusHighlight: boolean;
  speechRate: number;
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

// Load settings from localStorage
function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn("Failed to load accessibility settings:", e);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: AccessibilitySettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("Failed to save accessibility settings:", e);
  }
}

// Strip markdown formatting for speech
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold **text**
    .replace(/\*([^*]+)\*/g, '$1')       // Italic *text*
    .replace(/__([^_]+)__/g, '$1')       // Bold __text__
    .replace(/_([^_]+)_/g, '$1')         // Italic _text_
    .replace(/~~([^~]+)~~/g, '$1')       // Strikethrough
    .replace(/`([^`]+)`/g, '$1')         // Inline code
    .replace(/```[\s\S]*?```/g, '')      // Code blocks
    .replace(/#{1,6}\s+/g, '')           // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Images
    .replace(/^\s*[-*+]\s+/gm, '')       // List items
    .replace(/^\s*\d+\.\s+/gm, '')       // Numbered lists
    .replace(/>\s+/g, '')                 // Blockquotes
    .replace(/\n{2,}/g, '. ')            // Multiple newlines to periods
    .replace(/\n/g, ' ')                  // Single newlines to spaces
    .trim();
}

// Strip [ACTION:...] and [SUGGESTIONS:...] markers and any stray JSON-like artifacts from content for display
function stripActionMarkers(text: string): string {
  return text
    // Remove [ACTION:TYPE:target] markers
    .replace(/\[ACTION:\w+:[^\]]*\]/gi, '')
    // Remove [SUGGESTIONS:...] block
    .replace(/\[SUGGESTIONS:[^\]]*\]/gi, '')
    // Remove common AI output artifacts like }] or [{ or stray brackets
    .replace(/^\s*[\[\{}\]]+\s*/g, '')
    .replace(/\s*[\[\{}\]]+\s*$/g, '')
    // Remove patterns like }] or [{ in the middle of text
    .replace(/\s*[\}\]]+\s*[\[\{]*\s*/g, ' ')
    // Remove em-dashes that might appear
    .replace(/—/g, ' - ')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Parse AI-generated suggestions from response
function parseAISuggestions(text: string): { label: string; prompt: string }[] {
  const match = text.match(/\[SUGGESTIONS:([^\]]+)\]/);
  if (!match) return [];
  
  const suggestionsStr = match[1];
  const pairs = suggestionsStr.split('||');
  
  return pairs
    .map(pair => {
      const [label, prompt] = pair.split('|');
      if (label && prompt) {
        return { label: label.trim(), prompt: prompt.trim() };
      }
      return null;
    })
    .filter((s): s is { label: string; prompt: string } => s !== null)
    .slice(0, 6); // Max 6 suggestions
}

// Default suggestions for the initial welcome message
function getDefaultSuggestions(): { label: string; prompt: string }[] {
  return [
    { label: "📄 Summarise page", prompt: "Summarise this page for me in a clear, concise way" },
    { label: "🗂️ Menu options", prompt: "Read out all the menu and navigation options on this page" },
    { label: "📑 Page headings", prompt: "Read out all the headings on this page to help me understand the structure" },
  ];
}

// Strip emojis from text for screen readers (they read emoji descriptions which is disruptive)
function stripEmojisForSR(text: string): string {
  // Remove emoji characters - this regex covers most common emoji ranges
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols extended
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // More media controls
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // More squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, coffee
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // Lightning
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Sports balls
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman, sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane to writing hand
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black nib
    .replace(/[\u{2714}]/gu, '')            // Check mark
    .replace(/[\u{2716}]/gu, '')            // X mark
    .replace(/[\u{271D}]/gu, '')            // Latin cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Asterisks
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross mark
    .replace(/[\u{274E}]/gu, '')            // Cross mark box
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Hearts
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Math symbols
    .replace(/[\u{27A1}]/gu, '')            // Right arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly loop
    .replace(/[\u{27BF}]/gu, '')            // Double curly loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation
    .replace(/[\u{3297}]/gu, '')            // Circled ideograph
    .replace(/[\u{3299}]/gu, '')            // Circled ideograph
    .trim();
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type TabType = "chat" | "visual" | "audit" | "speech";
type ChatMode = "voice" | "text";

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

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [chatMode, setChatMode] = useState<ChatMode>("text"); // Default to text mode for accessibility
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [hasAnnouncedOnboarding, setHasAnnouncedOnboarding] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<{ label: string; prompt: string }[]>(getDefaultSuggestions());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Disable speech by default if screen reader was previously detected
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(() => !getInitialScreenReaderPreference());
  const [screenReaderDetected, setScreenReaderDetectedState] = useState(getInitialScreenReaderPreference);
  const [readingGuideY, setReadingGuideY] = useState(0);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [widgetApiKey, setWidgetApiKey] = useState<string>("");
  const [customization, setCustomization] = useState<WidgetCustomization>(DEFAULT_CUSTOMIZATION);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const widgetButtonRef = useRef<HTMLButtonElement>(null);
  const srAnnouncementRef = useRef<HTMLDivElement>(null);
  const latestResponseRef = useRef<HTMLDivElement>(null);
  const responseAnnouncerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if running on Lovable preview/app domain (internal demo mode)
  const isInternalDemo = typeof window !== "undefined" && 
    (window.location.hostname.includes("lovable.app") || 
     window.location.hostname.includes("lovableproject.com") ||
     window.location.hostname.includes("localhost") ||
     window.location.hostname.includes("127.0.0.1"));

  // Fetch widget API key and customization settings on mount
  useEffect(() => {
    // For internal demo, use special key and default settings
    if (isInternalDemo) {
      setWidgetApiKey("INTERNAL_DEMO");
      // Fetch default settings from edge function
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-widget-settings`, {
        method: "GET",
        headers: {
          "x-api-key": "INTERNAL_DEMO",
          "Content-Type": "application/json",
        },
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setCustomization(data);
          }
        })
        .catch(console.warn);
      return;
    }
    
    const fetchApiKeyAndSettings = async () => {
      try {
        // First get the API key
        const { data, error } = await supabase
          .from("widget_api_keys")
          .select("api_key, primary_color, secondary_color, position, voice_rate, voice_pitch")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        
        if (data && !error) {
          setWidgetApiKey(data.api_key);
          setCustomization({
            primary_color: data.primary_color || DEFAULT_CUSTOMIZATION.primary_color,
            secondary_color: data.secondary_color || DEFAULT_CUSTOMIZATION.secondary_color,
            position: data.position || DEFAULT_CUSTOMIZATION.position,
            voice_rate: data.voice_rate || DEFAULT_CUSTOMIZATION.voice_rate,
            voice_pitch: data.voice_pitch || DEFAULT_CUSTOMIZATION.voice_pitch,
          });
        }
      } catch (e) {
        console.warn("Failed to fetch widget settings:", e);
      }
    };
    fetchApiKeyAndSettings();
  }, [isInternalDemo]);
  
  // Accessibility audit hook
  const { isScanning, result: auditResult, runAudit, clearResult: clearAuditResult } = useAccessibilityAudit();

  // Detect VoiceOver/screen reader on first user interaction
  // VoiceOver on iOS sends specific touch patterns we can detect
  useEffect(() => {
    if (screenReaderDetected) return; // Already detected

    const detectVoiceOver = () => {
      // If this event fired from a focus-only interaction (no preceding pointer),
      // it's likely a screen reader exploring the page
      // We use a simple heuristic: if the user interacts with the widget button
      // and we detect VoiceOver-specific behavior, disable speech
      
      // Check for iOS VoiceOver hint
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // On iOS with VoiceOver, touches are different
        // The widget being used suggests VoiceOver may be active
        // We'll set detected=true after 3 interactions without mouse movement
        let pointerMoved = false;
        
        const handlePointerMove = () => {
          pointerMoved = true;
        };
        
        const handleInteraction = () => {
          if (!pointerMoved) {
            // No pointer movement before interaction = likely VoiceOver
            setScreenReaderDetectedState(true);
            setScreenReaderDetected(true);
            setIsSpeechEnabled(false);
          }
          // Clean up
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("click", handleInteraction);
        };
        
        window.addEventListener("pointermove", handlePointerMove, { once: true, passive: true });
        window.addEventListener("click", handleInteraction, { once: true, passive: true });
        
        return () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("click", handleInteraction);
        };
      }
    };

    detectVoiceOver();
  }, [screenReaderDetected]);
  
  // Visual accessibility settings - initialize from localStorage
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  
  // Destructure for convenience
  const { textScale, lineHeight, letterSpacing, contrastMode, dyslexiaFont, readingGuide, colorBlindMode, hideImages, focusHighlight, speechRate } = settings;
  
  // Update a single setting and persist
  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // Voice UX: push-to-talk (turn-based). We do NOT auto-start the mic after the assistant speaks.

  const { speak, stop: stopSpeaking, isSpeaking, unlockAudio } = useSpeechSynthesis({
    rate: speechRate,
    onError: (error) => console.error("Speech synthesis error:", error),
  });

  // Ref to hold sendMessage for voice callback (avoids circular dependency)
  const sendMessageRef = useRef<(text: string) => void>(() => {});

  const handleVoiceResult = useCallback((transcript: string) => {
    setInputValue(transcript);
  }, []);

  // Auto-send after natural pause
  const handleVoiceFinalResult = useCallback((transcript: string) => {
    if (transcript.trim()) {
      sendMessageRef.current(transcript);
    }
  }, []);

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    isSupported: isVoiceSupported 
  } = useSpeechRecognition({
    onResult: handleVoiceResult,
    onFinalResult: handleVoiceFinalResult,
    continuous: true, // Keep listening for multi-word phrases
    autoSendDelay: 2000, // 2 seconds of silence triggers send
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

  // Screen-reader onboarding announcement on page load (no TTS)
  useEffect(() => {
    if (hasAnnouncedOnboarding) return;
    
    // Announce to screen readers after a short delay
    const timer = setTimeout(() => {
      const domain = getCleanDomain();
      if (srAnnouncementRef.current) {
        srAnnouncementRef.current.textContent = `Welcome to ${domain}. This website has an AI accessibility assistant to help you navigate. Press Alt+A to open, or Tab to the accessibility button.`;
      }
      setHasAnnouncedOnboarding(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [hasAnnouncedOnboarding]);

  // Focus widget button on first Tab press for keyboard users
  useEffect(() => {
    let hasTabbed = false;
    
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === "Tab" && !hasTabbed && !hasAnnouncedOnboarding) {
        hasTabbed = true;
        // Don't prevent default - let them tab naturally, but ensure widget button is focusable
      }
    };
    
    window.addEventListener("keydown", handleFirstTab);
    return () => window.removeEventListener("keydown", handleFirstTab);
  }, [hasAnnouncedOnboarding]);

  // Generate welcome message for when widget opens (user-initiated)
  const getWelcomeMessage = useCallback(() => {
    const domain = getCleanDomain();
    return `Welcome to the accessibility assistant for ${domain}. Type what you'd like me to help with, or switch to voice mode to speak your instructions. I can summarise this page, read out the menu options, find downloadable links, or read the page headings to help you navigate.`;
  }, []);

  // Show welcome when widget opens (user-initiated, not auto-TTS on load)
  useEffect(() => {
    if (isOpen && !hasShownWelcome && messages.length === 0) {
      setHasShownWelcome(true);
      const welcomeMessage = getWelcomeMessage();
      setMessages([{ role: "assistant", content: welcomeMessage }]);
      
      // Only speak if user has speech enabled AND actively opened the widget
      if (isSpeechEnabled && chatMode === "voice" && isVoiceSupported) {
        unlockAudio();
        speak(welcomeMessage);
      }
    }
    
    // Focus input when in text mode
    if (isOpen && chatMode === "text") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasShownWelcome, messages.length, getWelcomeMessage, isSpeechEnabled, chatMode, isVoiceSupported, unlockAudio, speak]);

  // Stop listening when switching to text mode
  useEffect(() => {
    if (chatMode === "text" && isListening) {
      stopListening();
    }
  }, [chatMode, isListening, stopListening]);

  // Get page content and interactive elements for context
  const getPageContext = useCallback(() => {
    // Get main content for context
    const mainContent = document.querySelector("main")?.textContent || 
                       document.body.textContent || "";
    
    // Get clickable elements for AI to reference
    const interactiveElements: string[] = [];
    document.querySelectorAll('button, a, [role="button"], input[type="submit"]').forEach((el, i) => {
      const text = el.textContent?.trim() || el.getAttribute('aria-label') || '';
      const id = el.id || '';
      if (text && i < 20) { // Limit to 20 elements
        interactiveElements.push(`[${i}] ${text}${id ? ` (id: ${id})` : ''}`);
      }
    });
    
    return {
      content: mainContent.slice(0, 2000).trim(),
      interactiveElements: interactiveElements.join('\n')
    };
  }, []);

  // Execute page actions returned by AI
  const executeAction = useCallback((action: string) => {
    const actionMatch = action.match(/\[ACTION:(\w+):(.+?)\]/);
    if (!actionMatch) return;
    
    const [, actionType, target] = actionMatch;
    let element: Element | null = null;
    
    // Try to find element by various methods
    // Try by ID first
    element = document.getElementById(target);
    
    // Try by text content
    if (!element) {
      const allElements = document.querySelectorAll('button, a, [role="button"], input, textarea');
      for (const el of allElements) {
        if (el.textContent?.toLowerCase().includes(target.toLowerCase()) ||
            el.getAttribute('aria-label')?.toLowerCase().includes(target.toLowerCase())) {
          element = el;
          break;
        }
      }
    }
    
    // Try by selector
    if (!element) {
      try {
        element = document.querySelector(target);
      } catch {
        // Invalid selector, ignore
      }
    }
    
    if (!element) {
      console.warn(`Could not find element: ${target}`);
      return;
    }
    
    switch (actionType.toUpperCase()) {
      case 'CLICK':
        (element as HTMLElement).click();
        break;
      case 'SCROLL':
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      case 'FOCUS':
        (element as HTMLElement).focus();
        break;
      case 'FILL':
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          const valueMatch = action.match(/\[ACTION:FILL:(.+?):(.+?)\]/);
          if (valueMatch) {
            element.value = valueMatch[2];
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        break;
    }
  }, []);

  const sendAuditEmail = useCallback(async () => {
    if (!emailAddress.trim() || !auditResult || isSendingEmail) return;
    
    setIsSendingEmail(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-audit-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            recipientEmail: emailAddress.trim(),
            auditResult,
            pageUrl: window.location.href,
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast({
        title: "Report Sent!",
        description: `Audit report sent to ${emailAddress}`,
      });
      setEmailDialogOpen(false);
      setEmailAddress("");
    } catch (error) {
      toast({
        title: "Failed to send",
        description: error instanceof Error ? error.message : "Could not send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  }, [emailAddress, auditResult, isSendingEmail, toast]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const pageContext = getPageContext();
    
    // Set up delayed "please wait" message
    let hasReceivedResponse = false;
    const waitMessageTimeout = setTimeout(() => {
      if (!hasReceivedResponse) {
        const waitMessage = "Please give me a second while I find that for you...";
        if (isSpeechEnabled) {
          speak(waitMessage);
        }
      }
    }, 3000); // 3 seconds before showing wait message

    const longWaitTimeout = setTimeout(() => {
      if (!hasReceivedResponse) {
        const apologyMessage = "Sorry this is taking longer than usual. I'm still working on it...";
        if (isSpeechEnabled) {
          speak(apologyMessage);
        }
      }
    }, 8000); // 8 seconds for apology
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      };
      
      // Add widget API key if available
      if (widgetApiKey) {
        headers["x-api-key"] = widgetApiKey;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: messageText,
            pageContent: pageContext.content,
            interactiveElements: pageContext.interactiveElements,
            pageUrl: window.location.href,
          }),
        }
      );

      // Clear timeouts once we get a response
      hasReceivedResponse = true;
      clearTimeout(waitMessageTimeout);
      clearTimeout(longWaitTimeout);

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
              // Strip action markers for display but keep raw content for execution
              const displayContent = stripActionMarkers(assistantContent);
              setMessages(prev => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]?.role === "assistant") {
                  updated[lastIdx] = { ...updated[lastIdx], content: displayContent };
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

      // Execute any actions in the response
      const actionMatches = assistantContent.match(/\[ACTION:\w+:.+?\]/g);
      if (actionMatches) {
        actionMatches.forEach(action => {
          executeAction(action);
        });
      }

      // Parse and set AI-generated suggestions
      const aiSuggestions = parseAISuggestions(assistantContent);
      if (aiSuggestions.length > 0) {
        setCurrentSuggestions(aiSuggestions);
      } else {
        // Fallback to defaults if AI didn't provide suggestions
        setCurrentSuggestions(getDefaultSuggestions());
      }

      // Speak the response if enabled (strip markdown, actions and suggestions for cleaner speech)
      // BUT only if screen reader is NOT detected (to avoid double speech)
      const cleanContent = stripMarkdown(assistantContent)
        .replace(/\[ACTION:\w+:.+?\]/g, '')
        .replace(/\[SUGGESTIONS:[^\]]*\]/g, '');
      
      if (isSpeechEnabled && !screenReaderDetected && cleanContent.trim()) {
        speak(cleanContent);
      }

      // For screen reader users: announce the response via live region
      // and focus on the latest response after a short delay
      if (screenReaderDetected && responseAnnouncerRef.current && cleanContent.trim()) {
        // Update the live region to announce the response
        responseAnnouncerRef.current.textContent = cleanContent.trim();
      }

      // Focus on the latest response for VoiceOver navigation
      setTimeout(() => {
        if (latestResponseRef.current) {
          latestResponseRef.current.focus();
        }
      }, 100);
    } catch (error) {
      // Clear timeouts on error
      hasReceivedResponse = true;
      clearTimeout(waitMessageTimeout);
      clearTimeout(longWaitTimeout);
      
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
  }, [isLoading, getPageContext, executeAction, isSpeechEnabled, screenReaderDetected, speak, toast, widgetApiKey]);

  // Keep sendMessageRef updated
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
    }
    sendMessage(inputValue);
  };

  const handleVoiceToggle = () => {
    // Unlock audio on mobile when user taps the mic button
    unlockAudio();
    
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
    // Unlock audio on mobile when user toggles speech
    unlockAudio();
    
    if (isSpeechEnabled) {
      stopSpeaking();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  // Apply visual accessibility settings to the page
  useEffect(() => {
    const root = document.documentElement;
    
    // Text scaling - uses CSS custom property for smooth scaling
    root.classList.remove("a11y-text-scaled");
    if (textScale !== 100) {
      root.style.setProperty("--a11y-text-scale", String(textScale / 100));
      root.classList.add("a11y-text-scaled");
    } else {
      root.style.removeProperty("--a11y-text-scale");
    }
    
    // Line height
    if (lineHeight !== 100) {
      root.style.setProperty("--a11y-line-height", String(lineHeight / 100));
      root.classList.add("a11y-line-height-scaled");
    } else {
      root.style.removeProperty("--a11y-line-height");
      root.classList.remove("a11y-line-height-scaled");
    }
    
    // Letter spacing
    if (letterSpacing !== 0) {
      root.style.setProperty("--a11y-letter-spacing", `${letterSpacing / 100}em`);
      root.classList.add("a11y-letter-spacing-scaled");
    } else {
      root.style.removeProperty("--a11y-letter-spacing");
      root.classList.remove("a11y-letter-spacing-scaled");
    }
    
    // Contrast modes
    root.classList.remove("a11y-high-contrast", "a11y-inverted");
    if (contrastMode === "high") {
      root.classList.add("a11y-high-contrast");
    } else if (contrastMode === "inverted") {
      root.classList.add("a11y-inverted");
    }
    
    // Dyslexia font
    if (dyslexiaFont) {
      root.classList.add("a11y-dyslexia-font");
    } else {
      root.classList.remove("a11y-dyslexia-font");
    }
    
    // Reading guide
    if (readingGuide) {
      root.classList.add("a11y-reading-guide-active");
    } else {
      root.classList.remove("a11y-reading-guide-active");
    }
    
    // Color blind modes
    root.classList.remove("a11y-protanopia", "a11y-deuteranopia", "a11y-tritanopia");
    if (colorBlindMode !== "normal") {
      root.classList.add(`a11y-${colorBlindMode}`);
    }
    
    // Hide images
    if (hideImages) {
      root.classList.add("a11y-hide-images");
    } else {
      root.classList.remove("a11y-hide-images");
    }
    
    // Focus highlight
    if (focusHighlight) {
      root.classList.add("a11y-focus-highlight");
    } else {
      root.classList.remove("a11y-focus-highlight");
    }
    
    return () => {
      // Cleanup on unmount
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
  }, [textScale, lineHeight, letterSpacing, contrastMode, dyslexiaFont, readingGuide, colorBlindMode, hideImages, focusHighlight]);

  // Reading guide mouse tracking
  useEffect(() => {
    if (!readingGuide) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setReadingGuideY(e.clientY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [readingGuide]);

  const resetVisualSettings = () => {
    const newSettings = { ...DEFAULT_SETTINGS };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const hasCustomSettings = textScale !== 100 || lineHeight !== 100 || letterSpacing !== 0 || contrastMode !== "normal" || dyslexiaFont || readingGuide || colorBlindMode !== "normal" || hideImages || focusHighlight;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Alt key is pressed
      if (!e.altKey) return;
      
      // Prevent default for our shortcuts
      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          setIsOpen(prev => !prev);
          break;
        case 'r':
          e.preventDefault();
          updateSetting("readingGuide", !readingGuide);
          break;
        case 'd':
          e.preventDefault();
          updateSetting("dyslexiaFont", !dyslexiaFont);
          break;
        case 'h':
          e.preventDefault();
          updateSetting("contrastMode", contrastMode === "high" ? "normal" : "high");
          break;
        case '+':
        case '=':
          e.preventDefault();
          updateSetting("textScale", Math.min(200, textScale + 25));
          break;
        case '-':
          e.preventDefault();
          updateSetting("textScale", Math.max(75, textScale - 25));
          break;
        case '0':
          e.preventDefault();
          resetVisualSettings();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readingGuide, dyslexiaFont, contrastMode, textScale, updateSetting]);

  // Listen for external open widget event (e.g., from "Get Started" button)
  useEffect(() => {
    const handleOpenWidget = (e: CustomEvent<{ message?: string }>) => {
      if (!isOpen) {
        setIsOpen(true);
        // Add a "get started" response if the widget was closed
        if (e.detail?.message === "get started") {
          const getStartedMessage: Message = {
            role: "assistant",
            content: "Ok, let's get started! Here's what you can do now: I can summarise page content, read out menu options, find downloadable files, help you navigate to sections, or click links for you. Just ask me what you need!",
          };
          setMessages(prev => [...prev, getStartedMessage]);
          setHasShownWelcome(true);
        }
      }
      // If already open, do nothing (leave it open)
    };
    
    window.addEventListener("openA11yWidget", handleOpenWidget as EventListener);
    return () => window.removeEventListener("openA11yWidget", handleOpenWidget as EventListener);
  }, [isOpen]);

  return (
    <>
      {/* SVG Filters for Color Blindness Correction */}
      <svg className="absolute h-0 w-0" aria-hidden="true">
        <defs>
          {/* Protanopia filter - shifts reds to be more distinguishable */}
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          {/* Deuteranopia filter - shifts greens to be more distinguishable */}
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          {/* Tritanopia filter - shifts blues to be more distinguishable */}
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
      
      {/* Reading Guide Overlay */}
      {readingGuide && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9999]"
          aria-hidden="true"
        >
          {/* Dark overlay above the reading line */}
          <div 
            className="absolute left-0 right-0 top-0 bg-black/40 transition-all duration-75"
            style={{ height: Math.max(0, readingGuideY - 20) }}
          />
          {/* Clear reading strip */}
          <div 
            className="absolute left-0 right-0 h-10 border-y-2 border-primary/50"
            style={{ top: Math.max(0, readingGuideY - 20) }}
          />
          {/* Dark overlay below the reading line */}
          <div 
            className="absolute left-0 right-0 bottom-0 bg-black/40 transition-all duration-75"
            style={{ top: readingGuideY + 20 }}
          />
        </div>
      )}
    
      {/* Screen reader announcement (visually hidden) */}
      <div
        ref={srAnnouncementRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Floating Button */}
      <button
        ref={widgetButtonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
          "hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30",
          "flex items-center justify-center",
          customization.position === "bottom-left" ? "left-6" : "right-6",
          isOpen && "rotate-90 scale-90"
        )}
        style={{ backgroundColor: customization.primary_color }}
        aria-label={isOpen ? "Close accessibility assistant" : "Open accessibility assistant. Press Enter to open."}
        aria-expanded={isOpen}
        aria-describedby="a11y-widget-desc"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Accessibility className="h-6 w-6 text-white" />
        )}
      </button>
      <span id="a11y-widget-desc" className="sr-only">
        AI-powered accessibility assistant. Helps navigate pages, summarise content, and adjust visual settings.
      </span>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-24 z-50 w-[380px] max-w-[calc(100vw-48px)]",
          "rounded-2xl border border-border bg-card shadow-2xl",
          "transition-all duration-300",
          customization.position === "bottom-left" ? "left-6 origin-bottom-left" : "right-6 origin-bottom-right",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        role="dialog"
        aria-label="Accessibility Assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: customization.primary_color }}
            >
              <Accessibility className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">Accessibility Assistant</h2>
                {screenReaderDetected && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 cursor-help"
                        aria-label="Screen reader mode active - widget speech disabled"
                      >
                        <Eye className="h-2.5 w-2.5" aria-hidden="true" />
                        SR
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px] text-center">
                      <p className="text-xs">Screen reader detected. Widget speech is disabled to avoid conflicts with your assistive technology.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTab === "chat" ? "Ask me anything about this page" : "Visual settings"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {activeTab === "chat" && (
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
            )}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "chat" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-selected={activeTab === "chat"}
            role="tab"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab("visual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "visual" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-selected={activeTab === "visual"}
            role="tab"
          >
            <Settings2 className="h-4 w-4" />
            Visual
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "audit" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-selected={activeTab === "audit"}
            role="tab"
          >
            <ClipboardCheck className="h-4 w-4" />
            Audit
          </button>
          <button
            onClick={() => setActiveTab("speech")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              activeTab === "speech" 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-selected={activeTab === "speech"}
            role="tab"
          >
            <Volume2 className="h-4 w-4" />
            Speech
          </button>
        </div>

        {/* Chat Tab Content */}
        {activeTab === "chat" && (
          <>
            {/* Voice/Text Mode Toggle */}
            <div className="px-4 pt-3 pb-2 border-b border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {chatMode === "voice" ? (
                    <Mic className="h-4 w-4 text-primary" />
                  ) : (
                    <Type className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {chatMode === "voice" ? "Voice Chat" : "Text Chat"}
                  </span>
                </div>
                <button
                  onClick={() => setChatMode(chatMode === "voice" ? "text" : "voice")}
                  className="text-xs px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                >
                  Switch to {chatMode === "voice" ? "Text" : "Voice"}
                </button>
              </div>
              {chatMode === "voice" && isVoiceSupported && isSpeaking && (
                <p className="text-xs text-primary mt-1.5 animate-pulse">
                  🔊 Speaking... I'll start listening when I'm done.
                </p>
              )}
              {chatMode === "voice" && isVoiceSupported && !isSpeaking && isListening && (
                <p className="text-xs text-primary mt-1.5 animate-pulse">
                  🎤 Listening... Speak now or click "Switch to Text" to type instead.
                </p>
              )}
              {chatMode === "voice" && isVoiceSupported && !isSpeaking && !isListening && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Click the microphone below to start speaking, or "Switch to Text" to type.
                </p>
              )}
              {chatMode === "voice" && !isVoiceSupported && (
                <p className="text-xs text-warning mt-1.5">
                  Voice not supported in this browser. Please use text mode.
                </p>
              )}
            </div>

            {/* Screen reader live region for response announcements */}
            <div
              ref={responseAnnouncerRef}
              role="status"
              aria-live="assertive"
              aria-atomic="true"
              className="sr-only"
            />

            {/* Messages */}
            <div 
              className="h-[280px] overflow-y-auto p-4 space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages.map((message, index) => {
                const isLatestAssistant = message.role === "assistant" && index === messages.length - 1;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      ref={isLatestAssistant ? latestResponseRef : undefined}
                      tabIndex={isLatestAssistant ? -1 : undefined}
                      aria-label={isLatestAssistant ? `Assistant response: ${message.content}` : undefined}
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md",
                        isLatestAssistant && "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}
              {/* Contextual action buttons - shown after every AI reply */}
              {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !isLoading && currentSuggestions.length > 0 && (
                <div className="flex flex-col items-center pt-3 pb-1">
                  <p className="text-xs text-muted-foreground mb-2" id="suggestions-label">
                    What would you like to do next?
                  </p>
                  <div 
                    className={cn(
                      "grid gap-2 w-full",
                      currentSuggestions.length <= 3 ? "grid-cols-1 max-w-[200px]" : "grid-cols-2 max-w-[300px]"
                    )}
                    role="group"
                    aria-labelledby="suggestions-label"
                  >
                    {currentSuggestions.map((action, idx) => {
                      // Strip emojis for screen reader label, but keep visual display
                      const srLabel = stripEmojisForSR(action.label);
                      return (
                        <button
                          key={idx}
                          onClick={() => sendMessage(action.prompt)}
                          className="px-3 py-2 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left font-medium border border-primary/30 text-foreground"
                          aria-label={srLabel}
                        >
                          {/* Hide emoji from screen readers but show visually */}
                          <span aria-hidden="true">{action.label}</span>
                          <span className="sr-only">{srLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading response" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {/* Visual Tab Content */}
        {activeTab === "visual" && (
          <div className="h-[280px] overflow-y-auto p-4 space-y-5">
            {/* Text Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-foreground" aria-hidden="true" />
                  <label id="text-size-label" className="text-sm font-medium text-foreground">Text Size</label>
                </div>
                <span className="text-sm font-semibold text-foreground" aria-live="polite">{textScale}%</span>
              </div>
              <Slider
                value={[textScale]}
                onValueChange={(value) => updateSetting("textScale", value[0])}
                min={100}
                max={150}
                step={10}
                className="w-full"
                aria-labelledby="text-size-label"
                aria-valuemin={100}
                aria-valuemax={150}
                aria-valuenow={textScale}
              />
              <div className="flex justify-between text-xs text-foreground/70">
                <span>Normal</span>
                <span className="font-medium">Large</span>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlignVerticalSpaceAround className="h-4 w-4 text-foreground" aria-hidden="true" />
                  <label id="line-height-label" className="text-sm font-medium text-foreground">Line Spacing</label>
                </div>
                <span className="text-sm font-semibold text-foreground" aria-live="polite">{lineHeight}%</span>
              </div>
              <Slider
                value={[lineHeight]}
                onValueChange={(value) => updateSetting("lineHeight", value[0])}
                min={100}
                max={200}
                step={25}
                className="w-full"
                aria-labelledby="line-height-label"
                aria-valuemin={100}
                aria-valuemax={200}
                aria-valuenow={lineHeight}
              />
              <div className="flex justify-between text-xs text-foreground/70">
                <span>Normal</span>
                <span className="font-medium">Spacious</span>
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Space className="h-4 w-4 text-foreground" aria-hidden="true" />
                  <label id="letter-spacing-label" className="text-sm font-medium text-foreground">Letter Spacing</label>
                </div>
                <span className="text-sm font-semibold text-foreground" aria-live="polite">+{letterSpacing}%</span>
              </div>
              <Slider
                value={[letterSpacing]}
                onValueChange={(value) => updateSetting("letterSpacing", value[0])}
                min={0}
                max={20}
                step={5}
                className="w-full"
                aria-labelledby="letter-spacing-label"
                aria-valuemin={0}
                aria-valuemax={20}
                aria-valuenow={letterSpacing}
              />
              <div className="flex justify-between text-xs text-foreground/70">
                <span>Normal</span>
                <span className="font-medium">Wide</span>
              </div>
            </div>
            {/* Contrast Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-foreground" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">Contrast Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateSetting("contrastMode", "normal")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    contrastMode === "normal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={contrastMode === "normal"}
                >
                  Normal
                </button>
                <button
                  onClick={() => updateSetting("contrastMode", "high")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    contrastMode === "high"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={contrastMode === "high"}
                >
                  High
                </button>
                <button
                  onClick={() => updateSetting("contrastMode", "inverted")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    contrastMode === "inverted"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={contrastMode === "inverted"}
                >
                  Inverted
                </button>
              </div>
            </div>

            {/* Dyslexia Font Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-foreground" aria-hidden="true" />
                <div>
                  <span id="dyslexia-label" className="text-sm font-medium text-foreground">Dyslexia-Friendly Font</span>
                  <p className="text-xs text-foreground/70">Uses OpenDyslexic font</p>
                </div>
              </div>
              <Switch
                checked={dyslexiaFont}
                onCheckedChange={(checked) => updateSetting("dyslexiaFont", checked)}
                aria-labelledby="dyslexia-label"
              />
            </div>

            {/* Reading Guide Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-foreground" aria-hidden="true" />
                <div>
                  <span id="reading-guide-label" className="text-sm font-medium text-foreground">Reading Guide</span>
                  <p className="text-xs text-foreground/70">Highlights current line</p>
                </div>
              </div>
              <Switch
                checked={readingGuide}
                onCheckedChange={(checked) => updateSetting("readingGuide", checked)}
                aria-labelledby="reading-guide-label"
              />
            </div>

            {/* Hide Images Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <ImageOff className="h-4 w-4 text-foreground" aria-hidden="true" />
                <div>
                  <span id="hide-images-label" className="text-sm font-medium text-foreground">Hide Images</span>
                  <p className="text-xs text-foreground/70">Reduces visual clutter</p>
                </div>
              </div>
              <Switch
                checked={hideImages}
                onCheckedChange={(checked) => updateSetting("hideImages", checked)}
                aria-labelledby="hide-images-label"
              />
            </div>

            {/* Focus Highlight Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Focus className="h-4 w-4 text-foreground" aria-hidden="true" />
                <div>
                  <span id="focus-highlight-label" className="text-sm font-medium text-foreground">Focus Highlight</span>
                  <p className="text-xs text-foreground/70">Enhanced focus outlines</p>
                </div>
              </div>
              <Switch
                checked={focusHighlight}
                onCheckedChange={(checked) => updateSetting("focusHighlight", checked)}
                aria-labelledby="focus-highlight-label"
              />
            </div>
            {/* Color Blind Mode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-foreground" aria-hidden="true" />
                <span className="text-sm font-medium text-foreground">Color Vision</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSetting("colorBlindMode", "normal")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    colorBlindMode === "normal"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={colorBlindMode === "normal"}
                >
                  Normal
                </button>
                <button
                  onClick={() => updateSetting("colorBlindMode", "protanopia")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    colorBlindMode === "protanopia"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={colorBlindMode === "protanopia"}
                >
                  Protanopia
                </button>
                <button
                  onClick={() => updateSetting("colorBlindMode", "deuteranopia")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    colorBlindMode === "deuteranopia"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={colorBlindMode === "deuteranopia"}
                >
                  Deuteranopia
                </button>
                <button
                  onClick={() => updateSetting("colorBlindMode", "tritanopia")}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg border transition-all",
                    colorBlindMode === "tritanopia"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  )}
                  aria-pressed={colorBlindMode === "tritanopia"}
                >
                  Tritanopia
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={resetVisualSettings}
              className="w-full"
              disabled={!hasCustomSettings}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>

            {/* Keyboard Shortcuts Info */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Keyboard Shortcuts</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+A</kbd> Toggle Panel</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+R</kbd> Reading Guide</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+D</kbd> Dyslexia Font</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+H</kbd> High Contrast</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt++</kbd> Increase Text</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+-</kbd> Decrease Text</span>
                <span><kbd className="px-1 py-0.5 bg-secondary rounded text-[10px]">Alt+0</kbd> Reset All</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab Content */}
        {activeTab === "audit" && (
          <div className="h-[280px] overflow-y-auto p-4 space-y-4">
            {!auditResult ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ClipboardCheck className="h-12 w-12 mb-4 text-muted-foreground opacity-30" />
                <h3 className="font-medium mb-2">Accessibility Audit</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this page for common WCAG accessibility issues
                </p>
                <Button 
                  onClick={runAudit} 
                  disabled={isScanning}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Run Audit
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4 max-w-[280px]">
                  This tool checks for common issues. A full audit requires manual review.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score Card */}
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Accessibility Score</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      auditResult.score >= 80 ? "text-success" :
                      auditResult.score >= 50 ? "text-warning" : "text-destructive"
                    )}>
                      {auditResult.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        auditResult.score >= 80 ? "bg-success" :
                        auditResult.score >= 50 ? "bg-warning" : "bg-destructive"
                      )}
                      style={{ width: `${auditResult.score}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {auditResult.passedChecks}/{auditResult.totalChecks} checks passed
                  </p>
                </div>

                {/* Issues List */}
                {auditResult.issues.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Issues Found ({auditResult.issues.length})
                    </h4>
                    {auditResult.issues.map((issue) => (
                      <div 
                        key={issue.id}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                          className="w-full p-3 flex items-start gap-3 text-left hover:bg-secondary/50 transition-colors"
                        >
                          {issue.type === "error" ? (
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                          ) : issue.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{issue.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                                {issue.wcagCriteria}
                              </span>
                            </div>
                          </div>
                          {expandedIssue === issue.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {expandedIssue === issue.id && (
                          <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border bg-secondary/30">
                            <p className="text-xs text-muted-foreground pt-2">{issue.description}</p>
                            <div className="text-xs">
                              <span className="font-medium text-foreground">How to fix: </span>
                              <span className="text-muted-foreground">{issue.howToFix}</span>
                            </div>
                            {issue.element && (
                              <code className="block text-[10px] px-2 py-1 bg-secondary rounded text-muted-foreground font-mono">
                                {issue.element}
                              </code>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-success mb-2" />
                    <p className="font-medium text-sm">No issues found!</p>
                    <p className="text-xs text-muted-foreground">This page passes basic accessibility checks.</p>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Export Report</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportToPDF(auditResult)}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportToJSON(auditResult)}
                      className="flex-1"
                    >
                      <FileJson className="h-4 w-4 mr-1" />
                      JSON
                    </Button>
                  </div>
                  
                  {/* Email Report */}
                  <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email to Developer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send Audit Report</DialogTitle>
                        <DialogDescription>
                          Send a detailed HTML report to your developer's email address.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Developer Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="developer@example.com"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                          />
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Score:</span>
                            <span className={cn(
                              "font-medium",
                              auditResult.score >= 80 ? "text-success" :
                              auditResult.score >= 50 ? "text-warning" : "text-destructive"
                            )}>
                              {auditResult.score}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Issues:</span>
                            <span className="font-medium">{auditResult.issues.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Page:</span>
                            <span className="font-medium text-xs truncate max-w-[180px]">{window.location.pathname}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button 
                          size="sm"
                          onClick={sendAuditEmail}
                          disabled={!emailAddress.trim() || isSendingEmail}
                          className="bg-gradient-primary hover:opacity-90"
                        >
                          {isSendingEmail ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Report
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Re-scan Button */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAuditResult}
                    className="flex-1"
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={runAudit}
                    disabled={isScanning}
                    className="flex-1"
                  >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-scan"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Speech Tab Content */}
        {activeTab === "speech" && (
          <div className="h-[280px] overflow-y-auto p-4 space-y-5">
            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Speech Rate</span>
                </div>
                <span className="text-sm text-muted-foreground font-medium">{speechRate.toFixed(1)}x</span>
              </div>
              <Slider
                value={[speechRate]}
                onValueChange={(value) => updateSetting("speechRate", value[0])}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
                aria-label="Speech rate"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slower (0.5x)</span>
                <span>Faster (2.0x)</span>
              </div>
            </div>

            {/* Speech Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {isSpeechEnabled ? (
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Enable Speech Output</span>
              </div>
              <Switch
                checked={isSpeechEnabled}
                onCheckedChange={setIsSpeechEnabled}
                aria-label="Toggle speech output"
              />
            </div>

            {/* Info Section */}
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Speech settings:</strong> Control how the assistant reads responses aloud. 
                Adjust the rate to speed up or slow down speech output.
              </p>
            </div>

            {/* Test Speech Button */}
            <Button
              variant="outline"
              onClick={() => {
                unlockAudio();
                speak("This is a test of the speech output at your selected rate.");
              }}
              className="w-full"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test Speech
            </Button>

            {/* Reset Button */}
            <Button
              variant="ghost"
              onClick={() => updateSetting("speechRate", 1.0)}
              className="w-full text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default (1.0x)
            </Button>
          </div>
        )}

        {/* Input - only show on chat tab */}
        {activeTab === "chat" && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            {chatMode === "voice" && isVoiceSupported ? (
              // Voice mode: Show listening status with stop button
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        unlockAudio();
                        startListening();
                      }
                    }}
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                      isListening 
                        ? "bg-destructive text-destructive-foreground animate-pulse" 
                        : "bg-primary text-primary-foreground"
                    )}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  {inputValue && (
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-gradient-primary hover:opacity-90 transition-opacity"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {isListening && (
                  <p className="text-xs text-primary animate-pulse text-center">
                    {inputValue ? `"${inputValue}"` : "Listening..."}
                  </p>
                )}
                {!isListening && !isLoading && (
                  <p className="text-xs text-muted-foreground text-center">
                    Click the microphone to start speaking
                  </p>
                )}
              </div>
            ) : (
              // Text mode: Show standard input
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your question..."
                    className="transition-all"
                    disabled={isLoading}
                    aria-label="Your message"
                  />
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
            )}
          </form>
        )}
      </div>
    </>
  );
}
