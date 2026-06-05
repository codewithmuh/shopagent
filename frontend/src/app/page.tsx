"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

/* ─── Animated Chat Simulation ────────────────────────── */
const CHAT_MESSAGES = [
  { role: "user" as const, text: "Find me wireless headphones under $200" },
  {
    role: "assistant" as const,
    text: "Found 3 options! Top pick: Noise Cancelling Pro at $149.99 — 30hr battery, Bluetooth 5.3. Want to buy it?",
  },
  { role: "user" as const, text: "Yes, buy it!" },
  {
    role: "assistant" as const,
    text: "Done! Order #4821 placed. $149.99 charged to your wallet. Delivery in 2-4 days.",
  },
];

function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [voiceState, setVoiceState] = useState<
    "idle" | "listening" | "thinking" | "speaking"
  >("idle");
  const chatRef = useRef<HTMLDivElement>(null);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  // Text mode: type out messages one by one
  useEffect(() => {
    if (mode !== "text") return;
    if (visibleMessages >= CHAT_MESSAGES.length) {
      const timeout = setTimeout(() => {
        setVisibleMessages(0);
        setTypingText("");
      }, 4000);
      return () => clearTimeout(timeout);
    }

    const msg = CHAT_MESSAGES[visibleMessages];
    setIsTyping(true);
    setTypingText("");

    let charIndex = 0;
    const typeInterval = setInterval(() => {
      if (charIndex < msg.text.length) {
        setTypingText(msg.text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setVisibleMessages((v) => v + 1);
          setTypingText("");
        }, 800);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [visibleMessages, mode]);

  // Voice mode: cycle through states
  useEffect(() => {
    if (mode !== "voice") return;
    setVoiceState("idle");

    const states: Array<"idle" | "listening" | "thinking" | "speaking"> = [
      "listening",
      "thinking",
      "speaking",
      "idle",
    ];
    let stateIndex = 0;

    const interval = setInterval(() => {
      setVoiceState(states[stateIndex % states.length]);
      stateIndex++;
    }, 2000);

    return () => clearInterval(interval);
  }, [mode]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleMessages, typingText]);

  const voiceLabel =
    voiceState === "listening"
      ? "Listening..."
      : voiceState === "thinking"
        ? "Processing..."
        : voiceState === "speaking"
          ? "Speaking..."
          : "Tap to speak";

  return (
    <div className="w-full max-w-md">
      {/* Mode toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-gray-100 rounded-full p-1 gap-1">
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
              mode === "text"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Text
            </span>
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${
              mode === "voice"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              Voice
            </span>
          </button>
        </div>
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
            L
          </div>
          <div>
            <p className="text-sm font-semibold">Leo</p>
            <p className="text-xs text-white/60">AI Shopping Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-white/60">Online</span>
          </div>
        </div>

        {mode === "text" ? (
          <div ref={chatRef} className="p-4 space-y-3 bg-gray-50 h-[220px] overflow-y-auto">
            {CHAT_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]"
                      : "bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-700 max-w-[85%] shadow-sm"
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Currently typing message */}
            {isTyping && typingText && (
              <div
                className={`flex ${CHAT_MESSAGES[visibleMessages]?.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    CHAT_MESSAGES[visibleMessages]?.role === "user"
                      ? "bg-emerald-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]"
                      : "bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-gray-700 max-w-[85%] shadow-sm"
                  }
                >
                  {typingText}
                  <span
                    className={`inline-block w-0.5 h-4 ml-0.5 -mb-0.5 ${showCursor ? "opacity-100" : "opacity-0"} ${
                      CHAT_MESSAGES[visibleMessages]?.role === "user"
                        ? "bg-white"
                        : "bg-gray-700"
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Typing indicator dots */}
            {isTyping && !typingText && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 dot-1" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dot-2" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dot-3" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Voice mode */
          <div className="p-8 bg-gray-50 h-[220px] flex flex-col items-center justify-center gap-4">
            <div
              className={`w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center transition-all duration-500 ${
                voiceState === "listening"
                  ? "scale-110 shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                  : voiceState === "thinking"
                    ? "scale-95 shadow-[0_0_30px_rgba(20,184,166,0.4)]"
                    : voiceState === "speaking"
                      ? "scale-105 shadow-[0_0_50px_rgba(16,185,129,0.6)]"
                      : "shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              }`}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>

            {/* Voice wave bars */}
            <div className="flex items-center gap-1 h-6">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                    voiceState === "listening" || voiceState === "speaking"
                      ? "animate-voice-bar"
                      : "h-1"
                  }`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height:
                      voiceState === "listening" ||
                      voiceState === "speaking"
                        ? undefined
                        : "4px",
                  }}
                />
              ))}
            </div>

            <p className="text-sm text-gray-500 font-medium">{voiceLabel}</p>
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-400">
            {mode === "text" ? "Ask Leo anything..." : "Tap mic to speak..."}
          </div>
          <button className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            {mode === "text" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const merchant = localStorage.getItem("merchant");
    const chatUser = localStorage.getItem("chat_user");
    if (merchant) {
      router.replace("/merchant/dashboard");
      return;
    }
    if (chatUser) {
      router.replace("/agent");
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Nav (matches docs page) ────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">ShopAgent</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/docs"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              Docs
            </Link>
            <Link
              href="/contact"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/codewithmuh/shopagent"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View ShopAgent source on GitHub"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.72-4.04-1.59-4.04-1.59-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 016 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>
              <span className="hidden lg:inline">GitHub</span>
            </a>
            <Link
              href="/portal/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/portal/login"
              className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
            >
              Get API Keys
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white pointer-events-none" />
        <div className="absolute -top-32 -right-20 w-[640px] h-[640px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-24 w-[420px] h-[420px] bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur border border-emerald-100 rounded-full text-sm text-emerald-700 font-medium mb-7 shadow-soft">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Shopping Agent Platform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.05]">
                Commerce through{" "}
                <span className="text-gradient">conversation</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Drop a chat-and-voice shopping agent into any app. Leo finds the
                products, answers the questions, and closes the sale — your users
                just talk.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/portal/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition text-lg shadow-lg shadow-gray-900/10"
                >
                  Get API keys
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                </Link>
                <a
                  href="https://github.com/codewithmuh/shopagent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition text-lg"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.72-4.04-1.59-4.04-1.59-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 016 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>
                  Star on GitHub
                </a>
              </div>
              <p className="mt-5 text-sm text-gray-400">
                Try the{" "}
                <Link href="/demo/login" className="text-gray-600 underline underline-offset-2 hover:text-gray-900">live demo</Link>
                {" "}·{" "}
                read the{" "}
                <Link href="/docs" className="text-gray-600 underline underline-offset-2 hover:text-gray-900">docs</Link>
              </p>
            </div>

            {/* Right: chat in a browser frame with floating accents */}
            <div className="relative">
              <div className="hidden lg:flex absolute -top-4 -left-6 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-soft border border-gray-100 text-xs font-medium text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Voice + text
              </div>
              <div className="hidden lg:flex absolute -bottom-4 -right-4 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-soft border border-gray-100 text-xs font-medium text-gray-700">
                <span className="text-emerald-600">◆</span> USDC checkout
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white shadow-soft-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                  <span className="w-3 h-3 rounded-full bg-red-300" />
                  <span className="w-3 h-3 rounded-full bg-yellow-300" />
                  <span className="w-3 h-3 rounded-full bg-green-300" />
                  <div className="flex-1 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-400">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      app.shopagent.dev/chat
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-b from-emerald-50/30 to-white flex justify-center">
                  <AnimatedChat />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              The flow
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              From message to doorstep
            </h2>
            <p className="mt-3 text-gray-500 text-lg">
              Three steps, all inside the conversation.
            </p>
          </div>

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            {/* connecting line (desktop) */}
            <div className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200" />

            <li className="relative text-center md:px-4">
              <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-white border border-emerald-100 shadow-soft flex items-center justify-center font-bold text-emerald-600 text-lg">
                01
              </div>
              <h3 className="text-xl font-semibold mt-5">Discover</h3>
              <p className="text-gray-500 leading-relaxed mt-2">
                Your shopper asks Leo for anything — by text or voice. It searches
                every connected store and surfaces the best matches as cards.
              </p>
            </li>

            <li className="relative text-center md:px-4">
              <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-white border border-emerald-100 shadow-soft flex items-center justify-center font-bold text-emerald-600 text-lg">
                02
              </div>
              <h3 className="text-xl font-semibold mt-5">Pay</h3>
              <p className="text-gray-500 leading-relaxed mt-2">
                They confirm and pay right in the chat with crypto — wallet
                connected once, USDC settled instantly. No forms, no card entry.
              </p>
            </li>

            <li className="relative text-center md:px-4">
              <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-white border border-emerald-100 shadow-soft flex items-center justify-center font-bold text-emerald-600 text-lg">
                03
              </div>
              <h3 className="text-xl font-semibold mt-5">Fulfill</h3>
              <p className="text-gray-500 leading-relaxed mt-2">
                Stock is reserved in Shopify the instant they buy, the order is
                created, and the merchant is notified to ship. No overselling.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-app-gradient">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Who it&apos;s for</h2>
            <p className="mt-3 text-gray-500 text-lg">
              One platform, three kinds of users
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Shoppers */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-soft card-lift">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5 text-2xl">🛍️</div>
              <h3 className="text-xl font-semibold mb-2">Shoppers</h3>
              <p className="text-gray-500 leading-relaxed">
                Chat with Leo by text or voice to discover products, get
                recommendations, and place &amp; track orders — no forms, just
                conversation.
              </p>
              <Link
                href="/demo/login"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Try the demo →
              </Link>
            </div>

            {/* Merchants */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-soft card-lift">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5 text-2xl">🏪</div>
              <h3 className="text-xl font-semibold mb-2">Merchants</h3>
              <p className="text-gray-500 leading-relaxed">
                Connect your Shopify store in seconds. Products, prices, images,
                and live inventory sync in automatically and become shoppable in
                chat.
              </p>
              <Link
                href="/merchant/login"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Merchant portal →
              </Link>
            </div>

            {/* Companies */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-soft card-lift">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-5 text-2xl">🏢</div>
              <h3 className="text-xl font-semibold mb-2">Companies</h3>
              <p className="text-gray-500 leading-relaxed">
                Embed the agent in your own app with a client ID &amp; secret over
                a simple WebSocket API, and settle payments with webhooks.
              </p>
              <Link
                href="/portal/login"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Get API keys →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="relative max-w-4xl mx-auto overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-12 text-center text-white shadow-soft-lg">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold">
              Put Leo in your app this week
            </h2>
            <p className="mt-4 text-emerald-50/90 text-lg max-w-xl mx-auto">
              Spin up the full stack with one command, grab your API keys, and
              connect over a WebSocket — it&apos;s all yours to run locally.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/portal/login"
                className="px-7 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition text-lg"
              >
                Get API keys
              </Link>
              <Link
                href="/docs"
                className="px-7 py-3.5 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition text-lg"
              >
                View documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer (matches docs page) ─────────────────────── */}
      <footer className="border-t bg-gray-50 px-6 py-12 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoMark className="h-7 w-7" />
                <span className="font-bold text-gray-900">ShopAgent</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI shopping agent platform. Add voice-powered commerce to any
                app with a simple API.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Built by{" "}
                <a
                  href="https://codewithmuh.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  CodeWithMuh
                </a>
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>
                  <Link href="/portal/login" className="hover:text-gray-900 transition">
                    Get API Keys
                  </Link>
                </li>
                <li>
                  <Link href="/portal/dashboard" className="hover:text-gray-900 transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/merchant/login" className="hover:text-gray-900 transition">
                    Merchant Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>
                  <Link href="/terms" className="hover:text-gray-900 transition">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-gray-900 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-gray-900 transition">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Connect</h4>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>
                  <a href="https://github.com/codewithmuh/shopagent" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com/@codewithmuh" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">
                    YouTube
                  </a>
                </li>
                <li>
                  <a href="https://codewithmuh.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">
                    Website
                  </a>
                </li>
                <li>
                  <a href="https://www.linkedin.com/in/muhammad-rashid-daha/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition">
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@codewithmuh.com" className="hover:text-gray-900 transition">
                    contact@codewithmuh.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-400">
              &copy; 2026 ShopAgent · Built by{" "}
              <a href="https://codewithmuh.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                CodeWithMuh
              </a>
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-gray-700 transition">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-700 transition">Privacy</Link>
              <Link href="/contact" className="hover:text-gray-700 transition">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
