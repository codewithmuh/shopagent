"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DemoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // For the demo, we just store the user in localStorage.
      // The WebSocket connection handles user creation on the backend.
      const demoUser = {
        email: email.trim().toLowerCase(),
        display_name: email.trim().split("@")[0],
      };
      localStorage.setItem("demo_user", JSON.stringify(demoUser));
      router.push("/demo/chat");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-2xl font-bold shadow-lg shadow-emerald-500/25 mb-4">
            A
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Acme</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to chat with our AI shopping assistant
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-semibold rounded-full border border-emerald-100">
            Powered by ShopAgent
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/demo/signup" className="text-emerald-600 font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          This is a demo storefront. No real payments are processed.
        </p>
      </div>
    </div>
  );
}
