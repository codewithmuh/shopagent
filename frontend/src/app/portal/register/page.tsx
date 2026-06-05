"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

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

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400";

  return (
    <AuthShell
      brand="ShopAgent Portal"
      title="Register your company"
      subtitle="Get API access to the ShopAgent AI agent."
      points={["Embed the agent via API", "WebSocket + webhooks", "Usage analytics"]}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/portal/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Company name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
            placeholder="Acme Inc."
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Contact email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => update("contact_email", e.target.value)}
            required
            placeholder="you@company.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required
            minLength={6}
            placeholder="Min 6 characters"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => update("confirm_password", e.target.value)}
            required
            minLength={6}
            placeholder="Repeat your password"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
