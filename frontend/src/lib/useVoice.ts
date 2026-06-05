"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

// Browser speech recognition (webkit prefix for Chrome/Safari)
const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    : null;

export function useVoice(onFinalTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);

  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSTTSupported = !!SpeechRecognitionAPI;
  const isTTSSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  function createRecognition() {
    if (!SpeechRecognitionAPI) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionAPI as any)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    return recognition;
  }

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI || isListening) return;

    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript("");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(final);
        setIsListening(false);
        recognitionRef.current = null;
        onFinalRef.current?.(final.trim());
      } else {
        setTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Speech recognition error:", event.error);
      }
      setIsListening(false);
      setTranscript("");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript("");
  }, []);

  // ── Browser TTS (fallback) ──────────────────────────────
  const speak = useCallback(
    (text: string, msgId?: number) => {
      if (!isTTSSupported) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingMsgId(msgId ?? null);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMsgId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isTTSSupported]
  );

  // ── OpenAI TTS (AI voice) ──────────────────────────────
  const speakWithAI = useCallback(
    async (text: string, msgId?: number): Promise<void> => {
      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();

      try {
        const res = await fetch(`${API_URL}/api/agent/tts/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: "nova" }),
        });

        if (!res.ok) {
          speak(text, msgId);
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        // Only set speaking when audio actually starts playing
        audio.onplay = () => {
          setIsSpeaking(true);
          setSpeakingMsgId(msgId ?? null);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setSpeakingMsgId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setSpeakingMsgId(null);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };

        await audio.play();
      } catch {
        // Fallback to browser TTS on network error
        speak(text, msgId);
      }
    },
    [speak]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMsgId(null);
  }, [isTTSSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (isTTSSupported) window.speechSynthesis.cancel();
    };
  }, [isTTSSupported]);

  return {
    // STT
    isListening,
    transcript,
    startListening,
    stopListening,
    isSTTSupported,
    // TTS (browser)
    isSpeaking,
    speakingMsgId,
    speak,
    stopSpeaking,
    isTTSSupported,
    // TTS (AI voice)
    speakWithAI,
  };
}
