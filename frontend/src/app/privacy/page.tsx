import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — ShopAgent",
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mt-2">Last updated: March 2, 2026</p>

        <div className="mt-10 prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Information We Collect</h2>
            <p>We collect the following types of information when you use our Service:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Company Information:</strong> Company name, contact email, and API credentials for platform access.</li>
              <li><strong>User Identifiers:</strong> External user IDs provided by integrating companies to identify end users.</li>
              <li><strong>Email Address:</strong> If provided for company accounts or demo users.</li>
              <li><strong>Chat Conversations:</strong> Messages exchanged with the ShopAgent AI agent to provide personalized shopping assistance.</li>
              <li><strong>Transaction Data:</strong> Order history and purchase amounts.</li>
              <li><strong>API Usage Data:</strong> Request logs, endpoint usage, and response metadata for company accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>To provide and improve the AI shopping assistant experience</li>
              <li>To process and fulfill purchase transactions</li>
              <li>To maintain conversation context for better recommendations</li>
              <li>To manage merchant accounts and product listings</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To communicate important updates about your orders or account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. AI &amp; Chat Data</h2>
            <p>
              Your conversations with the ShopAgent AI agent are stored to maintain session context and provide a
              continuous shopping experience. Chat data is processed by third-party AI services (Anthropic Claude API)
              to generate responses. We do not use your conversations for advertising purposes. Chat sessions expire
              after 5 days of inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>Integrating Companies:</strong> Order details and webhook payloads necessary to process payments</li>
              <li><strong>AI Providers:</strong> Conversation data sent to Anthropic for AI processing</li>
              <li><strong>Merchants:</strong> Order details necessary to fulfill purchases</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. Shopify access tokens are
              encrypted at rest. However, no method of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Cookies &amp; Local Storage</h2>
            <p>
              We use browser local storage to maintain your session token and user preferences. This allows your
              chat history to persist across page reloads. You can clear this data at any time through your browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Start a new chat session at any time to reset conversation history</li>
              <li>Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Data Retention</h2>
            <p>
              Chat sessions are retained for 5 days after last activity. Order records are retained for compliance
              and dispute resolution purposes. Merchant account data is retained as long as the account is active.
              You may request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for users under the age of 18. We do not knowingly collect personal
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant changes
              by posting a notice on the platform. Continued use constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">11. Contact Us</h2>
            <p>
              For privacy-related inquiries, please visit our{" "}
              <Link href="/contact" className="text-emerald-600 hover:underline">contact page</Link>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 ShopAgent. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-700 transition">Terms &amp; Conditions</Link>
            <Link href="/contact" className="hover:text-gray-700 transition">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
