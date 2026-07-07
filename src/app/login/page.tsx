"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api";
import { useSettings } from "@/lib/settings";

export default function LoginPage() {
  const { login } = useAuth();
  const { logo_url, app_name, footer_text, footer_link } = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-800 via-brand-700 to-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            {logo_url ? (
              <img src={logo_url} alt="Logo" className="mb-3 h-14 w-14 rounded-2xl object-contain" />
            ) : (
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-800 text-white">
                <Building2 size={26} />
              </div>
            )}
            <h1 className="text-xl font-semibold text-slate-900">{app_name || "University Venue Booking"}</h1>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-800 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-brand-100">
          {app_name || "University Venue Booking System"}
        </p>
        <p className="mt-1 text-center text-xs text-brand-200">
          From{" "}
          <a href={footer_link || "https://dtech.co.tz/"} target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-white">
            {footer_text || "DTECH INNOVATIONS"}
          </a>
        </p>
      </div>
    </div>
  );
}
