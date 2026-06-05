"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { LogoMark } from "@/components/Logo";

/* ─── Helper Components ────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      aria-label="Copy code"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-700/60 hover:text-gray-100"
    >
      {ok ? "Copied ✓" : "Copy"}
    </button>
  );
}

// Terminal-style code block (dark) — distinct from a plain light snippet card.
function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="rounded bg-gray-800 px-2 py-0.5 text-xs font-medium text-emerald-300">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-sm leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const METHOD_TONES: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-sky-100 text-sky-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: string;
  path: string;
  description: string;
  children?: React.ReactNode;
}) {
  const tone = METHOD_TONES[method] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold tracking-wide ${tone}`}>
            {method}
          </span>
          <code className="font-mono text-base text-gray-900">{path}</code>
        </div>
        <p className="mt-2 text-base text-gray-500">{description}</p>
      </div>
      {children && <div className="bg-gray-50/60 px-5 py-4 text-base">{children}</div>}
    </div>
  );
}

/* ─── Sidebar Links ────────────────────────────────────── */
const SIDEBAR_LINKS = [
  { href: "#system-flow", label: "System Flow" },
  { href: "#quick-start", label: "Quick Start" },
  { href: "#authentication", label: "Authentication" },
  { href: "#websocket", label: "WebSocket Chat" },
  { href: "#rest-endpoints", label: "REST Endpoints" },
  { href: "#webhooks", label: "Webhooks" },
  { href: "#errors", label: "Errors & Status" },
  { href: "#examples-js", label: "JavaScript Examples" },
  { href: "#examples-python", label: "Python Examples" },
];

/* ─── Flow Diagram ────────────────────────────────────── */

function FlowNode({
  icon,
  label,
  sub,
  gradient,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  gradient: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-900 mt-2 text-center leading-tight">
        {label}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 text-center leading-tight">
        {sub}
      </p>
    </div>
  );
}

function Arrow({ direction = "right", label }: { direction?: "right" | "down"; label?: string }) {
  if (direction === "down") {
    return (
      <div className="flex flex-col items-center my-2">
        <div className="w-[2px] h-6 bg-gray-300" />
        <svg width="10" height="8" viewBox="0 0 10 8" className="text-gray-300 -mt-[1px]">
          <path d="M0 0 L5 8 L10 0 Z" fill="currentColor" />
        </svg>
        {label && <span className="text-[9px] text-gray-400 mt-0.5">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center mx-2 mt-4">
      <div className="flex items-center">
        <div className="h-[2px] w-8 bg-gray-300" />
        <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-300 -ml-[1px]">
          <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
        </svg>
      </div>
      {label && <span className="text-[9px] text-gray-400 mt-1 whitespace-nowrap">{label}</span>}
    </div>
  );
}

/* SVG icons used in the flow */
const icons = {
  store: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  sync: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  agent: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 014 4v1a1 1 0 001 1h1a4 4 0 010 8h-1a1 1 0 00-1 1v1a4 4 0 01-8 0v-1a1 1 0 00-1-1H6a4 4 0 010-8h1a1 1 0 001-1V6a4 4 0 014-4z" />
    </svg>
  ),
  catalog: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  ),
  app: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  webhook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  payment: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  order: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  truck: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
};

function FlowDiagram() {
  return (
    <div className="space-y-8">
      {/* ── ROW 1: ShopAgent Platform (big container) ──────────── */}
      <div className="relative">
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-5 pb-6">
          {/* Platform label */}
          <div className="absolute -top-3.5 left-4 px-3 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold rounded-full shadow">
            ShopAgent Platform
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
            {/* Left: Merchant supply side */}
            <div className="rounded-xl border border-orange-200 bg-white p-4">
              <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3">
                Supply Side
              </p>
              <div className="flex items-start gap-3">
                <FlowNode icon={icons.store} label="Merchants" sub="Shopify, WooCommerce" gradient="from-orange-500 to-amber-500" />
                <Arrow label="Shopify API" />
                <FlowNode icon={icons.sync} label="Product Sync" sub="Auto-import catalog" gradient="from-blue-500 to-cyan-500" />
                <Arrow />
                <FlowNode icon={icons.catalog} label="Unified Catalog" sub="All products indexed" gradient="from-emerald-500 to-blue-500" />
              </div>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Merchants connect their stores. Products, variants, prices, and inventory are synced automatically into ShopAgent&apos;s unified catalog.
              </p>
            </div>

            {/* Right: AI Agent */}
            <div className="rounded-xl border border-teal-200 bg-white p-4">
              <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-3">
                AI Engine
              </p>
              <div className="flex items-start gap-3">
                <FlowNode icon={icons.agent} label="AI Agent" sub="Powered by Claude" gradient="from-teal-500 to-pink-500" />
                <Arrow />
                <FlowNode icon={icons.search} label="Smart Search" sub="Semantic matching" gradient="from-teal-500 to-teal-500" />
                <Arrow />
                <FlowNode icon={icons.chat} label="Conversation" sub="Natural language" gradient="from-pink-500 to-rose-500" />
              </div>
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Claude-powered AI agent understands natural language, searches across all merchant catalogs, recommends products, and handles the full purchase flow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Connector: ShopAgent → Your App ──────────────────── */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-16 bg-gray-300" />
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              REST API + WebSocket
            </span>
            <div className="h-[2px] w-16 bg-gray-300" />
          </div>
          <div className="w-[2px] h-4 bg-gray-300" />
          <svg width="10" height="8" viewBox="0 0 10 8" className="text-gray-300 -mt-[1px]">
            <path d="M0 0 L5 8 L10 0 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ── ROW 2: Your App (integration) ─────────────────── */}
      <div className="relative">
        <div className="rounded-2xl border-2 border-dashed border-green-200 bg-green-50/30 p-5 pb-6">
          <div className="absolute -top-3.5 left-4 px-3 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-full shadow">
            Your Application
          </div>
          <div className="flex flex-wrap items-start justify-center gap-3 mt-3">
            <FlowNode icon={icons.app} label="Your App" sub="Gets API keys" gradient="from-green-500 to-emerald-500" />
            <Arrow label="Embed" />
            <FlowNode icon={icons.chat} label="Chat Widget" sub="In your UI" gradient="from-green-600 to-teal-500" />
            <Arrow label="Users arrive" />
            <FlowNode icon={icons.user} label="End Users" sub="Your customers" gradient="from-teal-500 to-cyan-500" />
          </div>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed text-center">
            You integrate ShopAgent by adding your API keys. Embed the chat widget or connect via WebSocket. Your users chat with the AI agent directly in your app.
          </p>
        </div>
      </div>

      {/* ── Connector: Your App → Purchase Flow ─────────── */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-gray-300" />
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              User wants to buy
            </span>
            <div className="h-[2px] w-12 bg-gray-300" />
          </div>
          <div className="w-[2px] h-4 bg-gray-300" />
          <svg width="10" height="8" viewBox="0 0 10 8" className="text-gray-300 -mt-[1px]">
            <path d="M0 0 L5 8 L10 0 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ── ROW 3: Purchase Flow ──────────────────────────── */}
      <div className="relative">
        <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30 p-5 pb-6">
          <div className="absolute -top-3.5 left-4 px-3 py-0.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-bold rounded-full shadow">
            Purchase Flow
          </div>
          <div className="flex flex-wrap items-start justify-center gap-3 mt-3">
            <FlowNode icon={icons.webhook} label="Balance Check" sub="Webhook to your app" gradient="from-amber-500 to-yellow-500" />
            <Arrow label="Confirmed" />
            <FlowNode icon={icons.payment} label="Charge" sub="Process payment" gradient="from-orange-500 to-red-500" />
            <Arrow label="Paid" />
            <FlowNode icon={icons.order} label="Order Created" sub="Stored in ShopAgent" gradient="from-green-500 to-emerald-500" />
            <Arrow label="Notify" />
            <FlowNode icon={icons.truck} label="Fulfillment" sub="Merchant ships" gradient="from-teal-500 to-cyan-500" />
          </div>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed text-center">
            When a user decides to purchase, ShopAgent sends a <strong>balance_check</strong> webhook to your app. You confirm the balance, ShopAgent sends a <strong>charge</strong> webhook, you process payment. The order is created and the merchant is notified to fulfill it.
          </p>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">1</div>
            <p className="text-base font-semibold text-gray-900">Merchants Onboard</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Merchants connect their Shopify store via the merchant portal. Products auto-sync into ShopAgent&apos;s catalog.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">2</div>
            <p className="text-base font-semibold text-gray-900">You Integrate</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Get API keys from the dashboard. Embed the chat widget or connect via WebSocket with your client ID and secret.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-600 flex items-center justify-center text-sm font-bold">3</div>
            <p className="text-base font-semibold text-gray-900">Users Shop</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your users chat with the AI agent in natural language. It searches products, gives personalized recommendations, and handles checkout.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">4</div>
            <p className="text-base font-semibold text-gray-900">Orders Fulfilled</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Webhooks handle balance checks and charges. Orders are created automatically and merchants fulfill them.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Home Page ────────────────────────────────────────── */
export default function HomePage() {
  const [activeSection, setActiveSection] = useState("authentication");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionIds = SIDEBAR_LINKS.map((l) => l.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function handleNavClick(href: string) {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-gray-100 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">ShopAgent</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 sm:inline-flex"
            >
              Home
            </Link>
            <a
              href="https://github.com/codewithmuh/shopagent"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ShopAgent on GitHub"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.72-4.04-1.59-4.04-1.59-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 016 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>
              <span className="hidden lg:inline">GitHub</span>
            </a>
            <Link
              href="/portal/login"
              className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Get API keys
            </Link>
          </div>
        </div>
      </header>

      {/* ── Docs Content ──────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex gap-8">
          {/* Sticky sidebar / TOC */}
          <nav className="hidden lg:block w-56 flex-shrink-0 sticky top-20 self-start">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              On this page
            </p>
            <ul className="space-y-1 border-l-2 border-gray-100">
              {SIDEBAR_LINKS.map((link) => {
                const isActive = activeSection === link.href.replace("#", "");
                return (
                  <li key={link.href} className="-ml-[2px]">
                    <button
                      onClick={() => handleNavClick(link.href)}
                      className={`block w-full text-left pl-3 pr-3 py-1.5 text-base border-l-2 transition ${
                        isActive
                          ? "text-emerald-700 font-medium border-emerald-600"
                          : "text-gray-500 hover:text-gray-900 border-transparent hover:border-gray-300"
                      }`}
                    >
                      {link.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Main docs content */}
          <div ref={contentRef} className="flex-1 min-w-0 space-y-12">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 border border-emerald-100 rounded-full text-sm font-medium text-emerald-700 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Developer Docs
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Build with ShopAgent
              </h1>
              <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
                Embed Leo — the AI shopping agent — into your own app. This guide takes
                you from API keys to a live WebSocket chat and payment webhooks, with
                copy-paste examples in JavaScript and Python.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#quick-start" className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50 transition">
                  Quick start →
                </a>
                <a href="#authentication" className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Authentication
                </a>
                <a href="#websocket" className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  WebSocket
                </a>
                <a href="#webhooks" className="px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Webhooks
                </a>
              </div>
            </div>

            {/* System Flow */}
            <Section id="system-flow" title="How It Works">
              <p className="text-base text-gray-500 mb-4">
                ShopAgent is the platform — merchants supply products, the AI agent
                powers shopping. You integrate it into your app.
              </p>
              <FlowDiagram />
            </Section>

            {/* Quick Start */}
            <Section id="quick-start" title="Quick Start">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-base text-emerald-800 font-medium mb-1">
                  Get up and running in 5 minutes
                </p>
                <p className="text-base text-emerald-700 leading-relaxed">
                  Follow these steps to connect your app to the ShopAgent AI shopping agent.
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                    <p className="text-base font-semibold text-gray-900">Create an account &amp; get API keys</p>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed ml-10">
                    Sign up on the{" "}
                    <Link href="/portal/login" className="text-emerald-600 underline font-medium">Portal</Link>
                    {" "}to create your company account. You&apos;ll receive a{" "}
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Client ID</code>,{" "}
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Secret Key</code>, and{" "}
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">Webhook Secret</code>
                    {" "}from your dashboard.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                    <p className="text-base font-semibold text-gray-900">Register your users</p>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed ml-10 mb-3">
                    Create users in ShopAgent so the agent can track their conversations and orders.
                    Each user needs a unique ID from your system.
                  </p>
                  <div className="ml-10">
                    <CodeBlock
                      language="cURL"
                      code={`curl -X POST https://api.example.com/api/v1/users/ \\
  -H "X-Client-ID: your_client_id" \\
  -H "X-Secret-Key: your_secret_key" \\
  -H "Content-Type: application/json" \\
  -d '{"external_user_id": "user_123", "display_name": "Alice"}'`}
                    />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                    <p className="text-base font-semibold text-gray-900">Connect via WebSocket</p>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed ml-10 mb-3">
                    Open a WebSocket connection for each user session. The AI agent handles the
                    conversation, product search, and checkout flow automatically.
                  </p>
                  <div className="ml-10">
                    <CodeBlock
                      language="JavaScript"
                      code={`const ws = new WebSocket(
  "wss://api.example.com/ws/agent/" +
  "?client_id=YOUR_ID&secret_key=YOUR_KEY&user_id=user_123"
);

ws.onopen = () => ws.send(JSON.stringify({
  message: "Show me running shoes under $150"
}));

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log(data.message);   // Agent's response text
  console.log(data.products);  // Product cards (if any)
};`}
                    />
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                    <p className="text-base font-semibold text-gray-900">Handle webhooks for payments</p>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed ml-10 mb-3">
                    Set up a webhook endpoint on your server. When a user wants to buy something,
                    ShopAgent sends a <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">balance_check</code>
                    {" "}event, then a <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">charge</code> event.
                    You respond with the user&apos;s balance and payment confirmation.
                  </p>
                  <div className="ml-10">
                    <CodeBlock
                      language="JavaScript"
                      code={`// Your server receives:
// POST /webhooks/shopagent  { event: "balance_check", user_id, amount }
// → Respond: { "approved": true }

// POST /webhooks/shopagent  { event: "charge", user_id, amount, token_address, token, network }
// → Respond: { "success": true, "transaction_id": "tx_abc123def" }`}
                    />
                  </div>
                </div>

                {/* Step 5 */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
                    <p className="text-base font-semibold text-gray-900">Done! Monitor via REST API</p>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed ml-10">
                    Use the REST endpoints to fetch chat history, list users, view orders,
                    and manage addresses. The agent handles everything else — product discovery,
                    recommendations, and the purchase conversation.
                  </p>
                </div>
              </div>
            </Section>

            {/* Authentication */}
            <Section id="authentication" title="Authentication">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-base text-emerald-800 font-medium mb-2">
                  API Key Authentication
                </p>
                <p className="text-base text-emerald-700 leading-relaxed">
                  All API requests must include your credentials via HTTP
                  headers. You can find your Client ID and Secret Key on the{" "}
                  <Link
                    href="/portal/dashboard"
                    className="underline font-medium"
                  >
                    Dashboard
                  </Link>
                  .
                </p>
              </div>

              {/* Base URL */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Base URLs
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-gray-400 uppercase w-12 flex-shrink-0 pt-1">REST</span>
                    <code className="text-base font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      https://api.example.com
                    </code>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-gray-400 uppercase w-12 flex-shrink-0 pt-1">WS</span>
                    <code className="text-base font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      wss://api.example.com
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Required Headers
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                      X-Client-ID
                    </code>
                    <p className="text-base text-gray-600">
                      Your unique client identifier (found on the Dashboard)
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                      X-Secret-Key
                    </code>
                    <p className="text-base text-gray-600">
                      Your secret API key (keep this private, never expose in
                      client-side code)
                    </p>
                  </div>
                </div>
              </div>

              <CodeBlock
                language="HTTP"
                code={`GET /api/v1/users/ HTTP/1.1
Host: api.example.com
X-Client-ID: your_client_id
X-Secret-Key: your_secret_key
Content-Type: application/json`}
              />
            </Section>

            {/* WebSocket */}
            <Section id="websocket" title="WebSocket Chat">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-2">
                  WebSocket Endpoint
                </p>
                <code className="text-base font-mono text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block">
                  wss://api.example.com/ws/agent/?client_id=...&amp;secret_key=...&amp;user_id=...
                </code>
                <p className="text-base text-gray-500 mt-3 leading-relaxed">
                  Open a persistent connection for each user session. The AI agent manages the
                  full conversation — product discovery, recommendations, size/variant selection,
                  and checkout — all through natural language. The connection stays open until
                  the user leaves or you close it.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Connection Parameters
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                      client_id
                    </code>
                    <div>
                      <p className="text-base text-gray-600">
                        Your company&apos;s Client ID
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">Required — used for authentication</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                      secret_key
                    </code>
                    <div>
                      <p className="text-base text-gray-600">
                        Your company&apos;s Secret Key
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">Required — keep server-side only</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                      user_id
                    </code>
                    <div>
                      <p className="text-base text-gray-600">
                        Your app&apos;s unique identifier for this user
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">Required — must be pre-registered via REST API</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Message Format
                </p>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Send (Client → Server)
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{ "message": "Find me running shoes under $150" }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Receive (Server → Client) — Text response
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{
  "type": "agent_response",
  "message": "I found some great running shoes for you! Here are 3 options under $150..."
}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Receive (Server → Client) — With product results
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{
  "type": "agent_response",
  "message": "Here are the running shoes I found:",
  "products": [
    {
      "id": "prod_abc123",
      "title": "Nike Air Zoom Pegasus 41",
      "description": "Lightweight neutral running shoe",
      "merchant": "FitGear Store",
      "image_url": "https://...",
      "variants": [
        {
          "id": "var_001",
          "title": "Black / Size 10",
          "price": "129.99",
          "available_qty": 15
        }
      ]
    }
  ]
}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Receive (Server → Client) — Order placed
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{
  "type": "agent_response",
  "message": "Your order has been placed successfully!",
  "order": {
    "id": "ord_xyz789",
    "status": "PAID",
    "amount": "129.99",
    "items": [{ "product": "Nike Air Zoom Pegasus 41", "variant": "Black / Size 10", "qty": 1 }]
  }
}`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <p className="text-base font-medium text-gray-900 mb-2">
                  Agent Capabilities
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  The AI agent uses these tools internally — you don&apos;t need to call them. Just send natural language messages.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: "search_products", desc: "Find products by query" },
                    { name: "get_product", desc: "View product details" },
                    { name: "register_user", desc: "Create user accounts" },
                    { name: "add_address", desc: "Save shipping info" },
                    { name: "get_addresses", desc: "List saved addresses" },
                    { name: "check_balance", desc: "Verify user funds" },
                    { name: "buy_product", desc: "Place an order" },
                    { name: "order_history", desc: "View past orders" },
                  ].map((tool) => (
                    <div key={tool.name} className="bg-white rounded-lg border border-gray-200 p-2.5">
                      <code className="text-xs font-mono text-emerald-600">{tool.name}</code>
                      <p className="text-xs text-gray-400 mt-0.5">{tool.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* REST Endpoints */}
            <Section id="rest-endpoints" title="REST Endpoints">
              <p className="text-base text-gray-500">
                These endpoints require{" "}
                <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                  X-Client-ID
                </code>{" "}
                and{" "}
                <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">
                  X-Secret-Key
                </code>{" "}
                headers for authentication.
              </p>

              <div className="space-y-4 mt-4">
                <EndpointCard
                  method="POST"
                  path="/api/v1/users/"
                  description="Create or register a new user for your company."
                >
                  <p className="text-gray-600 mb-2">
                    Register a user before they can connect via WebSocket. The{" "}
                    <code className="text-sm font-mono bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded">external_user_id</code>
                    {" "}should be your app&apos;s unique identifier for this user.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Request body</p>
                      <CodeBlock
                        language="JSON"
                        code={`{
  "external_user_id": "user_alice_123",
  "display_name": "Alice"
}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Response (201)</p>
                      <CodeBlock
                        language="JSON"
                        code={`{
  "id": "usr_abc123",
  "external_user_id": "user_alice_123",
  "display_name": "Alice",
  "created_at": "2026-03-06T10:00:00Z"
}`}
                      />
                    </div>
                  </div>
                </EndpointCard>

                <EndpointCard
                  method="GET"
                  path="/api/v1/users/"
                  description="List all users associated with your company."
                >
                  <p className="text-gray-600 mb-2">
                    Returns a paginated list of users who have interacted with
                    your integration of the ShopAgent agent.
                  </p>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Response (200)</p>
                  <CodeBlock
                    language="JSON"
                    code={`{
  "count": 42,
  "next": "/api/v1/users/?page=2",
  "results": [
    {
      "id": "usr_abc123",
      "external_user_id": "user_alice_123",
      "display_name": "Alice",
      "created_at": "2026-03-06T10:00:00Z"
    }
  ]
}`}
                  />
                </EndpointCard>

                <EndpointCard
                  method="GET"
                  path="/api/v1/chat/history/?user_id={user_id}"
                  description="Retrieve the chat history for a specific user."
                >
                  <p className="text-gray-600 mb-2">
                    Returns all messages exchanged between the user and
                    the AI agent, ordered chronologically. Useful for displaying
                    past conversations or syncing state.
                  </p>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Response (200)</p>
                  <CodeBlock
                    language="JSON"
                    code={`[
  {
    "role": "user",
    "content": "Show me running shoes under $150",
    "timestamp": "2026-03-06T10:05:00Z"
  },
  {
    "role": "assistant",
    "content": "I found 3 running shoes under $150...",
    "products": [...],
    "timestamp": "2026-03-06T10:05:03Z"
  }
]`}
                  />
                </EndpointCard>

                <EndpointCard
                  method="GET"
                  path="/api/v1/users/{user_id}/orders/"
                  description="Get all orders placed by a user."
                >
                  <p className="text-gray-600 mb-2">
                    Returns order history including status, line items,
                    amounts, and fulfillment tracking.
                  </p>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Response (200)</p>
                  <CodeBlock
                    language="JSON"
                    code={`[
  {
    "id": "ord_xyz789",
    "status": "PAID",
    "amount": "129.99",
    "currency": "USD",
    "items": [
      {
        "product_title": "Nike Air Zoom Pegasus 41",
        "variant_title": "Black / Size 10",
        "quantity": 1,
        "price": "129.99"
      }
    ],
    "shipping_address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001"
    },
    "created_at": "2026-03-06T10:10:00Z"
  }
]`}
                  />
                </EndpointCard>

                <EndpointCard
                  method="GET"
                  path="/api/v1/users/{user_id}/addresses/"
                  description="Get saved shipping addresses for a user."
                >
                  <p className="text-gray-600 mb-2">
                    Returns all shipping addresses on file. Users can save addresses
                    through the AI agent conversation or you can add them via this endpoint.
                  </p>
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Response (200)</p>
                  <CodeBlock
                    language="JSON"
                    code={`[
  {
    "id": "addr_001",
    "label": "Home",
    "line1": "123 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
]`}
                  />
                </EndpointCard>
              </div>
            </Section>

            {/* Webhooks */}
            <Section id="webhooks" title="Webhooks">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-base text-amber-800 font-medium mb-1">
                  Signature Verification
                </p>
                <p className="text-base text-amber-700 leading-relaxed">
                  All webhook requests include an{" "}
                  <code className="text-sm font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                    X-Webhook-Signature
                  </code>{" "}
                  header. Verify this signature using your Webhook Secret to
                  ensure the request is authentic.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Webhook Events
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-sm font-bold rounded bg-blue-100 text-blue-700">
                        POST
                      </span>
                      <code className="text-base font-mono text-gray-900">
                        balance_check
                      </code>
                    </div>
                    <p className="text-base text-gray-500 mb-2">
                      Sent when the AI agent needs to verify a user&apos;s
                      balance before placing an order.
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{
  "event": "balance_check",
  "user_id": "0x1234...abcd",
  "amount": "149.99",
  "currency": "USD",
  "order_id": "ord_abc123",
  "timestamp": "2026-03-04T12:00:00Z"
}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-sm font-bold rounded bg-blue-100 text-blue-700">
                        POST
                      </span>
                      <code className="text-base font-mono text-gray-900">
                        charge
                      </code>
                    </div>
                    <p className="text-base text-gray-500 mb-2">
                      Sent when a payment is processed for an order.
                    </p>
                    <CodeBlock
                      language="JSON"
                      code={`{
  "event": "charge",
  "user_id": "0x1234...abcd",
  "amount": "149.99",
  "currency": "USD",
  "order_id": "ord_abc123",
  "tx_hash": "0x8f3a...c721",
  "status": "completed",
  "timestamp": "2026-03-04T12:00:05Z"
}`}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-2">
                  Expected Response
                </p>
                <p className="text-base text-gray-500 mb-3">
                  Your webhook endpoint should respond with a JSON body
                  indicating success:
                </p>
                <CodeBlock
                  language="JSON"
                  code={`// For balance_check — approve or decline the order
{
  "approved": true
}
// Or decline with a reason:
{
  "approved": false,
  "reason": "Insufficient balance"
}

// For charge — confirm the payment was processed
{
  "success": true,
  "transaction_id": "tx_abc123def"
}

// For order_followup — just acknowledge receipt
{
  "received": true
}`}
                />
              </div>
            </Section>

            {/* Errors & Status Codes */}
            <Section id="errors" title="Errors & Status Codes">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  HTTP Status Codes
                </p>
                <div className="space-y-2">
                  {[
                    { code: "200", label: "OK", desc: "Request succeeded", color: "bg-green-100 text-green-700" },
                    { code: "201", label: "Created", desc: "Resource created successfully", color: "bg-green-100 text-green-700" },
                    { code: "400", label: "Bad Request", desc: "Invalid request body or parameters", color: "bg-yellow-100 text-yellow-700" },
                    { code: "401", label: "Unauthorized", desc: "Missing or invalid API keys", color: "bg-red-100 text-red-700" },
                    { code: "403", label: "Forbidden", desc: "Valid keys but insufficient permissions", color: "bg-red-100 text-red-700" },
                    { code: "404", label: "Not Found", desc: "Resource does not exist", color: "bg-gray-100 text-gray-700" },
                    { code: "429", label: "Rate Limited", desc: "Too many requests — slow down", color: "bg-orange-100 text-orange-700" },
                    { code: "500", label: "Server Error", desc: "Something went wrong on our end", color: "bg-red-100 text-red-700" },
                  ].map((s) => (
                    <div key={s.code} className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-sm font-bold rounded ${s.color} w-10 text-center flex-shrink-0`}>
                        {s.code}
                      </span>
                      <span className="text-base font-medium text-gray-900 w-28 flex-shrink-0">{s.label}</span>
                      <span className="text-base text-gray-500">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  Error Response Format
                </p>
                <p className="text-base text-gray-500 mb-3">
                  All error responses follow a consistent JSON structure:
                </p>
                <CodeBlock
                  language="JSON"
                  code={`{
  "error": "Invalid credentials",
  "detail": "The X-Client-ID or X-Secret-Key header is missing or invalid.",
  "status": 401
}`}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-base font-medium text-gray-900 mb-3">
                  WebSocket Close Codes
                </p>
                <div className="space-y-2">
                  {[
                    { code: "1000", desc: "Normal closure — conversation ended" },
                    { code: "4001", desc: "Authentication failed — invalid credentials" },
                    { code: "4004", desc: "User not found — register the user first" },
                    { code: "4029", desc: "Rate limited — too many messages" },
                  ].map((s) => (
                    <div key={s.code} className="flex items-center gap-3">
                      <code className="text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded flex-shrink-0">
                        {s.code}
                      </code>
                      <span className="text-base text-gray-600">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-base text-blue-800 font-medium mb-1">
                  Rate Limits
                </p>
                <p className="text-base text-blue-700 leading-relaxed">
                  REST API: <strong>100 requests/minute</strong> per API key.
                  WebSocket: <strong>30 messages/minute</strong> per connection.
                  If you need higher limits, <Link href="/contact" className="underline font-medium">contact us</Link>.
                </p>
              </div>
            </Section>

            {/* JavaScript Examples */}
            <Section id="examples-js" title="JavaScript Examples">
              <CodeBlock
                language="JavaScript"
                code={`// Connect to the ShopAgent AI agent via WebSocket
const WS_URL = "wss://api.example.com/ws/agent/";
const CLIENT_ID = "your_client_id";
const SECRET_KEY = "your_secret_key";
const USER_ID = "0x1234...abcd";

const ws = new WebSocket(
  \`\${WS_URL}?client_id=\${CLIENT_ID}&secret_key=\${SECRET_KEY}&user_id=\${USER_ID}\`
);

ws.onopen = () => {
  console.log("Connected to ShopAgent agent");
  ws.send(JSON.stringify({
    message: "Show me running shoes under $150"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Agent response:", data.message);

  // Handle product results
  if (data.products) {
    data.products.forEach(p => {
      console.log(\`  - \${p.name}: $\${p.price}\`);
    });
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected from ShopAgent agent");
};`}
              />

              <CodeBlock
                language="JavaScript"
                code={`// Fetch chat history via REST API
const API_URL = "https://api.example.com";
const CLIENT_ID = "your_client_id";
const SECRET_KEY = "your_secret_key";

async function getChatHistory(userId) {
  const res = await fetch(
    \`\${API_URL}/api/v1/chat/history/?user_id=\${userId}\`,
    {
      headers: {
        "X-Client-ID": CLIENT_ID,
        "X-Secret-Key": SECRET_KEY,
      },
    }
  );
  return await res.json();
}

// List all users
async function listUsers() {
  const res = await fetch(\`\${API_URL}/api/v1/users/\`, {
    headers: {
      "X-Client-ID": CLIENT_ID,
      "X-Secret-Key": SECRET_KEY,
    },
  });
  return await res.json();
}`}
              />

              <CodeBlock
                language="JavaScript"
                code={`// Verify webhook signature (Node.js / Express)
const crypto = require("crypto");

function verifyWebhookSignature(body, timestamp, signature, secret) {
  // Signature is HMAC-SHA256 of "{timestamp}.{body}"
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(\`\${timestamp}.\${body}\`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post("/webhooks/shopagent", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  const body = req.body.toString();

  if (!verifyWebhookSignature(body, timestamp, signature, process.env.SHOPAGENT_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = JSON.parse(body);
  const { type, user_id, amount, order_id } = payload;

  if (type === "balance_check") {
    const canAfford = checkUserBalance(user_id, amount);
    return res.json({ approved: canAfford });
  }

  if (type === "charge") {
    const txId = processCharge(user_id, amount, order_id);
    return res.json({ success: true, transaction_id: txId });
  }

  res.json({ success: true });
});`}
              />
            </Section>

            {/* Python Examples */}
            <Section id="examples-python" title="Python Examples">
              <CodeBlock
                language="Python"
                code={`# Connect to the ShopAgent AI agent via WebSocket
import asyncio
import json
import websockets

CLIENT_ID = "your_client_id"
SECRET_KEY = "your_secret_key"
USER_ID = "0x1234...abcd"

async def chat_with_agent():
    uri = (
        f"wss://api.example.com/ws/agent/"
        f"?client_id={CLIENT_ID}"
        f"&secret_key={SECRET_KEY}"
        f"&user_id={USER_ID}"
    )

    async with websockets.connect(uri) as ws:
        # Send a message
        await ws.send(json.dumps({
            "message": "Show me running shoes under $150"
        }))

        # Receive response
        response = await ws.recv()
        data = json.loads(response)
        print(f"Agent: {data['message']}")

        if "products" in data:
            for p in data["products"]:
                print(f"  - {p['name']}: \${p['price']}")

asyncio.run(chat_with_agent())`}
              />

              <CodeBlock
                language="Python"
                code={`# REST API usage with requests
import requests

API_URL = "https://api.example.com"
HEADERS = {
    "X-Client-ID": "your_client_id",
    "X-Secret-Key": "your_secret_key",
}

# List all users
def list_users():
    r = requests.get(f"{API_URL}/api/v1/users/", headers=HEADERS)
    return r.json()

# Get chat history for a user
def get_chat_history(user_id: str):
    r = requests.get(
        f"{API_URL}/api/v1/chat/history/?user_id={user_id}",
        headers=HEADERS,
    )
    return r.json()

# Get user orders
def get_user_orders(user_id: str):
    r = requests.get(
        f"{API_URL}/api/v1/users/{user_id}/orders/",
        headers=HEADERS,
    )
    return r.json()

# Create a new user
def create_user(user_id: str, display_name: str = ""):
    r = requests.post(
        f"{API_URL}/api/v1/users/",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"external_user_id": user_id, "display_name": display_name},
    )
    return r.json()`}
              />

              <CodeBlock
                language="Python"
                code={`# Verify webhook signature (Flask)
import hmac
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = "your_webhook_secret"

def verify_signature(body: bytes, timestamp: str, signature: str) -> bool:
    # Signature is HMAC-SHA256 of "{timestamp}.{body}"
    expected = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(),
        f"{timestamp}.{body.decode()}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route("/webhooks/shopagent", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("X-Webhook-Signature", "")
    timestamp = request.headers.get("X-Webhook-Timestamp", "")
    body = request.get_data()

    if not verify_signature(body, timestamp, signature):
        return jsonify({"error": "Invalid signature"}), 401

    payload = request.json
    event_type = payload["type"]
    user_id = payload["user_id"]
    amount = payload["amount"]

    if event_type == "balance_check":
        can_afford = check_user_balance(user_id, amount)
        return jsonify({"approved": can_afford})

    if event_type == "charge":
        tx_id = process_charge(user_id, amount)
        return jsonify({"success": True, "transaction_id": tx_id})

    return jsonify({"success": True})`}
              />
            </Section>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t bg-gray-50 px-6 py-12 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <LogoMark className="h-7 w-7" />
                <span className="font-bold text-gray-900">ShopAgent</span>
              </div>
              <p className="text-base text-gray-500 leading-relaxed">
                AI shopping agent platform. Add voice-powered commerce to any
                app with a simple API.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-base text-gray-500">
                <li>
                  <Link
                    href="/portal/login"
                    className="hover:text-gray-900 transition"
                  >
                    Get API Keys
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portal/dashboard"
                    className="hover:text-gray-900 transition"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/merchant/login"
                    className="hover:text-gray-900 transition"
                  >
                    Merchant Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-base text-gray-500">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-gray-900 transition"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-gray-900 transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-gray-900 transition"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">
                Connect
              </h4>
              <ul className="space-y-2.5 text-base text-gray-500">
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

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-base text-gray-400">
              &copy; 2026 ShopAgent · Built by{" "}
              <a href="https://codewithmuh.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
                CodeWithMuh
              </a>
            </p>
            <div className="flex gap-6 text-base text-gray-400">
              <Link
                href="/terms"
                className="hover:text-gray-700 transition"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-gray-700 transition"
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="hover:text-gray-700 transition"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
