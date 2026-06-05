"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { demoGetUserOrders } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────
type Order = {
  id: string;
  product_title: string;
  variant_title: string;
  qty: number;
  amount: string;
  currency: string;
  status: string;
  tx_hash: string | null;
  created_at: string;
  merchant_name: string;
};

type DemoUser = {
  email: string;
  display_name: string;
};

// ─── Config ───────────────────────────────────────────────────────
const DEMO_CLIENT_ID =
  process.env.NEXT_PUBLIC_DEMO_CLIENT_ID || "shopagent_test_demo";
const DEMO_SECRET_KEY =
  process.env.NEXT_PUBLIC_DEMO_SECRET_KEY || "sk_test_demo_secret_key_for_local_development_only";

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  CREATED: "bg-blue-100 text-blue-700",
  INVENTORY_LOCKED: "bg-yellow-100 text-yellow-700",
  PAYMENT_PENDING: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
};

// ─── Main Page ────────────────────────────────────────────────────
export default function DemoOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("demo_user");
    if (!raw) {
      setLoading(false);
      return;
    }

    let demoUser: DemoUser;
    try {
      demoUser = JSON.parse(raw);
      setUser(demoUser);
    } catch {
      setLoading(false);
      return;
    }

    demoGetUserOrders(demoUser.email, DEMO_CLIENT_ID, DEMO_SECRET_KEY)
      .then((data) => {
        setOrders(Array.isArray(data) ? data : data.results || []);
      })
      .catch((err) => {
        const apiErr = err as { detail?: string; message?: string };
        setError(apiErr.detail || apiErr.message || "Failed to load orders.");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            {user && (
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            )}
          </div>
          <Link
            href="/demo/chat"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 transition"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Back to Chat
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No orders yet
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
              Chat with Leo to browse products and make your first purchase.
            </p>
            <Link
              href="/demo/chat"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">
                      {order.product_title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.variant_title} &times; {order.qty}
                      {order.merchant_name && (
                        <span className="ml-2 text-gray-400">
                          | {order.merchant_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900">
                    ${order.amount} {order.currency}
                  </span>
                  <span className="text-gray-400">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {order.tx_hash && (
                  <p className="mt-2 text-xs font-mono text-gray-400 truncate">
                    Tx: {order.tx_hash}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
