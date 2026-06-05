"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

type DemoUser = {
  email: string;
  display_name: string;
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("demo_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // ignore malformed data
      }
    }
    setLoaded(true);
  }, []);

  // Auth guard: redirect to login if no user and not on auth pages
  useEffect(() => {
    if (!loaded) return;
    const isAuthPage = pathname === "/demo/login" || pathname === "/demo/signup";
    if (!user && !isAuthPage) {
      router.replace("/demo/login");
    }
  }, [loaded, user, pathname, router]);

  function handleLogout() {
    localStorage.removeItem("demo_user");
    setUser(null);
    router.push("/demo/login");
  }

  // Don't render layout chrome on auth pages
  const isAuthPage = pathname === "/demo/login" || pathname === "/demo/signup";
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show nothing while checking auth
  if (!loaded || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* ── Top Navigation Bar ─────────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center justify-between z-20">
        {/* Left: Logo + Badge */}
        <div className="flex items-center gap-3">
          <Link href="/demo/chat" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              K
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline">
              Acme
            </span>
          </Link>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-semibold rounded-full border border-emerald-100">
            Demo Portal
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/demo/chat"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              pathname === "/demo/chat"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Chat
          </Link>
          <Link
            href="/demo/orders"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              pathname === "/demo/orders"
                ? "bg-emerald-50 text-emerald-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Orders
          </Link>
        </nav>

        {/* Right: User + Logout */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user.display_name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-700 max-w-[160px] truncate">
              {user.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1"
            title="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile Navigation ─────────────────────────────────── */}
      <div className="sm:hidden flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-100">
        <Link
          href="/demo/chat"
          className={`flex-1 text-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            pathname === "/demo/chat"
              ? "bg-emerald-50 text-emerald-700"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Chat
        </Link>
        <Link
          href="/demo/orders"
          className={`flex-1 text-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            pathname === "/demo/orders"
              ? "bg-emerald-50 text-emerald-700"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Orders
        </Link>
      </div>

      {/* ── Page Content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
