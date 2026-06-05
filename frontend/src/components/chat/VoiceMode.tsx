"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useVoice } from "@/lib/useVoice";
import type { AgentWebSocket } from "@/lib/websocket";
import { LogoMark } from "@/components/Logo";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type ProductData = {
  id: string;
  title: string;
  image: string | null;
  merchant: string;
  variants: { id: string; title: string; price: string; currency?: string; available: number }[];
};

/* ─── Icons ─────────────────────────────────────────────── */
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

/* ─── Voice Product Card ──────────────────────────────────── */
function VoiceProductCard({ product }: { product: ProductData }) {
  const currency = product.variants[0]?.currency ?? "USD";
  const SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  const prefix = SYMBOLS[currency] ?? `${currency} `;

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10 min-w-[220px] max-w-[260px] flex-shrink-0">
      {product.image ? (
        <img
          src={product.image}
          alt={product.title}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/10"
        />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white/30 text-[10px]">
          No img
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-white/90 truncate leading-tight">
          {product.title}
        </p>
        <p className="text-[10px] text-white/40 truncate">{product.merchant}</p>
        <div className="flex flex-col gap-0.5 mt-1">
          {product.variants.slice(0, 2).map((v) => (
            <div key={v.id} className="flex items-center gap-1">
              <span className="text-[12px] font-bold text-emerald-300">{formatPrice(v.price)}</span>
              {product.variants.length > 1 && (
                <span className="text-[9px] text-white/30">{v.title}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main VoiceMode Component ──────────────────────────── */
export default function VoiceMode({
  wsRef,
  onClose,
  onReady,
  onDestroy,
}: {
  wsRef: React.RefObject<AgentWebSocket | null>;
  onClose: () => void;
  onReady: (handler: (text: string, products?: ProductData[]) => void) => void;
  onDestroy: () => void;
}) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [responseText, setResponseText] = useState("");
  const [displayTranscript, setDisplayTranscript] = useState("");
  const [products, setProducts] = useState<ProductData[]>([]);
  const voiceStateRef = useRef<VoiceState>("idle");

  // Keep ref in sync
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!text || !wsRef.current) return;
      setDisplayTranscript(text);
      setVoiceState("thinking");
      setResponseText("");
      wsRef.current.send(text);
    },
    [wsRef]
  );

  const voice = useVoice(handleFinalTranscript);

  // Handle incoming assistant messages for TTS playback
  // Stay in "thinking" state — will switch to "speaking" when voice.isSpeaking becomes true
  const handleAssistantMessage = useCallback(
    (text: string, msgProducts?: ProductData[]) => {
      setResponseText(text);
      setProducts(msgProducts || []);
      voice.speakWithAI(text);
    },
    [voice]
  );

  // Keep a ref to the latest handler
  const handlerRef = useRef(handleAssistantMessage);
  handlerRef.current = handleAssistantMessage;

  // Register handler with parent on mount, clean up on unmount
  useEffect(() => {
    onReady((text: string, prods?: ProductData[]) => handlerRef.current(text, prods));
    return () => onDestroy();
  }, [onReady, onDestroy]);

  // When voice stops speaking, auto-start listening again
  useEffect(() => {
    if (voiceState === "idle" && !voice.isSpeaking && !voice.isListening) {
      const timer = setTimeout(() => {
        if (voiceStateRef.current === "idle") {
          voice.startListening();
          setVoiceState("listening");
          setDisplayTranscript("");
        }
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceState, voice.isSpeaking, voice.isListening]);

  // Track listening state from voice hook
  useEffect(() => {
    if (voice.isListening && voiceState !== "listening") {
      setVoiceState("listening");
    }
  }, [voice.isListening, voiceState]);

  // Update transcript display during listening
  useEffect(() => {
    if (voice.isListening && voice.transcript) {
      setDisplayTranscript(voice.transcript);
    }
  }, [voice.isListening, voice.transcript]);

  // Track speaking state — enter "speaking" only when audio actually plays
  useEffect(() => {
    if (voice.isSpeaking && voiceState === "thinking") {
      setVoiceState("speaking");
    }
    if (!voice.isSpeaking && voiceState === "speaking") {
      setVoiceState("idle");
    }
  }, [voice.isSpeaking, voiceState]);

  const handleMicPress = useCallback(() => {
    if (voice.isListening) {
      voice.stopListening();
      setVoiceState("idle");
      setDisplayTranscript("");
    } else if (voiceState === "speaking") {
      voice.stopSpeaking();
      setVoiceState("idle");
    } else {
      voice.startListening();
      setVoiceState("listening");
      setDisplayTranscript("");
      setResponseText("");
      setProducts([]);
    }
  }, [voice, voiceState]);

  const handleClose = useCallback(() => {
    voice.stopListening();
    voice.stopSpeaking();
    onClose();
  }, [voice, onClose]);

  const orbClasses = {
    idle: "voice-orb-idle",
    listening: "voice-orb-listening",
    thinking: "voice-orb-thinking",
    speaking: "voice-orb-speaking",
  };

  const statusText = {
    idle: "Tap to speak",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 animate-voice-fade-in">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all z-10"
      >
        <CloseIcon />
      </button>

      {/* Branding */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <LogoMark className="h-8 w-8" />
        <span className="text-white/80 font-semibold text-sm">Leo Voice</span>
      </div>

      {/* Orb */}
      <div className="relative flex items-center justify-center mb-12">
        {/* Outer glow rings */}
        <div className={`absolute w-64 h-64 rounded-full ${orbClasses[voiceState]} voice-ring-outer`} />
        <div className={`absolute w-48 h-48 rounded-full ${orbClasses[voiceState]} voice-ring-middle`} />

        {/* Main orb */}
        <div
          className={`relative w-36 h-36 rounded-full voice-orb ${orbClasses[voiceState]} cursor-pointer`}
          onClick={handleMicPress}
        >
          {/* Inner gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 opacity-90" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white z-10">
            {voiceState === "listening" ? <StopIcon /> : <MicIcon />}
          </div>
        </div>
      </div>

      {/* Status */}
      <p className="text-white/60 text-sm font-medium mb-6 tracking-wide">
        {statusText[voiceState]}
      </p>

      {/* Transcript / Response */}
      <div className="w-full max-w-lg px-8 min-h-[80px] flex items-center justify-center">
        {voiceState === "listening" && displayTranscript && (
          <p className="text-white/90 text-lg text-center animate-voice-fade-in leading-relaxed">
            {displayTranscript}
          </p>
        )}
        {voiceState === "thinking" && displayTranscript && (
          <p className="text-white/50 text-base text-center italic leading-relaxed">
            &ldquo;{displayTranscript}&rdquo;
          </p>
        )}
        {(voiceState === "speaking" || (voiceState === "idle" && responseText)) && responseText && (
          <p className="text-white/80 text-base text-center leading-relaxed animate-voice-fade-in">
            {responseText}
          </p>
        )}
      </div>

      {/* Product cards — shown whenever Leo has returned products, persisting
          through thinking/speaking/idle and the auto-relisten, so the images
          stay visible regardless of TTS state. Cleared when a new query starts. */}
      {products.length > 0 && (
        <div className="w-full px-4 mt-4 animate-voice-fade-in">
          <div className="flex gap-3 overflow-x-auto pb-2 justify-center voice-products-scroll">
            {products.map((p) => (
              <VoiceProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-white/30 text-xs">
          {voiceState === "idle"
            ? "Tap the orb or press to speak"
            : voiceState === "listening"
            ? "Tap to cancel"
            : voiceState === "speaking"
            ? "Tap to interrupt"
            : "Processing your request..."}
        </p>
        <button
          onClick={handleClose}
          className="text-white/40 text-xs hover:text-white/60 transition mt-1"
        >
          End voice chat
        </button>
      </div>
    </div>
  );
}
