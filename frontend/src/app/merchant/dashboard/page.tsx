"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getMerchantDashboardStats, updateMerchantProfile } from "@/lib/api";

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", currency: "USD", symbol: "$" },
  { code: "GB", label: "United Kingdom", currency: "GBP", symbol: "\u00a3" },
  { code: "EU", label: "Europe", currency: "EUR", symbol: "\u20ac" },
  { code: "AE", label: "UAE", currency: "AED", symbol: "AED" },
  { code: "SA", label: "Saudi Arabia", currency: "SAR", symbol: "SAR" },
  { code: "PK", label: "Pakistan", currency: "PKR", symbol: "Rs" },
  { code: "IN", label: "India", currency: "INR", symbol: "\u20b9" },
  { code: "JP", label: "Japan", currency: "JPY", symbol: "\u00a5" },
  { code: "CN", label: "China", currency: "CNY", symbol: "\u00a5" },
  { code: "AU", label: "Australia", currency: "AUD", symbol: "A$" },
  { code: "CA", label: "Canada", currency: "CAD", symbol: "C$" },
];

function getCurrencySymbol(currency: string): string {
  const match = COUNTRY_OPTIONS.find((c) => c.currency === currency);
  return match?.symbol || currency;
}

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_orders: number;
  revenue: number;
  country: string;
  currency: string;
}

export default function MerchantDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [merchantName, setMerchantName] = useState("");
  const [country, setCountry] = useState("US");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const stored = localStorage.getItem("merchant_data");
      if (stored) {
        const m = JSON.parse(stored);
        setMerchantName(m.business_name || "");
        if (m.country) setCountry(m.country);
      }

      const data = await getMerchantDashboardStats();
      setStats(data);
      if (data.country) setCountry(data.country);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    setSaving(true);
    try {
      const updated = await updateMerchantProfile({ country: newCountry });
      // Update localStorage
      const stored = localStorage.getItem("merchant_data");
      if (stored) {
        const m = JSON.parse(stored);
        m.country = updated.country;
        m.currency = updated.currency;
        localStorage.setItem("merchant_data", JSON.stringify(m));
      }
      // Refresh stats to get updated currency
      const data = await getMerchantDashboardStats();
      setStats(data);
    } catch {
      // revert on error
      if (stats) setCountry(stats.country);
    } finally {
      setSaving(false);
    }
  }

  const currencySymbol = getCurrencySymbol(stats?.currency || "USD");

  const STAT_CARDS = [
    {
      label: "Total Products",
      value: stats?.total_products ?? 0,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        </svg>
      ),
    },
    {
      label: "Active Products",
      value: stats?.active_products ?? 0,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "Total Orders",
      value: stats?.total_orders ?? 0,
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
      label: "Revenue",
      value: `${currencySymbol} ${(stats?.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: "text-teal-600",
      bg: "bg-teal-50",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
  ];

  const quickLinks = [
    { href: "/merchant/products", label: "View Products", description: "Browse your product catalog" },
    { href: "/merchant/orders", label: "View Orders", description: "Track customer orders" },
    { href: "/merchant/connections", label: "Store Connections", description: "Manage Shopify integrations" },
  ];

  const currentCountry = COUNTRY_OPTIONS.find((c) => c.code === country);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? (
              <span className="inline-block w-64 h-7 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              `Welcome back, ${merchantName}`
            )}
          </h1>
          <p className="text-gray-500 mt-0.5">
            Here&apos;s an overview of your store
          </p>
        </div>

        {/* Country Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 px-3 py-2 flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              disabled={saving || loading}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer disabled:opacity-50 pr-1"
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.currency})
                </option>
              ))}
            </select>
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
          {currentCountry && (
            <span className="text-xs text-gray-400 hidden sm:block">
              {currentCountry.currency}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div
                className={`w-9 h-9 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-bold mt-3 text-gray-900">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-gray-200 rounded-lg animate-pulse" />
              ) : typeof card.value === "number" ? (
                card.value.toLocaleString()
              ) : (
                card.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition group"
            >
              <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition">
                {link.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
