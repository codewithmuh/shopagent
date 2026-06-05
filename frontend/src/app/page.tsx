import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { ChatPreview } from "@/components/marketing/ChatPreview";

/* Marketing landing for ShopAgent. Server component — the interactive chat
 * demo is isolated in <ChatPreview/>. Independently authored. */

const GITHUB_URL = "https://github.com/codewithmuh/shopagent";

function GitHubGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.2 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.72-4.04-1.59-4.04-1.59-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 016 0c2.29-1.53 3.3-1.21 3.3-1.21.66 1.65.24 2.87.12 3.17.77.83 1.24 1.88 1.24 3.17 0 4.54-2.81 5.54-5.49 5.83.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .31.21.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z" />
    </svg>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteNav />
      <Hero />
      <Flow />
      <Capabilities />
      <Roles />
      <CallToAction />
      <SiteFooter />
    </div>
  );
}

/* ── Nav ────────────────────────────────────────────────── */
function SiteNav() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-gray-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">ShopAgent</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {[
            ["Docs", "/docs"],
            ["Live demo", "/demo/login"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="ShopAgent on GitHub"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          >
            <GitHubGlyph size={18} />
            <span className="hidden lg:inline">GitHub</span>
          </a>
          <Link
            href="/portal/login"
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Get API keys
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-white to-white" />
      <div className="pointer-events-none absolute -right-20 -top-32 h-[640px] w-[640px] rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-40 h-[420px] w-[420px] rounded-full bg-teal-200/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-20 lg:grid-cols-2 lg:gap-16">
        {/* copy */}
        <div className="text-center lg:text-left">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-4 py-1.5 text-sm font-medium text-emerald-700 shadow-soft backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            AI Shopping Agent Platform
          </span>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-[3.5rem]">
            Commerce through <span className="text-gradient">conversation</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500 lg:mx-0 md:text-xl">
            Drop a chat-and-voice shopping agent into any app. Leo finds the
            products, answers the questions, and closes the sale — your users just
            talk.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/portal/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-7 py-3.5 text-lg font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800"
            >
              Get API keys
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-7 py-3.5 text-lg font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <GitHubGlyph />
              Star on GitHub
            </a>
          </div>

          <p className="mt-5 text-sm text-gray-400">
            Try the{" "}
            <Link href="/demo/login" className="text-gray-600 underline underline-offset-2 hover:text-gray-900">
              live demo
            </Link>{" "}
            ·{" "}
            read the{" "}
            <Link href="/docs" className="text-gray-600 underline underline-offset-2 hover:text-gray-900">
              docs
            </Link>
          </p>
        </div>

        {/* framed chat demo */}
        <div className="relative">
          <span className="absolute -left-6 -top-4 z-20 hidden items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-soft lg:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            Voice + text
          </span>
          <span className="absolute -bottom-4 -right-4 z-20 hidden items-center gap-1.5 rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-soft lg:inline-flex">
            <span className="text-emerald-600">◆</span> USDC checkout
          </span>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft-lg">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-300" />
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
              <span className="h-3 w-3 rounded-full bg-green-300" />
              <span className="flex flex-1 justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  app.shopagent.dev/chat
                </span>
              </span>
            </div>
            <div className="bg-gradient-to-b from-emerald-50/30 to-white">
              <ChatPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── The flow (timeline) ────────────────────────────────── */
const STEPS = [
  {
    n: "01",
    title: "Discover",
    body: "Your shopper asks Leo for anything — by text or voice. It searches every connected store and surfaces the best matches as cards.",
  },
  {
    n: "02",
    title: "Pay",
    body: "They confirm and pay right in the chat with crypto — wallet connected once, USDC settled instantly. No forms, no card entry.",
  },
  {
    n: "03",
    title: "Fulfill",
    body: "Stock is reserved in Shopify the instant they buy, the order is created, and the merchant is notified to ship. No overselling.",
  },
];

function Flow() {
  return (
    <section className="border-t border-gray-100 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            The flow
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">From message to doorstep</h2>
          <p className="mt-3 text-lg text-gray-500">Three steps, all inside the conversation.</p>
        </header>

        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 md:block" />
          {STEPS.map((s) => (
            <li key={s.n} className="relative text-center md:px-4">
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-lg font-bold text-emerald-600 shadow-soft">
                {s.n}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-500">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Capabilities strip ─────────────────────────────────── */
const CAPABILITIES = [
  {
    title: "Text & voice",
    body: "Type or talk — Leo replies in kind, with optional speech in and out.",
  },
  {
    title: "Any currency",
    body: "Merchant prices are normalized to one display currency for the shopper.",
  },
  {
    title: "Live inventory",
    body: "Products sync from Shopify; stock is locked the moment an order is placed.",
  },
  {
    title: "Guardrails built in",
    body: "Prompt-injection resistance, strict shopping-only scope, and rate limits.",
  },
];

function Capabilities() {
  return (
    <section className="bg-app-gradient px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Under the hood
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Everything the agent handles</h2>
        </header>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="bg-white p-6">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Roles ──────────────────────────────────────────────── */
const ROLES = [
  {
    emoji: "🛍️",
    title: "Shoppers",
    body: "Chat with Leo by text or voice to discover products, get recommendations, and place & track orders — no forms, just conversation.",
    cta: ["Try the demo", "/demo/login"],
  },
  {
    emoji: "🏪",
    title: "Merchants",
    body: "Connect a Shopify store in seconds. Products, prices, images, and live inventory sync in and become shoppable in chat.",
    cta: ["Merchant portal", "/merchant/login"],
  },
  {
    emoji: "🏢",
    title: "Companies",
    body: "Embed the agent in your own app with a client ID & secret over a simple WebSocket API, and settle payments with webhooks.",
    cta: ["Get API keys", "/portal/login"],
  },
];

function Roles() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <header className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Built for three roles
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">One platform, three kinds of users</h2>
        </header>
        <div className="grid gap-8 md:grid-cols-3">
          {ROLES.map((r) => (
            <div
              key={r.title}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-8 shadow-soft card-lift"
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                {r.emoji}
              </span>
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <p className="mt-2 flex-1 leading-relaxed text-gray-500">{r.body}</p>
              <Link
                href={r.cta[1]}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {r.cta[0]} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────────── */
function CallToAction() {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-12 text-center text-white shadow-soft-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold md:text-4xl">Put Leo in your app this week</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50/90">
            Spin up the full stack with one command, grab your API keys, and connect
            over a WebSocket — it&apos;s all yours to run locally.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/portal/login"
              className="rounded-xl bg-white px-7 py-3.5 text-lg font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Get API keys
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-white/40 px-7 py-3.5 text-lg font-semibold text-white transition hover:bg-white/10"
            >
              View documentation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────── */
function SiteFooter() {
  const social: [string, string][] = [
    ["GitHub", GITHUB_URL],
    ["YouTube", "https://youtube.com/@codewithmuh"],
    ["LinkedIn", "https://www.linkedin.com/in/muhammad-rashid-daha/"],
    ["Website", "https://codewithmuh.com"],
  ];
  return (
    <footer className="mt-auto border-t border-gray-100 bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="font-bold text-gray-900">ShopAgent</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              An AI shopping agent for any app — discovery, recommendations, and
              checkout, all through conversation.
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

          <FooterCol
            title="Platform"
            links={[
              ["Get API keys", "/portal/login"],
              ["Merchant login", "/merchant/login"],
              ["Live demo", "/demo/login"],
              ["Documentation", "/docs"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["Terms", "/terms"],
              ["Privacy", "/privacy"],
              ["Contact", "/contact"],
            ]}
          />
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Connect</h4>
            <ul className="space-y-2.5 text-sm text-gray-500">
              {social.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="transition hover:text-gray-900">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a href="mailto:contact@codewithmuh.com" className="transition hover:text-gray-900">
                  contact@codewithmuh.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-sm text-gray-400">
            © 2026 ShopAgent · Built by{" "}
            <a href="https://codewithmuh.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
              CodeWithMuh
            </a>
          </p>
          <p className="text-sm text-gray-400">Source-available · PolyForm Noncommercial</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-gray-900">{title}</h4>
      <ul className="space-y-2.5 text-sm text-gray-500">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="transition hover:text-gray-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
