import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
  language?: string;
  autoSendDelay?: number; // ms to wait after pause before auto-sending
}

interface SpeechRecognitionResult {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

// Types for Web Speech API
interface SpeechRecognitionEventResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionEventResult;
}

interface SpeechRecognitionEventType {
  resultIndex: number;
  results: SpeechRecognitionEventResultList;
}

interface SpeechRecognitionErrorEventType {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventType) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function useSpeechRecognition({
  onResult,
  onFinalResult,
  onError,
  continuous = true, // Default to true for natural multi-word speech
  language = "en-US",
  autoSendDelay = 2000, // 2 seconds pause triggers auto-send
}: UseSpeechRecognitionOptions = {}): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const accumulatedTranscriptRef = useRef("");
  const latestTranscriptRef = useRef("");
  // Tracks whether the user intends to keep listening (used for iOS/Safari where recognition frequently ends)
  const shouldListenRef = useRef(false);
  const isRestartingRef = useRef(false);
  
  // Store callbacks in refs to avoid recreating recognition on callback changes
  const onResultRef = useRef(onResult);
  const onFinalResultRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);
  
  // Keep refs updated
  useEffect(() => {
    onResultRef.current = onResult;
    onFinalResultRef.current = onFinalResult;
    onErrorRef.current = onError;
  }, [onResult, onFinalResult, onError]);
  
  // Clear pause timer
  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);
  
  // Start pause timer for auto-send
  const startPauseTimer = useCallback(() => {
    clearPauseTimer();
    pauseTimerRef.current = window.setTimeout(() => {
      const finalText = (accumulatedTranscriptRef.current || latestTranscriptRef.current).trim();
      if (finalText && onFinalResultRef.current) {
        onFinalResultRef.current(finalText);
        accumulatedTranscriptRef.current = "";
        latestTranscriptRef.current = "";
        setTranscript("");
        // Stop listening after auto-send for natural conversation flow
        if (recognitionRef.current) {
          // Prevent Safari/iOS onend auto-restart for this completed utterance
          shouldListenRef.current = false;
          recognitionRef.current.stop();
        }
      }
    }, autoSendDelay);
  }, [autoSendDelay, clearPauseTimer]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = 
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventType) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Accumulate final transcripts
        if (finalTranscript) {
          accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + finalTranscript;
        }

        const displayTranscript = accumulatedTranscriptRef.current + (interimTranscript ? " " + interimTranscript : "");
        latestTranscriptRef.current = displayTranscript.trim();
        setTranscript(displayTranscript.trim());

        // Call onResult for live updates
        if (onResultRef.current) {
          onResultRef.current(displayTranscript.trim());
        }

        // Reset pause timer on any speech activity (only if we have content)
        if (displayTranscript.trim()) {
          startPauseTimer();
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Normal/expected errors on mobile when user pauses or recognition is interrupted.
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }

        // Permission errors should disable auto-restart.
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldListenRef.current = false;
        }

        if (onErrorRef.current) {
          onErrorRef.current(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        // iOS/Safari: continuous is unreliable and recognition frequently ends.
        // If the user still intends to listen, restart to simulate continuous listening.
        if (shouldListenRef.current && recognitionRef.current) {
          if (isRestartingRef.current) return;
          isRestartingRef.current = true;

          window.setTimeout(() => {
            isRestartingRef.current = false;
            if (!shouldListenRef.current || !recognitionRef.current) return;
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Some browsers throw if start is called too quickly or without gesture; ignore.
              console.warn("Speech recognition restart failed:", e);
            }
          }, 150);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      clearPauseTimer();
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, language, startPauseTimer, clearPauseTimer]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      shouldListenRef.current = true;
      setTranscript("");
      accumulatedTranscriptRef.current = "";
      latestTranscriptRef.current = "";
      clearPauseTimer();
      try {
        recognitionRef.current.start();
        // Don't set isListening here - let onstart handle it
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }
  }, [isListening, clearPauseTimer]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearPauseTimer();
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening, clearPauseTimer]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  };
}
