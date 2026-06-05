"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/dashboard/StatCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Company {
  id: number;
  name: string;
  contact_email: string;
  client_id: string;
  secret_key: string;
  webhook_url: string;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
}

interface Usage {
  total_requests: number;
  chat_requests: number;
  orders_created: number;
  webhooks_sent: number;
}

function CopyButton({ text, onCopy }: { text: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition flex-shrink-0"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function PortalDashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [credsCopied, setCredsCopied] = useState(false);

  useEffect(() => {
    setCredsCopied(localStorage.getItem("portal_creds_copied") === "true");
  }, []);

  function handleCredsCopy() {
    localStorage.setItem("portal_creds_copied", "true");
    setCredsCopied(true);
  }

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    try {
      const [profileRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/api/portal/profile/`, {
          headers: { "X-Portal-Token": token },
        }),
        fetch(`${API_URL}/api/portal/usage/`, {
          headers: { "X-Portal-Token": token },
        }),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setCompany(profileData);
        setWebhookUrl(profileData.webhook_url || "");
        localStorage.setItem("portal_company", JSON.stringify(profileData));
      }
      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function saveWebhookUrl() {
    const token = localStorage.getItem("portal_token");
    if (!token) return;

    setSavingWebhook(true);
    try {
      const res = await fetch(`${API_URL}/api/portal/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Portal-Token": token,
        },
        body: JSON.stringify({ webhook_url: webhookUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
        localStorage.setItem("portal_company", JSON.stringify(data));
        setWebhookSaved(true);
        setTimeout(() => setWebhookSaved(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setSavingWebhook(false);
    }
  }

  function maskValue(value: string) {
    if (!value) return "";
    if (value.length <= 8) return "*".repeat(value.length);
    return value.slice(0, 4) + "*".repeat(value.length - 8) + value.slice(-4);
  }

  const STAT_CARDS = [
    {
      label: "Total Requests",
      value: usage?.total_requests ?? 0,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      label: "Chat Requests",
      value: usage?.chat_requests ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" />
        </svg>
      ),
    },
    {
      label: "Orders Created",
      value: usage?.orders_created ?? 0,
      color: "text-green-600",
      bg: "bg-green-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      ),
    },
    {
      label: "Webhooks Sent",
      value: usage?.webhooks_sent ?? 0,
      color: "text-teal-600",
      bg: "bg-teal-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
  ];

  const wsBase = typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "wss://api.example.com"
    : "ws://localhost:8000";

  const wsExample = company
    ? `const ws = new WebSocket(
  "${wsBase}/ws/agent/" +
  "?client_id=${company.client_id}" +
  "&secret_key=${company.secret_key}" +
  "&user_id=YOUR_USER_ID"
);

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: "Find me wireless headphones under $200"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Agent:", data.message);
};`
    : "";

  const gettingStarted = company
    ? [
        {
          label: "Create your account",
          done: true,
        },
        {
          label: "Copy your API credentials",
          done: credsCopied,
          description: "Use your Client ID and Secret Key to authenticate requests",
        },
        {
          label: "Configure a webhook URL",
          done: !!company.webhook_url,
          description: "Receive balance_check and charge events in real-time",
        },
        {
          label: "Connect your first user",
          done: (usage?.chat_requests ?? 0) > 0,
          description: "Open a WebSocket connection and send a test message",
        },
      ]
    : [];

  const completedSteps = gettingStarted.filter((s) => s.done).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? (
              <span className="inline-block w-56 h-7 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              `Welcome, ${company?.name}`
            )}
          </h1>
          <p className="text-gray-500 mt-0.5">
            Your company control center — copy your API credentials to embed ShopAgent in your app, configure payment webhooks, and monitor agent usage.
          </p>
        </div>
        {company?.is_active && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        )}
      </div>

      {/* Getting Started */}
      {!loading && completedSteps < gettingStarted.length && (
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Getting Started</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {completedSteps} of {gettingStarted.length} steps completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-white/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps / gettingStarted.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {gettingStarted.map((step) => (
              <div
                key={step.label}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg ${step.done ? "opacity-60" : "bg-white/60"}`}
              >
                <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${step.done ? "bg-emerald-600" : "border-2 border-gray-300"}`}>
                  {step.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? "text-gray-500 line-through" : "text-gray-900"}`}>
                    {step.label}
                  </p>
                  {step.description && !step.done && (
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            iconBg={card.bg}
            iconColor={card.color}
            loading={loading}
          />
        ))}
      </div>

      {/* API Keys */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
        <p className="text-sm text-gray-500 mt-1">
          Use these credentials to authenticate your API requests
        </p>
        <div className="bg-white rounded-xl border border-gray-200 mt-4 divide-y divide-gray-100">
          {/* Client ID */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Client ID
              </p>
              <p className="text-sm font-mono text-gray-900 mt-1 truncate">
                {loading ? (
                  <span className="inline-block w-48 h-4 bg-gray-200 rounded animate-pulse" />
                ) : (
                  company?.client_id
                )}
              </p>
            </div>
            {company?.client_id && <CopyButton text={company.client_id} onCopy={handleCredsCopy} />}
          </div>

          {/* Secret Key */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Secret Key
              </p>
              <p className="text-sm font-mono text-gray-900 mt-1 truncate">
                {loading ? (
                  <span className="inline-block w-48 h-4 bg-gray-200 rounded animate-pulse" />
                ) : showSecret ? (
                  company?.secret_key
                ) : (
                  maskValue(company?.secret_key || "")
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!loading && (
                <>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition"
                  >
                    {showSecret ? "Hide" : "Reveal"}
                  </button>
                  {company?.secret_key && <CopyButton text={company.secret_key} onCopy={handleCredsCopy} />}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Webhook Configuration
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Receive real-time notifications for balance checks and charges
        </p>
        <div className="bg-white rounded-xl border border-gray-200 mt-4 divide-y divide-gray-100">
          {/* Webhook URL */}
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Webhook URL
            </p>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  setWebhookSaved(false);
                }}
                placeholder="https://your-api.com/webhooks/shopagent"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
              <button
                onClick={saveWebhookUrl}
                disabled={savingWebhook}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition flex-shrink-0"
              >
                {savingWebhook
                  ? "Saving..."
                  : webhookSaved
                    ? "Saved!"
                    : "Save"}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Webhook Secret
              </p>
              <p className="text-sm font-mono text-gray-900 mt-1 truncate">
                {loading ? (
                  <span className="inline-block w-48 h-4 bg-gray-200 rounded animate-pulse" />
                ) : showWebhookSecret ? (
                  company?.webhook_secret
                ) : (
                  maskValue(company?.webhook_secret || "")
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!loading && (
                <>
                  <button
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition"
                  >
                    {showWebhookSecret ? "Hide" : "Reveal"}
                  </button>
                  {company?.webhook_secret && (
                    <CopyButton text={company.webhook_secret} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WebSocket Example */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Quick Start</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect to the ShopAgent AI agent via WebSocket
        </p>
        <div className="bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-gray-500 ml-2">
                JavaScript
              </span>
            </div>
            {wsExample && <CopyButton text={wsExample} />}
          </div>
          <pre className="px-5 py-4 text-sm font-mono text-gray-800 overflow-x-auto">
            <code>{loading ? "Loading..." : wsExample}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
