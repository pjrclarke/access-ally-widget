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
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

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

  const speak = useCallback((text: string) => {
    if (!isSupported) {
      onError?.("Speech synthesis not supported");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Set voice if specified, otherwise use first available voice
    if (voices.length > 0) {
      if (voice) {
        const selectedVoice = voices.find(v => v.name === voice || v.lang === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else {
        // Use first English voice or default
        const englishVoice = voices.find(v => v.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
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
      if (event.error !== "interrupted") {
        onError?.(event.error);
      }
    };

    // Use setTimeout to work around Chrome bug where speech doesn't start
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, [rate, pitch, voice, voices, onEnd, onError, isSupported]);

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
  };
}
