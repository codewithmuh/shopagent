"use client";

import { useEffect, useState, useCallback } from "react";
import { getMerchantConnections, connectShopify } from "@/lib/api";

interface Connection {
  id: string;
  source_type: "SHOPIFY" | "MANUAL";
  shop_domain: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export default function MerchantConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect form
  const [shopDomain, setShopDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");

  const fetchConnections = useCallback(async () => {
    try {
      const data = await getMerchantConnections();
      setConnections(data.results || data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnectError("");
    setConnectSuccess("");
    setConnecting(true);

    try {
      await connectShopify({
        shop_domain: shopDomain,
        admin_access_token: accessToken,
      });
      setConnectSuccess("Store connected successfully! Products are syncing.");
      setShopDomain("");
      setAccessToken("");
      fetchConnections();
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      // Handle field-level validation errors (e.g. { shop_domain: ["..."], admin_access_token: ["..."] })
      const fieldErrors = ["shop_domain", "admin_access_token"]
        .map((f) => {
          const v = error?.[f];
          return Array.isArray(v) ? v.join(" ") : typeof v === "string" ? v : "";
        })
        .filter(Boolean)
        .join(" ");
      setConnectError(
        fieldErrors ||
        (typeof error?.error === "string" ? error.error : "") ||
        (typeof error?.detail === "string" ? error.detail : "") ||
        "Failed to connect store."
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Store Connections</h1>
      <p className="text-gray-500 mt-0.5">
        Manage your connected stores and sync products
      </p>

      {/* Connected stores */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Connected Stores</h2>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-4 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="space-y-2 flex-1">
                    <div className="w-40 h-4 bg-gray-200 rounded" />
                    <div className="w-24 h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && connections.length === 0 && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              No stores connected yet. Connect your Shopify store below.
            </p>
          </div>
        )}

        {/* Connections list */}
        {!loading && connections.length > 0 && (
          <div className="mt-4 space-y-3">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4"
              >
                {/* Shopify icon */}
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conn.shop_domain}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md font-medium">
                      {conn.source_type}
                    </span>
                    {conn.last_synced_at && (
                      <span>
                        Last synced: {new Date(conn.last_synced_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                    conn.is_active
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      conn.is_active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {conn.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect new store */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Connect Shopify Store
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your Shopify store domain and admin access token to sync products
        </p>

        {connectError && (
          <div className="mt-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {connectError}
          </div>
        )}
        {connectSuccess && (
          <div className="mt-4 bg-green-50 border border-green-100 text-green-700 text-sm rounded-xl px-4 py-3">
            {connectSuccess}
          </div>
        )}

        <form onSubmit={handleConnect} className="mt-4 bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Domain
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              Your Shopify store URL — found in your browser address bar when logged into Shopify admin
            </p>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin API Access Token
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              Starts with <span className="font-mono">shpat_</span> — generate one in Shopify Admin &rarr; Settings &rarr; Apps &rarr; Develop apps
            </p>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="shpat_xxxxxxxxxxxxxxxxxx"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={connecting}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {connecting ? "Connecting..." : "Connect Store"}
          </button>
        </form>
      </div>
    </div>
  );
}
