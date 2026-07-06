"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api";
import { useSettings } from "@/lib/settings";

export default function LoginPage() {
  const { login } = useAuth();
  const { logo_url } = useSettings();
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {logo_url ? (
            <img src={logo_url} alt="Logo" className="mb-3 h-11 w-11 rounded-xl object-contain" />
          ) : (
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
              <Building2 size={22} />
            </div>
          )}
          <h1 className="text-lg font-semibold text-slate-900">University Venue Booking</h1>
          <p className="text-sm text-slate-500">Ingia kwenye akaunti yako</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {submitting ? "Inaingia..." : "Ingia"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
