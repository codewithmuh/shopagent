"use client";

import { useEffect, useState, useCallback } from "react";
import { getMerchantOrders } from "@/lib/api";

interface Order {
  id: string;
  product_title: string;
  variant_title: string;
  qty: number;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  CREATED: "bg-blue-100 text-blue-700",
  INVENTORY_LOCKED: "bg-yellow-100 text-yellow-700",
  BALANCE_CHECK_PENDING: "bg-orange-100 text-orange-700",
  PAYMENT_PENDING: "bg-orange-100 text-orange-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function MerchantOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getMerchantOrders();
      setOrders(data.results || data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      <p className="text-gray-500 mt-0.5">
        {loading
          ? "Loading..."
          : `${orders.length} order${orders.length !== 1 ? "s" : ""} total`}
      </p>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-6 animate-pulse">
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-40 h-4 bg-gray-200 rounded" />
                <div className="w-12 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-16 h-5 bg-gray-200 rounded-full" />
                <div className="w-24 h-4 bg-gray-200 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="mt-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No orders yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Orders will appear here when customers make purchases through the AI agent.
          </p>
        </div>
      )}

      {/* Orders table */}
      {!loading && orders.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="col-span-2">Order ID</div>
            <div className="col-span-3">Product</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 transition text-sm"
              >
                <div className="col-span-2">
                  <span className="font-mono text-xs text-gray-600">
                    {order.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {order.product_title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.variant_title}
                  </p>
                </div>
                <div className="col-span-1 text-gray-700">{order.qty}</div>
                <div className="col-span-2 font-medium text-gray-900">
                  {order.currency} {order.amount}
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="col-span-2 text-right text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
