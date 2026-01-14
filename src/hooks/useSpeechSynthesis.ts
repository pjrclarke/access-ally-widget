import { useCallback, useRef, useState, useEffect } from "react";

interface UseSpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface SpeechSynthesisResult {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  unlockAudio: () => void;
}

export function useSpeechSynthesis({
  rate = 1,
  pitch = 1,
  voice,
  onEnd,
  onError,
}: UseSpeechSynthesisOptions = {}): SpeechSynthesisResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const pendingTextRef = useRef<string | null>(null);

  // Load voices - they may not be immediately available
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    // Try to load immediately
    loadVoices();

    // Also listen for the voiceschanged event (required for some browsers)
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [isSupported]);

  // Mobile browsers require user interaction to unlock audio
  // This function should be called on the first user tap/click
  const unlockAudio = useCallback(() => {
    if (!isSupported || isUnlocked) return;

    // Create a silent utterance to "unlock" speech synthesis on mobile
    const utterance = new SpeechSynthesisUtterance("");
    utterance.volume = 0;
    utterance.onend = () => {
      setIsUnlocked(true);
      // If there's pending text to speak, speak it now
      if (pendingTextRef.current) {
        const text = pendingTextRef.current;
        pendingTextRef.current = null;
        // Small delay to ensure unlock is complete
        setTimeout(() => speakText(text), 100);
      }
    };
    utterance.onerror = () => {
      // Even on error, mark as attempted
      setIsUnlocked(true);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [isSupported, isUnlocked]);

  const speakText = useCallback((text: string) => {
    if (!isSupported) {
      onError?.("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Slightly slower rate sounds more natural
    utterance.rate = rate * 0.9;
    utterance.pitch = pitch;

    // Set voice - prefer high-quality voices that sound more natural
    if (voices.length > 0) {
      if (voice) {
        const selectedVoice = voices.find(v => v.name === voice || v.lang === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Prefer premium/natural voices - these sound less robotic
        const preferredVoices = [
          "Google UK English Female",
          "Google UK English Male", 
          "Google US English",
          "Samantha", // macOS
          "Karen", // macOS
          "Daniel", // macOS
          "Microsoft Zira",
          "Microsoft David",
        ];
        
        let selectedVoice = voices.find(v => 
          preferredVoices.some(pref => v.name.includes(pref))
        );
        
        // Fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith("en"));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setIsSpeaking(false);
      // Don't report "interrupted" as an error - it's expected when canceling
      if (event.error !== "interrupted" && event.error !== "canceled") {
        onError?.(event.error);
      }
    };

    // Mobile workaround: ensure synth is not paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Use setTimeout to work around Chrome/Safari bugs
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      
      // iOS Safari workaround: check if speech actually started
      // If not speaking after a short delay, try again
      setTimeout(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          window.speechSynthesis.speak(utterance);
        }
      }, 250);
    }, 50);
  }, [rate, pitch, voice, voices, onEnd, onError, isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      onError?.("Speech synthesis not supported");
      return;
    }

    // On mobile, if not yet unlocked, store the text and try to speak
    // The unlockAudio call on user interaction should handle it
    if (!isUnlocked) {
      pendingTextRef.current = text;
      // Still try to speak - it might work on some devices
      speakText(text);
      return;
    }

    speakText(text);
  }, [isSupported, isUnlocked, speakText, onError]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
    unlockAudio,
  };
}
