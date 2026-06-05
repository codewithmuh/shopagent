import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — ShopAgent",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              ShopAgent
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-400 mt-2">Last updated: March 2, 2026</p>

        <div className="mt-10 prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the ShopAgent platform (&quot;Service&quot;), you agree to be bound by these
              Terms &amp; Conditions. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Description of Service</h2>
            <p>
              ShopAgent is an AI-powered shopping agent platform that enables companies to integrate conversational
              commerce into their applications. The Service provides APIs for product discovery, AI-assisted shopping,
              and webhook-based payment processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. User Accounts</h2>
            <p>
              To use the platform, companies must register and obtain API credentials. You are responsible for
              maintaining the security of your API keys and all activity under your account. You agree to provide
              accurate information and update it as necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Merchant Accounts</h2>
            <p>
              Merchants must register with valid business information. By listing products on the platform, merchants
              agree to fulfill orders accurately and in a timely manner. Merchants are responsible for maintaining
              accurate inventory and product descriptions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Purchases &amp; Payments</h2>
            <p>
              Payments are processed via webhook integrations with your company&apos;s payment system.
              By initiating a purchase through the agent, balance checks and charges are handled via secure
              webhook callbacks. Inventory is locked at the time of purchase to prevent overselling.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. AI Agent Disclaimer</h2>
            <p>
              The ShopAgent AI agent provides shopping assistance based on available product data. While we strive for
              accuracy, the AI may occasionally provide incomplete or imprecise information. Product details,
              availability, and pricing are subject to change. Always review order details before confirming a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Intellectual Property</h2>
            <p>
              All content, branding, and technology on the platform are the property of ShopAgent or its
              licensors. You may not reproduce, distribute, or create derivative works without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
              indirect, incidental, or consequential damages arising from your use of the platform, including but not
              limited to transaction failures, payment issues, or AI-generated recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent
              activity. You may discontinue use of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes constitutes
              acceptance of the revised terms. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <Link href="/contact" className="text-emerald-600 hover:underline">our contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 ShopAgent. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-700 transition">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-gray-700 transition">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
