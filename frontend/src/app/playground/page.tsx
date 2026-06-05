"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || API_URL.replace(/^http/, "ws");

/* ═══════════════════════════════════════════════════════════════
   REST Types & Presets
   ═══════════════════════════════════════════════════════════════ */

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = (typeof METHODS)[number];

const METHOD_COLORS: Record<Method, string> = {
  GET: "bg-green-100 text-green-700 border-green-300",
  POST: "bg-blue-100 text-blue-700 border-blue-300",
  PUT: "bg-orange-100 text-orange-700 border-orange-300",
  PATCH: "bg-yellow-100 text-yellow-700 border-yellow-300",
  DELETE: "bg-red-100 text-red-700 border-red-300",
};

interface Preset {
  name: string;
  method: Method;
  path: string;
  body?: string;
  auth?: "merchant" | "portal" | "apikey" | "none";
}

const PRESETS: Preset[] = [
  { name: "Search Products", method: "GET", path: "/api/catalog/search/?q=shoes", auth: "none" },
  { name: "Portal Login", method: "POST", path: "/api/portal/login/", body: JSON.stringify({ email: "store@urbanstyle.com", password: "demo1234" }, null, 2), auth: "none" },
  { name: "Portal Register", method: "POST", path: "/api/portal/register/", body: JSON.stringify({ name: "Test Co", contact_email: "test@example.com", password: "test1234" }, null, 2), auth: "none" },
  { name: "Portal Profile", method: "GET", path: "/api/portal/profile/", auth: "portal" },
  { name: "Portal Usage", method: "GET", path: "/api/portal/usage/", auth: "portal" },
  { name: "Merchant Login", method: "POST", path: "/api/merchant/login/", body: JSON.stringify({ email: "store@urbanstyle.com", password: "demo1234" }, null, 2), auth: "none" },
  { name: "Merchant Profile", method: "GET", path: "/api/merchant/profile/", auth: "merchant" },
  { name: "Merchant Products", method: "GET", path: "/api/catalog/merchant/products/", auth: "merchant" },
  { name: "Merchant Orders", method: "GET", path: "/api/orders/merchant/", auth: "merchant" },
  { name: "Merchant Dashboard Stats", method: "GET", path: "/api/merchant/dashboard/stats/", auth: "merchant" },
  { name: "Merchant Connections", method: "GET", path: "/api/merchant/connections/", auth: "merchant" },
  { name: "User Orders (API Key)", method: "GET", path: "/api/v1/users/USER_ID/orders/", auth: "apikey" },
  { name: "Chat History (API Key)", method: "GET", path: "/api/v1/chat/history/?user_id=USER_ID", auth: "apikey" },
];

/* ═══════════════════════════════════════════════════════════════
   WebSocket Presets
   ═══════════════════════════════════════════════════════════════ */

interface WsPreset {
  name: string;
  path: string;
  queryParams: Record<string, string>;
  description: string;
}

const WS_PRESETS: WsPreset[] = [
  {
    name: "Agent Chat (Acme Demo)",
    path: "/ws/agent/",
    queryParams: { client_id: "shopagent_test_demo", secret_key: "sk_test_demo_secret_key_for_local_development_only", user_id: "demo@acme.com", display_name: "Demo User" },
    description: "Acme Demo company — demo@acme.com user",
  },
  {
    name: "Agent Chat (Custom API Key)",
    path: "/ws/agent/",
    queryParams: { client_id: "YOUR_CLIENT_ID", secret_key: "YOUR_SECRET_KEY", user_id: "your-user-id", display_name: "Test User" },
    description: "Connect with your own API credentials",
  },
  {
    name: "Agent Chat (Session Resume)",
    path: "/ws/agent/SESSION_TOKEN/",
    queryParams: {},
    description: "Resume session by token (replace SESSION_TOKEN)",
  },
  {
    name: "Agent Chat (Anonymous)",
    path: "/ws/agent/",
    queryParams: {},
    description: "No auth — chat history won't persist",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: number }) {
  const color =
    status < 300
      ? "bg-green-100 text-green-800"
      : status < 400
        ? "bg-yellow-100 text-yellow-800"
        : status < 500
          ? "bg-red-100 text-red-800"
          : "bg-teal-100 text-teal-800";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {status}
    </span>
  );
}

type WsLogEntry = {
  id: number;
  direction: "sent" | "received" | "system";
  data: string;
  timestamp: Date;
};

/* ═══════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════ */

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<"rest" | "websocket">("rest");

  /* ─── REST State ──────────────────────────────────── */
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/api/catalog/search/?q=shoes");
  const [headersText, setHeadersText] = useState("{}");
  const [body, setBody] = useState("");
  const [authMode, setAuthMode] = useState<"none" | "merchant" | "portal" | "apikey">("none");
  const [merchantToken, setMerchantToken] = useState("");
  const [portalToken, setPortalToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
  } | null>(null);
  const [error, setError] = useState("");

  /* ─── WebSocket State ─────────────────────────────── */
  const [wsPath, setWsPath] = useState("/ws/agent/");
  const [wsParams, setWsParams] = useState("{}");
  const [wsMessage, setWsMessage] = useState('{"message": "Show me some shoes"}');
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnecting, setWsConnecting] = useState(false);
  const [wsLog, setWsLog] = useState<WsLogEntry[]>([]);
  const [wsSessionToken, setWsSessionToken] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const wsLogEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  // Auto-scroll ws log
  useEffect(() => {
    wsLogEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [wsLog]);

  /* ─── REST Handler ────────────────────────────────── */
  const send = useCallback(async () => {
    setLoading(true);
    setError("");
    setResponse(null);
    const start = performance.now();
    try {
      let extraHeaders: Record<string, string> = {};
      try { extraHeaders = JSON.parse(headersText); } catch { /* ignore */ }
      const headers: Record<string, string> = { "Content-Type": "application/json", ...extraHeaders };
      if (authMode === "merchant" && merchantToken) headers["Authorization"] = `Bearer ${merchantToken}`;
      else if (authMode === "portal" && portalToken) headers["Authorization"] = `Bearer ${portalToken}`;
      else if (authMode === "apikey") {
        if (clientId) headers["X-Client-ID"] = clientId;
        if (secretKey) headers["X-Secret-Key"] = secretKey;
      }
      const options: RequestInit = { method, headers };
      if (method !== "GET" && method !== "DELETE" && body.trim()) options.body = body;
      const url = `${API_URL}${path}`;
      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });
      let resBody: string;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) { resBody = JSON.stringify(await res.json(), null, 2); }
      else { resBody = await res.text(); }
      if (path.includes("/login/") && res.ok) {
        try {
          const parsed = JSON.parse(resBody);
          if (parsed.access) {
            if (path.includes("/merchant/")) setMerchantToken(parsed.access);
            else if (path.includes("/portal/")) setPortalToken(parsed.access);
          }
        } catch { /* ignore */ }
      }
      setResponse({ status: res.status, statusText: res.statusText, headers: resHeaders, body: resBody, time: elapsed });
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - start);
      setError(`Request failed after ${elapsed}ms: ${err instanceof Error ? err.message : String(err)}`);
    } finally { setLoading(false); }
  }, [method, path, headersText, body, authMode, merchantToken, portalToken, clientId, secretKey]);

  function loadPreset(preset: Preset) {
    setActiveTab("rest");
    setMethod(preset.method);
    setPath(preset.path);
    setBody(preset.body || "");
    setAuthMode(preset.auth || "none");
    setHeadersText("{}");
  }

  /* ─── WebSocket Handlers ──────────────────────────── */
  function addLog(direction: WsLogEntry["direction"], data: string) {
    setWsLog((prev) => [...prev, { id: ++logIdRef.current, direction, data, timestamp: new Date() }]);
  }

  function wsConnect() {
    if (wsRef.current) wsRef.current.close();
    setWsConnecting(true);
    setWsLog([]);
    logIdRef.current = 0;
    setWsSessionToken("");

    let params: Record<string, string> = {};
    try { params = JSON.parse(wsParams); } catch { /* ignore */ }

    const query = new URLSearchParams(params).toString();
    const fullUrl = `${WS_URL}${wsPath}${query ? `?${query}` : ""}`;

    addLog("system", `Connecting to ${fullUrl}`);

    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setWsConnecting(false);
      addLog("system", "Connected");
    };

    ws.onmessage = (event) => {
      let display = event.data;
      try {
        const parsed = JSON.parse(event.data);
        display = JSON.stringify(parsed, null, 2);
        // Capture session token
        if (parsed.type === "session" && parsed.session_token) {
          setWsSessionToken(parsed.session_token);
        }
      } catch { /* not json */ }
      addLog("received", display);
    };

    ws.onclose = (event) => {
      setWsConnected(false);
      setWsConnecting(false);
      addLog("system", `Disconnected (code: ${event.code}${event.reason ? `, reason: ${event.reason}` : ""})`);
      wsRef.current = null;
    };

    ws.onerror = () => {
      addLog("system", "Connection error");
    };
  }

  function wsDisconnect() {
    wsRef.current?.close();
  }

  function wsSend() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(wsMessage);
    let display = wsMessage;
    try { display = JSON.stringify(JSON.parse(wsMessage), null, 2); } catch { /* not json */ }
    addLog("sent", display);
  }

  function loadWsPreset(preset: WsPreset) {
    setActiveTab("websocket");
    setWsPath(preset.path);
    setWsParams(JSON.stringify(preset.queryParams, null, 2));
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { wsRef.current?.close(); };
  }, []);

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              ShopAgent
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-sm font-medium text-gray-400">API Playground</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              <button
                onClick={() => setActiveTab("rest")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === "rest" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                REST
              </button>
              <button
                onClick={() => setActiveTab("websocket")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${activeTab === "websocket" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                WebSocket
                {wsConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {API_URL}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          {/* REST Presets */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            REST Endpoints
          </h3>
          <div className="space-y-1 mb-6">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => loadPreset(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition group flex items-center gap-2"
              >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${METHOD_COLORS[p.method]}`}>
                  {p.method}
                </span>
                <span className="text-gray-300 group-hover:text-white truncate">{p.name}</span>
              </button>
            ))}
          </div>

          {/* WebSocket Presets */}
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            WebSocket Endpoints
          </h3>
          <div className="space-y-1">
            {WS_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => loadWsPreset(p)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition group flex items-start gap-2"
              >
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-teal-100 text-teal-700 border-teal-300 flex-shrink-0 mt-0.5">
                  WS
                </span>
                <div className="min-w-0">
                  <span className="text-gray-300 group-hover:text-white block truncate">{p.name}</span>
                  <span className="text-[10px] text-gray-600 block truncate">{p.description}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-4">

          {/* ═══ REST Tab ═══ */}
          {activeTab === "rest" && (
            <>
              {/* URL Bar */}
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                  className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {METHODS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/api/..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button
                  onClick={send}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>

              {/* Auth & Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Authentication</h4>
                  <select
                    value={authMode}
                    onChange={(e) => setAuthMode(e.target.value as typeof authMode)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="merchant">Merchant JWT</option>
                    <option value="portal">Portal JWT</option>
                    <option value="apikey">API Key (X-Client-ID / X-Secret-Key)</option>
                  </select>
                  {authMode === "merchant" && (
                    <input type="text" value={merchantToken} onChange={(e) => setMerchantToken(e.target.value)}
                      placeholder="Bearer token (auto-filled on login)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                  {authMode === "portal" && (
                    <input type="text" value={portalToken} onChange={(e) => setPortalToken(e.target.value)}
                      placeholder="Bearer token (auto-filled on login)"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                  {authMode === "apikey" && (
                    <div className="space-y-2">
                      <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="X-Client-ID"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="X-Secret-Key"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}
                  {authMode === "none" && <p className="text-xs text-gray-600">Tip: Login via a preset — tokens are saved automatically.</p>}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Extra Headers (JSON)</h4>
                  <textarea value={headersText} onChange={(e) => setHeadersText(e.target.value)} rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder='{"X-Custom": "value"}' />
                </div>
              </div>

              {/* Body */}
              {method !== "GET" && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Request Body (JSON)</h4>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder='{"key": "value"}' />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-sm text-red-300">{error}</div>
              )}

              {/* Response */}
              {response && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900/80">
                    <StatusBadge status={response.status} />
                    <span className="text-sm text-gray-400">{response.statusText}</span>
                    <span className="text-xs text-gray-600 ml-auto">{response.time}ms</span>
                  </div>
                  <details className="border-b border-gray-800">
                    <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                      Response Headers ({Object.keys(response.headers).length})
                    </summary>
                    <div className="px-4 pb-3">
                      {Object.entries(response.headers).map(([k, v]) => (
                        <div key={k} className="text-xs font-mono">
                          <span className="text-blue-400">{k}</span>
                          <span className="text-gray-600">: </span>
                          <span className="text-gray-400">{v}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                  <div className="relative">
                    <button onClick={() => navigator.clipboard.writeText(response.body)}
                      className="absolute top-3 right-3 px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition">
                      Copy
                    </button>
                    <pre className="px-4 py-4 text-sm font-mono text-gray-300 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed whitespace-pre-wrap">
                      {response.body}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ WebSocket Tab ═══ */}
          {activeTab === "websocket" && (
            <>
              {/* Connection Bar */}
              <div className="flex gap-2">
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-bold text-teal-400 flex-shrink-0">
                  WS
                </div>
                <input
                  type="text"
                  value={wsPath}
                  onChange={(e) => setWsPath(e.target.value)}
                  placeholder="/ws/agent/"
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={wsConnected}
                />
                {!wsConnected ? (
                  <button
                    onClick={wsConnect}
                    disabled={wsConnecting}
                    className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
                  >
                    {wsConnecting ? "Connecting..." : "Connect"}
                  </button>
                ) : (
                  <button
                    onClick={wsDisconnect}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {/* Connection Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Query Params */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Query Parameters (JSON)
                  </h4>
                  <textarea
                    value={wsParams}
                    onChange={(e) => setWsParams(e.target.value)}
                    rows={5}
                    disabled={wsConnected}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
                    placeholder='{"client_id": "...", "secret_key": "...", "user_id": "..."}'
                  />
                  <p className="text-[10px] text-gray-600 mt-2">
                    For API key auth: client_id, secret_key, user_id (required), display_name, email
                  </p>
                </div>

                {/* Connection Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Connection Info
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${wsConnected ? "text-green-400" : "text-gray-500"}`}>
                        <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
                        {wsConnecting ? "Connecting..." : wsConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">URL:</span>
                      <span className="text-xs font-mono text-gray-400 truncate">{WS_URL}{wsPath}</span>
                    </div>
                    {wsSessionToken && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Session:</span>
                        <span className="text-xs font-mono text-teal-400 truncate">{wsSessionToken}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(wsSessionToken)}
                          className="text-[10px] text-gray-600 hover:text-gray-400 transition"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                    {(() => {
                      let params: Record<string, string> = {};
                      try { params = JSON.parse(wsParams); } catch { /* */ }
                      const hasApiKey = !!(params.client_id && params.secret_key && params.user_id);
                      return (
                        <div className={`flex items-center gap-2 mt-1 ${hasApiKey ? "" : ""}`}>
                          <span className="text-xs text-gray-500">Auth:</span>
                          {hasApiKey ? (
                            <span className="text-xs text-green-400 font-medium">API Key (sessions linked to company)</span>
                          ) : (
                            <span className="text-xs text-yellow-400 font-medium">Anonymous — chat history API won&apos;t work</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Quick message templates */}
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">
                    Quick Messages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '{"message": "Show me some shoes"}',
                      '{"message": "What products do you have?"}',
                      '{"message": "Find me a watch under $500"}',
                      '{"message": "Add to cart"}',
                    ].map((msg) => (
                      <button
                        key={msg}
                        onClick={() => setWsMessage(msg)}
                        className="px-2 py-1 text-[10px] bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-white hover:border-gray-600 transition truncate max-w-full"
                      >
                        {JSON.parse(msg).message}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message Log */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">
                    Message Log ({wsLog.length})
                  </h4>
                  <button
                    onClick={() => { setWsLog([]); logIdRef.current = 0; }}
                    className="text-[10px] text-gray-600 hover:text-gray-400 transition"
                  >
                    Clear
                  </button>
                </div>
                <div className="h-[400px] overflow-y-auto px-4 py-3 space-y-2">
                  {wsLog.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-gray-600">
                      {wsConnected ? "Connected — send a message to start" : "Connect to a WebSocket endpoint to begin"}
                    </div>
                  )}
                  {wsLog.map((entry) => (
                    <div key={entry.id} className={`flex gap-2 ${entry.direction === "system" ? "justify-center" : ""}`}>
                      {entry.direction === "system" ? (
                        <div className="text-[10px] text-gray-600 bg-gray-800/50 px-3 py-1 rounded-full">
                          {entry.data}
                          <span className="ml-2 text-gray-700">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ) : (
                        <div className={`max-w-[85%] ${entry.direction === "sent" ? "ml-auto" : ""}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold ${entry.direction === "sent" ? "text-blue-400" : "text-green-400"}`}>
                              {entry.direction === "sent" ? "SENT" : "RECEIVED"}
                            </span>
                            <span className="text-[10px] text-gray-700">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className={`text-xs font-mono p-3 rounded-lg whitespace-pre-wrap break-all ${
                            entry.direction === "sent"
                              ? "bg-blue-950/30 border border-blue-900/50 text-blue-200"
                              : "bg-green-950/30 border border-green-900/50 text-green-200"
                          }`}>
                            {entry.data}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={wsLogEndRef} />
                </div>
              </div>

              {/* Send Message */}
              <div className="flex gap-2">
                <textarea
                  value={wsMessage}
                  onChange={(e) => setWsMessage(e.target.value)}
                  rows={2}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder='{"message": "Hello"}'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      wsSend();
                    }
                  }}
                />
                <button
                  onClick={wsSend}
                  disabled={!wsConnected}
                  className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold px-6 rounded-lg text-sm transition self-end py-2.5"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
