import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopAgent — AI Shopping Agent Platform",
  description:
    "Add AI-powered shopping to your app. ShopAgent provides voice-enabled product search, recommendations, and checkout via a simple WebSocket API.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
