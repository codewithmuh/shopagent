"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/portal/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw data;
      }
      localStorage.setItem("portal_token", data.token);
      localStorage.setItem("portal_company", JSON.stringify(data.company));
      router.push("/portal/dashboard");
    } catch (err: unknown) {
      const apiErr = err as { detail?: string; error?: string };
      setError(apiErr.detail || apiErr.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold backdrop-blur-sm">
            S
          </div>
          <span className="text-2xl font-bold">ShopAgent Portal</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Build with ShopAgent,
            <br />
            the AI agent API
          </h2>
          <p className="mt-4 text-emerald-200 text-lg max-w-md">
            Integrate AI-powered shopping into your platform. Get API keys,
            monitor usage, and manage webhooks from your company dashboard.
          </p>
        </div>
        <p className="text-emerald-300 text-sm">Company Portal — API Platform</p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-xl font-bold">ShopAgent Portal</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your company portal</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
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

          {/* <p className="text-center text-sm text-gray-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link
              href="/portal/register"
              className="text-emerald-600 font-medium hover:underline"
            >
              Register your company
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}
