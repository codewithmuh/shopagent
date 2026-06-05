"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PortalRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/portal/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          contact_email: form.contact_email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw data;
      }
      localStorage.setItem("portal_token", data.token);
      localStorage.setItem("portal_company", JSON.stringify(data.company));
      router.push("/portal/dashboard");
    } catch (err: unknown) {
      const apiErr = err as {
        detail?: string;
        error?: string;
        contact_email?: string[];
        name?: string[];
      };
      setError(
        apiErr.contact_email?.[0] ||
          apiErr.name?.[0] ||
          apiErr.detail ||
          apiErr.error ||
          "Registration failed"
      );
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
            Power your platform
            <br />
            with AI commerce
          </h2>
          <p className="mt-4 text-emerald-200 text-lg max-w-md">
            Register your company to get API keys, integrate the ShopAgent AI agent
            into your platform, and start processing orders in minutes.
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

          <h1 className="text-2xl font-bold text-gray-900">
            Register your company
          </h1>
          <p className="text-gray-500 mt-1">
            Get API access to the ShopAgent AI agent
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                placeholder="Acme Inc."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => update("contact_email", e.target.value)}
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
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={(e) => update("confirm_password", e.target.value)}
                required
                minLength={6}
                placeholder="Repeat your password"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 transition text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <Link
              href="/portal/login"
              className="text-emerald-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
