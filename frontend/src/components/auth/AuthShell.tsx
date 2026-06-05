import Link from "next/link";
import { LogoMark } from "@/components/Logo";

/**
 * Auth layout: a full-bleed emerald backdrop with a centered frosted card, the
 * brand above it and feature chips below. Shared by every login/signup screen so
 * they read as one product — and deliberately different from both a plain
 * centered card and a side-by-side split. Presentational only: the page that
 * uses it owns all form state and handlers.
 */
export function AuthShell({
  brand = "ShopAgent",
  title,
  subtitle,
  points = [],
  children,
  footer,
}: {
  brand?: string;
  title: string;
  subtitle?: string;
  points?: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <LogoMark className="h-7 w-7" />
            </span>
            <span className="text-xl font-bold">{brand}</span>
          </Link>
        </div>

        {/* Frosted form card */}
        <div className="rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}

          <div className="mt-6">{children}</div>

          {footer && (
            <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
              {footer}
            </div>
          )}
        </div>

        {/* Feature chips */}
        {points.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-white/85">
            {points.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-white/70" />
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
