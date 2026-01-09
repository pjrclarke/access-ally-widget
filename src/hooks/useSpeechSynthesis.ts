import { useCallback, useRef } from "react";

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
  const isSpeakingRef = useRef(false);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

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

    // Set voice if specified
    if (voice) {
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(v => v.name === voice || v.lang === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      isSpeakingRef.current = false;
      onError?.(event.error);
    };

    window.speechSynthesis.speak(utterance);
  }, [rate, pitch, voice, onEnd, onError, isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking: isSpeakingRef.current,
    isSupported,
  };
}
