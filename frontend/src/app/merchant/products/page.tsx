"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getMerchantProducts } from "@/lib/api";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", GBP: "\u00a3", EUR: "\u20ac", AED: "AED", SAR: "SAR",
  PKR: "Rs", INR: "\u20b9", JPY: "\u00a5", CNY: "\u00a5", AUD: "A$", CAD: "C$",
};

function currencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

// Product images can be plain URL strings (seed data) or rich objects with a
// `src` (Shopify sync). Normalize either shape to a URL string.
function imageUrl(img: string | { src?: string } | undefined): string | null {
  if (!img) return null;
  return typeof img === "string" ? img : img.src ?? null;
}

interface Variant {
  id: string;
  title: string;
  price: string;
  currency: string;
  sku: string;
  available_qty: number;
}

interface Product {
  id: string;
  title: string;
  description: string;
  images: (string | { src?: string })[];
  category: string;
  is_active: boolean;
  variants: Variant[];
  created_at: string;
}

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async (page: number, append = false) => {
    if (append) setLoadingMore(true);
    try {
      const data = await getMerchantProducts(page);
      const results = data.results || data || [];
      setProducts((prev) => (append ? [...prev, ...results] : results));
      setTotalCount(data.count ?? results.length);
      setHasMore(!!data.next);
      pageRef.current = page;
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchProducts(pageRef.current + 1, true);
        }
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchProducts]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-0.5">
            {loading
              ? "Loading..."
              : `${totalCount} product${totalCount !== 1 ? "s" : ""} in your catalog`}
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-square bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="w-1/2 h-3 bg-gray-200 rounded" />
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="mt-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">No products yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect your Shopify store to sync products automatically.
          </p>
          <Link
            href="/merchant/connections"
            className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition"
          >
            Connect Store
          </Link>
        </div>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
              const minPrice = product.variants.length > 0
                ? Math.min(...product.variants.map((v) => parseFloat(v.price)))
                : 0;
              const productCurrency = product.variants[0]?.currency || "USD";
              const totalStock = product.variants.reduce(
                (sum, v) => sum + v.available_qty,
                0
              );

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {imageUrl(product.images?.[0]) ? (
                      <img
                        src={imageUrl(product.images?.[0])!}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                    {/* Status badge */}
                    <span
                      className={`absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full backdrop-blur-sm ${
                        product.is_active
                          ? "bg-green-500/90 text-white"
                          : "bg-gray-800/70 text-gray-200"
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          product.is_active ? "bg-white" : "bg-gray-400"
                        }`}
                      />
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition">
                      {product.title}
                    </h3>
                    {product.category && (
                      <span className="inline-block mt-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-bold text-emerald-600">
                        {currencySymbol(productCurrency)} {minPrice.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {totalStock} in stock
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel + loading indicator */}
          <div ref={sentinelRef} className="mt-6 flex justify-center py-4">
            {loadingMore && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Loading more...
              </div>
            )}
            {!hasMore && !loadingMore && products.length > 0 && (
              <p className="text-xs text-gray-400">
                Showing all {totalCount} products
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
