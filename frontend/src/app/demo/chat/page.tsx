"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AgentWebSocket, type WSMessage } from "@/lib/websocket";
import { useVoice } from "@/lib/useVoice";
import VoiceMode from "@/components/chat/VoiceMode";

// ─── Types ────────────────────────────────────────────────────────
type ProductData = {
  id: string;
  title: string;
  image: string | null;
  merchant: string;
  variants: { id: string; title: string; price: string; currency?: string; available: number }[];
};

type Message = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  products?: ProductData[];
  timestamp: Date;
  isHistory?: boolean;
};

type DemoUser = {
  email: string;
  display_name: string;
};

let msgId = 0;

// ─── Config ───────────────────────────────────────────────────────
const DEMO_CLIENT_ID =
  process.env.NEXT_PUBLIC_DEMO_CLIENT_ID || "shopagent_test_demo";
const DEMO_SECRET_KEY =
  process.env.NEXT_PUBLIC_DEMO_SECRET_KEY || "sk_test_demo_secret_key_for_local_development_only";

// ─── Icons ────────────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12h14M12 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StopCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const VoiceChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

const VoiceToggleIcon = ({ on }: { on: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {on ? (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
      </>
    ) : (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </>
    )}
  </svg>
);

// ─── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-1" />
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-2" />
      <div className="w-[7px] h-[7px] rounded-full bg-emerald-400/80 dot-3" />
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────
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

// ─── Message Content ─────────────────────────────────────────────
function MessageContent({ content, products, likedProducts, onLike }: { content: string; products?: ProductData[]; likedProducts?: Set<string>; onLike?: (id: string) => void }) {
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

// ─── Message Bubble ───────────────────────────────────────────────
function MessageBubble({ msg, likedProducts, onLike }: { msg: Message; likedProducts?: Set<string>; onLike?: (id: string) => void }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  const time = msg.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div
        className={`flex justify-end gap-2 ${
          msg.isHistory ? "" : "animate-slide-in-right"
        }`}
      >
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
    <div
      className={`flex gap-2.5 ${msg.isHistory ? "" : "animate-fade-in-up"}`}
    >
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
        F
      </div>
      <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
        <div
          className={`px-4 py-2.5 rounded-2xl rounded-tl-md text-[14px] leading-relaxed ${
            isSystem
              ? "bg-red-50 text-red-700 border border-red-100 whitespace-pre-wrap"
              : "bg-white text-gray-800 shadow-sm border border-gray-100"
          }`}
        >
          {isSystem ? msg.content : <MessageContent content={msg.content} products={msg.products} likedProducts={likedProducts} onLike={onLike} />}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 ml-1">{time}</span>
      </div>
    </div>
  );
}

// ─── Heart Icon ──────────────────────────────────────────────────
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

// ─── Login Toast ─────────────────────────────────────────────────
function LoginToast({ show, onClose }: { show: boolean; onClose: () => void }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
      <div className="bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
        <HeartIcon />
        <span>Sign in to save favorites</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white ml-1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M4 12l8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────
export default function DemoChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [voiceMode, setVoiceMode] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("demo_voice_mode") === "true"
      : false
  );
  const wsRef = useRef<AgentWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onAssistantMessageRef = useRef<((text: string, products?: ProductData[]) => void) | null>(null);
  const voiceModeRef = useRef(voiceMode);
  const voiceRef = useRef<ReturnType<typeof useVoice> | null>(null);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    localStorage.setItem("demo_voice_mode", String(voiceMode));
  }, [voiceMode]);

  const addMessage = useCallback(
    (role: Message["role"], content: string, products?: ProductData[], isHistory = false) => {
      setMessages((prev) => [
        ...prev,
        { id: ++msgId, role, content, products, timestamp: new Date(), isHistory },
      ]);
    },
    []
  );

  // Voice input: send transcript as a message
  const sendVoiceText = useCallback((text: string) => {
    if (!text || !wsRef.current) return;
    addMessage("user", text);
    wsRef.current.send(text);
  }, [addMessage]);

  const voice = useVoice(sendVoiceText);
  voiceRef.current = voice;

  // Connect WebSocket on mount
  useEffect(() => {
    const raw = localStorage.getItem("demo_user");
    if (!raw) return;

    let user: DemoUser;
    try {
      user = JSON.parse(raw);
    } catch {
      return;
    }

    const ws = new AgentWebSocket((msg: WSMessage) => {
      switch (msg.type) {
        case "message":
          if (msg.role === "assistant") {
            const msgProducts = msg.products as ProductData[] | undefined;
            addMessage("assistant", msg.content, msgProducts);
            // Voice mode: speak the response or pass to VoiceMode component
            if (onAssistantMessageRef.current) {
              onAssistantMessageRef.current(msg.content, msgProducts);
            } else if (voiceModeRef.current) {
              voiceRef.current?.speak(msg.content);
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
          break;
      }
    });

    ws.connectWithApiKeys({
      clientId: DEMO_CLIENT_ID,
      secretKey: DEMO_SECRET_KEY,
      userId: user.email,
      displayName: user.display_name,
    });

    wsRef.current = ws;

    return () => ws.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: historyLoaded ? "auto" : "smooth",
    });
    if (historyLoaded) setHistoryLoaded(false);
  }, [messages, isTyping, historyLoaded]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !connected) return;
    if (voice.isListening) voice.stopListening();
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
    setMessages([]);
    wsRef.current?.disconnect();

    const raw = localStorage.getItem("demo_user");
    if (!raw) return;

    let user: DemoUser;
    try {
      user = JSON.parse(raw);
    } catch {
      return;
    }

    const ws = new AgentWebSocket((msg: WSMessage) => {
      switch (msg.type) {
        case "message":
          if (msg.role === "assistant") {
            const msgProducts = msg.products as ProductData[] | undefined;
            addMessage("assistant", msg.content, msgProducts);
            if (onAssistantMessageRef.current) {
              onAssistantMessageRef.current(msg.content, msgProducts);
            } else if (voiceModeRef.current) {
              voiceRef.current?.speak(msg.content);
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
          break;
      }
    });

    ws.connectWithApiKeys({
      clientId: DEMO_CLIENT_ID,
      secretKey: DEMO_SECRET_KEY,
      userId: user.email,
      displayName: user.display_name,
    });

    wsRef.current = ws;
  }

  function handleLike(productId: string) {
    const user = localStorage.getItem("demo_user");
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

  // ─── Empty State ────────────────────────────────────────────
  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-emerald-500/25">
          F
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-[3px] border-gray-50 animate-pulse-glow" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">
        Welcome to Acme Shopping
      </h3>
      <p className="text-sm text-gray-500 mt-2 max-w-xs leading-relaxed">
        I&apos;m Leo, your AI shopping assistant. Tell me what you&apos;re
        looking for and I&apos;ll find the best products for you.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {quickActions.map((action) => (
          <button
            key={action.text}
            onClick={() => {
              if (!connected) return;
              addMessage("user", action.text);
              wsRef.current?.send(action.text);
            }}
            disabled={!connected}
            className="group flex items-start gap-2.5 text-left text-[13px] px-3.5 py-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              {action.icon}
            </span>
            <span className="leading-snug pt-0.5">{action.text}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        {connected ? "Or type anything to get started" : "Connecting to Leo..."}
      </p>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <LoginToast show={showLoginToast} onClose={() => setShowLoginToast(false)} />

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
                <span className="text-[11px] text-gray-400 font-medium">
                  Previous conversation
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} likedProducts={likedProducts} onLike={handleLike} />
            ))}
          </>
        )}
        {isTyping && (
          <div className="flex gap-2.5 animate-fade-in-up">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
              F
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice listening indicator */}
      {voice.isListening && (
        <div className="flex-shrink-0 px-4">
          <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-emerald-700 flex-1">
              {voice.transcript || "Listening..."}
            </span>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 pb-6 pt-3 px-4">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto">
          <div
            className={`flex items-end gap-2 rounded-2xl border px-3 py-2 transition-all bg-white shadow-lg shadow-gray-200/50 bg-gray-50 border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-500/10`}
          >
            {/* Voice mode toggle */}
            {voice.isTTSSupported && (
              <button
                type="button"
                onClick={() => setVoiceMode((v) => !v)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 transition-all ${
                  voiceMode
                    ? "bg-emerald-100 text-emerald-600"
                    : "text-gray-400 hover:text-gray-600"
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
                connected
                  ? voice.isListening
                    ? "Listening..."
                    : "Message Leo..."
                  : "Connecting..."
              }
              disabled={!connected || voice.isListening}
              rows={1}
              className="flex-1 bg-transparent border-0 text-sm resize-none focus:outline-none placeholder:text-gray-400 disabled:opacity-40 min-h-[24px] max-h-[120px] py-1 leading-normal"
            />

            {/* Mic / Send / Voice chat buttons */}
            {voice.isListening ? (
              <button
                type="button"
                onClick={voice.stopListening}
                className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all flex-shrink-0 mb-0.5"
                title="Stop listening"
              >
                <StopCircleIcon />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                {/* Full-screen voice chat button */}
                {voice.isSTTSupported && (
                  <button
                    type="button"
                    onClick={() => setShowVoiceMode(true)}
                    disabled={!connected}
                    className="w-8 h-8 rounded-xl text-gray-400 flex items-center justify-center hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 transition-all flex-shrink-0 mb-0.5"
                    title="Voice chat"
                  >
                    <VoiceChatIcon />
                  </button>
                )}
                {/* Send button */}
                <button
                  type="submit"
                  disabled={!input.trim() || !connected}
                  className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all flex-shrink-0 mb-0.5"
                >
                  <SendIcon />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-400">
              {voice.isListening
                ? "Speak now — tap stop when done"
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
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Leo can make mistakes. Check important info.
          </p>
        </form>
      </div>

      {/* Full-screen voice mode */}
      {showVoiceMode && (
        <VoiceMode
          wsRef={wsRef}
          onClose={() => setShowVoiceMode(false)}
          onReady={(handler) => { onAssistantMessageRef.current = handler; }}
          onDestroy={() => { onAssistantMessageRef.current = null; }}
        />
      )}
    </div>
  );
}
