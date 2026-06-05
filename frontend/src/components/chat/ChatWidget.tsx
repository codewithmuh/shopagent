"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AgentWebSocket, type WSMessage } from "@/lib/websocket";
import { useVoice } from "@/lib/useVoice";
import { LogoMark } from "@/components/Logo";

type Message = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  products?: ProductData[];
  timestamp: Date;
  isHistory?: boolean;
};

type UserInfo = {
  user_id: string;
  display_name: string;
  email?: string;
} | null;

let msgId = 0;

/* ─── Icons ──────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const StopIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SpeakerIcon = ({ active }: { active?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "animate-pulse" : ""}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 010 7.07" />
    <path d="M19.07 4.93a10 10 0 010 14.14" />
  </svg>
);

const VoiceToggleIcon = ({ on }: { on: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    {on ? (
      <>
        <path d="M15.54 8.46a5 5 0 010 7.07" />
        <path d="M19.07 4.93a10 10 0 010 14.14" />
      </>
    ) : (
      <line x1="23" y1="9" x2="17" y2="15" />
    )}
  </svg>
);

/* ─── Typing Indicator ───────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-1" />
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-2" />
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-3" />
    </div>
  );
}

/* ─── Heart Icon ────────────────────────────────────────── */
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

/* ─── Product Card ──────────────────────────────────────── */
type ProductData = {
  id: string;
  title: string;
  image: string | null;
  merchant: string;
  variants: { id: string; title: string; price: string; currency?: string; available: number }[];
};

function ProductCard({ product, liked, onLike }: { product: ProductData; liked?: boolean; onLike?: (id: string) => void }) {
  const currency = product.variants[0]?.currency ?? "USD";
  const SYMBOLS: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  const prefix = SYMBOLS[currency] ?? `${currency} `;

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return `${prefix}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex gap-3 bg-gray-50 rounded-xl p-2.5 border border-gray-100 hover:border-emerald-200 transition-all cursor-default">
      {product.image ? (
        <img
          src={product.image}
          alt={product.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-200"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 text-[10px]">
          No img
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
            {product.title}
          </p>
          {onLike && (
            <button
              onClick={() => onLike(product.id)}
              className={`flex-shrink-0 p-1 rounded-lg transition-all ${
                liked
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-300 hover:text-red-400"
              }`}
              title={liked ? "Remove from favorites" : "Add to favorites"}
            >
              <HeartIcon filled={liked} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-500 truncate">{product.merchant}</p>
        <div className="flex flex-col gap-0.5 mt-1">
          {product.variants.map((v) => (
            <div key={v.id} className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-emerald-600">{formatPrice(v.price)}</span>
              {product.variants.length > 1 && (
                <span className="text-[10px] text-gray-400">{v.title}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Message Content ──────────────────────────────────── */
function MessageContent({ content, products, likedProducts, onLike }: { content: string; products?: ProductData[]; likedProducts?: Set<string>; onLike?: (id: string) => void }) {
  // Render text with basic markdown (bold)
  const textHtml = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <>
      <span dangerouslySetInnerHTML={{ __html: textHtml }} />
      {products && products.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} liked={likedProducts?.has(p.id)} onLike={onLike} />
          ))}
        </div>
      )}
    </>
  );
}

/* ─── Message Bubble ─────────────────────────────────────── */
function MessageBubble({
  msg,
  onSpeak,
  isSpeakingThis,
  likedProducts,
  onLike,
}: {
  msg: Message;
  onSpeak?: (text: string, id: number) => void;
  isSpeakingThis?: boolean;
  likedProducts?: Set<string>;
  onLike?: (id: string) => void;
}) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const isAssistant = msg.role === "assistant";

  const time = msg.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className={`flex justify-end gap-2 ${msg.isHistory ? "" : "animate-slide-in-right"}`}>
        <div className="flex flex-col items-end max-w-[80%] sm:max-w-[70%]">
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm shadow-emerald-600/10">
            {msg.content}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 mr-1">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${msg.isHistory ? "" : "animate-fade-in-up"}`}>
      <LogoMark className="h-7 w-7 flex-shrink-0 mt-0.5" />
      <div className="flex flex-col max-w-[85%] sm:max-w-[80%]">
        <div
          className={`px-4 py-2.5 rounded-2xl rounded-tl-md text-[14px] leading-relaxed ${
            isSystem
              ? "bg-red-50 text-red-700 border border-red-100 whitespace-pre-wrap"
              : "bg-white text-gray-800 shadow-sm border border-gray-100"
          }`}
        >
          {isSystem ? msg.content : <MessageContent content={msg.content} products={msg.products} likedProducts={likedProducts} onLike={onLike} />}
        </div>
        <div className="flex items-center gap-2 mt-1 ml-1">
          <span className="text-[10px] text-gray-400">{time}</span>
          {isAssistant && onSpeak && (
            <button
              onClick={() => onSpeak(msg.content, msg.id)}
              className={`p-0.5 rounded transition ${
                isSpeakingThis
                  ? "text-emerald-600"
                  : "text-gray-300 hover:text-gray-500"
              }`}
              title={isSpeakingThis ? "Stop speaking" : "Play aloud"}
            >
              <SpeakerIcon active={isSpeakingThis} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Voice Chat Button Icon (waveform style like ChatGPT) ── */
const WaveformIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="8" x2="4" y2="16" />
    <line x1="8" y1="5" x2="8" y2="19" />
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="16" y1="5" x2="16" y2="19" />
    <line x1="20" y1="8" x2="20" y2="16" />
  </svg>
);

/* ─── Main Chat Widget ───────────────────────────────────── */
export default function ChatWidget({
  fullPage = false,
  onUserChange,
  onWsReady,
  onAssistantMessage,
  onVoiceModeOpen,
}: {
  fullPage?: boolean;
  onUserChange?: (user: UserInfo) => void;
  onWsReady?: (ws: AgentWebSocket) => void;
  onAssistantMessage?: (text: string) => void;
  onVoiceModeOpen?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(fullPage);
  const [connected, setConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [voiceMode, setVoiceMode] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("voice_mode") === "true"
      : false
  );
  const wsRef = useRef<AgentWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voiceModeRef = useRef(voiceMode);
  const onAssistantMessageRef = useRef(onAssistantMessage);
  onAssistantMessageRef.current = onAssistantMessage;

  // Keep ref in sync so the WS callback always sees latest value
  useEffect(() => {
    voiceModeRef.current = voiceMode;
    localStorage.setItem("voice_mode", String(voiceMode));
  }, [voiceMode]);

  const sendVoiceText = useCallback((text: string) => {
    if (!text || !wsRef.current) return;
    setMessages((prev) => [
      ...prev,
      { id: ++msgId, role: "user", content: text, timestamp: new Date() },
    ]);
    wsRef.current.send(text);
    setInput("");
  }, []);

  const voice = useVoice(sendVoiceText);

  function handleSpeakMessage(text: string, id: number) {
    if (voice.isSpeaking && voice.speakingMsgId === id) {
      voice.stopSpeaking();
    } else {
      voice.speak(text, id);
    }
  }

  const addMessage = useCallback(
    (role: Message["role"], content: string, products?: ProductData[]) => {
      setMessages((prev) => [
        ...prev,
        { id: ++msgId, role, content, products, timestamp: new Date() },
      ]);
    },
    []
  );

  useEffect(() => {
    const ws = new AgentWebSocket((msg: WSMessage) => {
      switch (msg.type) {
        case "message":
          if (msg.role === "assistant") {
            addMessage("assistant", msg.content, msg.products as ProductData[] | undefined);
            // Notify parent for voice mode TTS
            onAssistantMessageRef.current?.(msg.content);
            if (voiceModeRef.current && !onAssistantMessageRef.current) {
              voice.speak(msg.content);
            }
          }
          break;
        case "history":
          // Restore previous messages
          if (msg.messages && msg.messages.length > 0) {
            const restored: Message[] = msg.messages.map((m) => ({
              id: ++msgId,
              role: m.role as Message["role"],
              content: m.content,
              products: m.products as ProductData[] | undefined,
              timestamp: new Date(),
              isHistory: true,
            }));
            setMessages(restored);
            setHistoryLoaded(true);
          }
          break;
        case "typing":
          setIsTyping(msg.status);
          break;
        case "error":
          addMessage("system", msg.message);
          break;
        case "session":
          setConnected(true);
          // If the session has a bound user, notify parent
          if (msg.user && onUserChange) {
            onUserChange(msg.user);
            // Also save to localStorage
            localStorage.setItem("chat_user", JSON.stringify(msg.user));
          }
          break;
      }
    });

    const savedSession =
      typeof window !== "undefined"
        ? localStorage.getItem("agent_session")
        : null;
    ws.connect(savedSession || undefined);
    wsRef.current = ws;
    onWsReady?.(ws);

    return () => ws.disconnect();
  }, [addMessage, onUserChange, onWsReady]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: historyLoaded ? "auto" : "smooth" });
    if (historyLoaded) setHistoryLoaded(false);
  }, [messages, isTyping, historyLoaded]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (voice.isListening) voice.stopListening();
    const text = input.trim();
    if (!text || !connected) return;
    addMessage("user", text);
    wsRef.current?.send(text);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleNewChat() {
    // Clear session and start fresh
    localStorage.removeItem("agent_session");
    setMessages([]);
    wsRef.current?.disconnect();

    const ws = new AgentWebSocket((msg: WSMessage) => {
      switch (msg.type) {
        case "message":
          if (msg.role === "assistant") {
            addMessage("assistant", msg.content, msg.products as ProductData[] | undefined);
            onAssistantMessageRef.current?.(msg.content);
            if (voiceModeRef.current && !onAssistantMessageRef.current) {
              voice.speak(msg.content);
            }
          }
          break;
        case "history":
          if (msg.messages && msg.messages.length > 0) {
            const restored: Message[] = msg.messages.map((m) => ({
              id: ++msgId,
              role: m.role as Message["role"],
              content: m.content,
              products: m.products as ProductData[] | undefined,
              timestamp: new Date(),
              isHistory: true,
            }));
            setMessages(restored);
          }
          break;
        case "typing":
          setIsTyping(msg.status);
          break;
        case "error":
          addMessage("system", msg.message);
          break;
        case "session":
          setConnected(true);
          if (msg.user && onUserChange) {
            onUserChange(msg.user);
          }
          break;
      }
    });
    ws.connect();
    wsRef.current = ws;
    onWsReady?.(ws);
  }

  function handleLike(productId: string) {
    const user = typeof window !== "undefined" ? localStorage.getItem("chat_user") : null;
    if (!user) {
      setShowLoginToast(true);
      return;
    }
    setLikedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  const quickActions = [
    { text: "Show me trending products", icon: "~" },
    { text: "I need wireless headphones", icon: "H" },
    { text: "What's under $50?", icon: "$" },
    { text: "Help me find a gift", icon: "G" },
  ];

  /* ─── Empty state ──────────────────────────────────────── */
  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
      <div className="relative mb-6">
        <LogoMark className="h-20 w-20 rounded-2xl shadow-lg shadow-emerald-500/25" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-[3px] border-gray-50 animate-pulse-glow" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">
        Hey there! I&apos;m Leo
      </h3>
      <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
        Your AI shopping assistant. Tell me what you&apos;re looking for and
        I&apos;ll find the best products for you.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {quickActions.map((action) => (
          <button
            key={action.text}
            onClick={() => {
              addMessage("user", action.text);
              wsRef.current?.send(action.text);
            }}
            className="group flex items-start gap-2.5 text-left text-[13px] px-3.5 py-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-gray-900"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              {action.icon}
            </span>
            <span className="leading-snug pt-0.5">{action.text}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Or type anything to get started
      </p>
    </div>
  );

  /* ─── Login toast ──────────────────────────────────────── */
  useEffect(() => {
    if (showLoginToast) {
      const t = setTimeout(() => setShowLoginToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showLoginToast]);

  /* ─── Chat content ─────────────────────────────────────── */
  const chatContent = (
    <div
      className={`flex flex-col bg-gray-50 relative ${
        fullPage
          ? "h-full"
          : "h-[540px] w-[400px] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      }`}
    >
      {/* Login toast */}
      {showLoginToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className="bg-gray-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap">
            <HeartIcon />
            <span>Sign in to save favorites</span>
          </div>
        </div>
      )}

      {/* Header - only show in widget mode */}
      {!fullPage && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="font-semibold text-sm text-gray-900">Leo</p>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-yellow-500"}`}
                />
                <p className="text-[11px] text-gray-500">
                  {connected ? "Online" : "Connecting..."}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition text-gray-400 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M4 12l8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 chat-scroll">
        {messages.length === 0 ? (
          emptyState
        ) : (
          <>
            {/* Restored conversation label */}
            {messages[0]?.isHistory && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium">Previous conversation</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onSpeak={voice.isTTSSupported ? handleSpeakMessage : undefined}
                isSpeakingThis={voice.isSpeaking && voice.speakingMsgId === msg.id}
                likedProducts={likedProducts}
                onLike={handleLike}
              />
            ))}
          </>
        )}
        {isTyping && (
          <div className="flex gap-2.5 animate-fade-in-up">
            <LogoMark className="h-7 w-7 flex-shrink-0 mt-0.5" />
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`flex-shrink-0 ${fullPage ? "pb-6 pt-3 px-4" : "bg-white border-t border-gray-200"}`}>
        {/* Listening indicator */}
        {voice.isListening && (
          <div className={`flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 ${fullPage ? "max-w-2xl mx-auto rounded-t-xl" : ""}`}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-600">
              Listening...
            </span>
            {voice.transcript && (
              <span className="text-xs text-red-400 truncate flex-1">
                {voice.transcript}
              </span>
            )}
          </div>
        )}
        <form onSubmit={handleSend} className={fullPage ? "max-w-2xl mx-auto" : "p-3 sm:p-4"}>
          <div className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all ${fullPage ? "bg-white shadow-lg shadow-gray-200/50 " : ""}${
            voice.isListening
              ? "bg-red-50 border-red-200 ring-2 ring-red-500/20"
              : "bg-gray-50 border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-500/10"
          }`}>
            {/* Voice mode toggle */}
            {voice.isTTSSupported && (
              <button
                type="button"
                onClick={() => setVoiceMode((v) => !v)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 mb-0.5 ${
                  voiceMode
                    ? "bg-emerald-100 text-emerald-600"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
                title={voiceMode ? "Voice replies on" : "Voice replies off"}
              >
                <VoiceToggleIcon on={voiceMode} />
              </button>
            )}
            <textarea
              ref={inputRef}
              value={voice.isListening ? voice.transcript : input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder={
                voice.isListening
                  ? "Speak now..."
                  : connected
                  ? "Message Leo..."
                  : "Connecting..."
              }
              disabled={!connected || voice.isListening}
              rows={1}
              className="flex-1 bg-transparent border-0 text-sm resize-none focus:outline-none placeholder:text-gray-400 disabled:opacity-40 min-h-[24px] max-h-[120px] py-1 leading-normal"
            />
            {/* Voice mode + Mic/Send buttons */}
            {voice.isListening ? (
              <button
                type="button"
                onClick={voice.stopListening}
                className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all flex-shrink-0 mb-0.5"
                title="Stop listening"
              >
                <StopIcon />
              </button>
            ) : input.trim() ? (
              <button
                type="submit"
                disabled={!connected}
                className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex-shrink-0 mb-0.5"
              >
                <SendIcon />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 mb-0.5">
                {voice.isSTTSupported && fullPage && onVoiceModeOpen && (
                  <button
                    type="button"
                    onClick={onVoiceModeOpen}
                    disabled={!connected}
                    className="w-8 h-8 rounded-xl text-emerald-500 hover:text-white hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-600 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
                    title="Voice chat"
                  >
                    <WaveformIcon />
                  </button>
                )}
                {voice.isSTTSupported ? (
                  <button
                    type="button"
                    onClick={voice.startListening}
                    disabled={!connected}
                    className="w-8 h-8 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 flex items-center justify-center transition-all flex-shrink-0"
                    title="Voice input"
                  >
                    <MicIcon />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || !connected}
                    className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex-shrink-0"
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-400">
              {voice.isListening
                ? "Speak clearly, message sends automatically"
                : "Enter to send, Shift+Enter for new line"}
            </p>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleNewChat}
                className="text-[10px] text-gray-400 hover:text-emerald-600 transition"
              >
                New chat
              </button>
            )}
          </div>
          {fullPage && (
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Leo can make mistakes. Check important info.
            </p>
          )}
        </form>
      </div>
    </div>
  );

  /* ─── Full page mode ───────────────────────────────────── */
  if (fullPage) return chatContent;

  /* ─── Floating widget mode ─────────────────────────────── */
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-br from-emerald-600 to-teal-600 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center z-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          {chatContent}
        </div>
      )}
    </>
  );
}
