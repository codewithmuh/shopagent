"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
            F
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
              F
            </div>
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
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-white pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: text content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-sm text-emerald-700 font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Shopping Agent Platform
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Commerce through{" "}
                <span className="text-gradient">conversation</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-500 max-w-xl leading-relaxed">
                Add an AI shopping assistant to your app. ShopAgent handles product
                search, recommendations, and checkout — via text or voice.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/portal/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition text-lg shadow-lg shadow-gray-900/10"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Get API Keys
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition text-lg"
                >
                  Read the Docs
                </Link>
              </div>
            </div>

            {/* Right: animated chat widget */}
            <div className="flex-shrink-0 w-full max-w-md">
              <AnimatedChat />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="mt-3 text-gray-500 text-lg">
              Three steps from search to delivery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-emerald-200 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat with Leo</h3>
              <p className="text-gray-500 leading-relaxed">
                Tell Leo what you&apos;re looking for — via text or voice. It
                searches across all merchants and shows the best matches.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-green-200 transition">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 1V23M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pay with Crypto</h3>
              <p className="text-gray-500 leading-relaxed">
                Connect your wallet once. USDC payments are instant — no forms,
                no credit cards.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-teal-200 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21"
                    stroke="#0d9488"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Inventory</h3>
              <p className="text-gray-500 leading-relaxed">
                Products sync from Shopify. Stock is locked the moment you buy —
                no overselling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to add AI shopping?
          </h2>
          <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
            Get your API keys and integrate ShopAgent into your app in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/portal/login"
              className="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition text-lg"
            >
              Get API Keys
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3.5 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:border-gray-500 hover:text-white transition text-lg"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer (matches docs page) ─────────────────────── */}
      <footer className="border-t bg-gray-50 px-6 py-12 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  F
                </div>
                <span className="font-bold text-gray-900">ShopAgent</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI shopping agent platform. Add voice-powered commerce to any
                app with a simple API.
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
                  <Link href="/contact" className="hover:text-gray-900 transition">
                    Support
                  </Link>
                </li>
                <li>
                  <span className="text-gray-400">X (Twitter)</span>
                </li>
                <li>
                  <span className="text-gray-400">Discord</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-400">
              &copy; 2026 ShopAgent. All rights reserved.
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
