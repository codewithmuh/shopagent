"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would POST to an API
    setSubmitted(true);
  }

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
        <div className="grid md:grid-cols-2 gap-16">
          {/* Left — info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Contact Us</h1>
            <p className="text-gray-500 mt-3 leading-relaxed">
              Have questions, feedback, or need support? We&apos;d love to hear from you.
              Fill out the form and our team will get back to you within 24 hours.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <a href="mailto:contact@codewithmuh.com" className="text-sm text-emerald-600 hover:underline mt-0.5 inline-block">contact@codewithmuh.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Live Chat</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Chat with{" "}
                    <Link href="/demo/chat" className="text-emerald-600 hover:underline">Leo</Link>{" "}
                    for instant help
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Follow CodeWithMuh</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href="https://github.com/codewithmuh/shopagent" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">GitHub</a>
                    {" · "}
                    <a href="https://youtube.com/@codewithmuh" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">YouTube</a>
                    {" · "}
                    <a href="https://www.linkedin.com/in/muhammad-rashid-daha/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">LinkedIn</a>
                    {" · "}
                    <a href="https://codewithmuh.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">codewithmuh.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-sm text-emerald-600 hover:underline font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-gray-700"
                  >
                    <option value="">Select a topic</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="merchant">Merchant Partnership</option>
                    <option value="billing">Billing &amp; Payments</option>
                    <option value="privacy">Privacy &amp; Data</option>
                    <option value="feedback">Feedback &amp; Suggestions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-gray-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition text-sm"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 px-6 py-8 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 ShopAgent. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-gray-700 transition">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
