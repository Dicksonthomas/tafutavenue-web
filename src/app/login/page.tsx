"use client";

import { useEffect, useRef, useState } from "react";
import { Building2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api";
import { useSettings, getReadableTextColor, DEFAULT_LOGIN_BACKGROUND_COLOR } from "@/lib/settings";

export default function LoginPage() {
  const { login } = useAuth();
  const { logo_url, app_name, support_phone, footer_text, footer_link, login_background_color, loading: settingsLoading } = useSettings();
  const loginBg = login_background_color || DEFAULT_LOGIN_BACKGROUND_COLOR;
  const loginText = getReadableTextColor(loginBg);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  function showError(message: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(message);
    errorTimerRef.current = setTimeout(() => setError(null), 60000);
  }

  function dismissError() {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dismissError();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      showError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (settingsLoading) {
    // Wait for the logo/app name/background color to arrive before painting
    // anything branded, instead of flashing the fallback icon/text first and
    // then swapping to the real ones once /settings resolves.
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ backgroundColor: loginBg }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 hidden text-center sm:block">
          <h2 className="text-lg font-semibold" style={{ color: loginText }}>
            Welcome to {app_name || "University Venue Booking"}
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: loginText, opacity: 0.85 }}>
            Sign in with the email and password given to you by your Admin to search venues, make bookings, and track their status.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            {/* Logo size: change h-36 w-36 below (both the <img> and the fallback box) to make it bigger/smaller. Each Tailwind step is 0.25rem (4px), e.g. h-40 = 160px, h-44 = 176px. */}
            {logo_url ? (
              <img src={logo_url} alt="Logo" className="mb-3 h-36 w-36 rounded-2xl object-contain" />
            ) : (
              <div className="mb-3 flex h-36 w-36 items-center justify-center rounded-2xl" style={{ backgroundColor: loginBg, color: loginText }}>
                <Building2 size={64} />
              </div>
            )}
            <h1 className="text-xl font-semibold text-slate-900">{app_name || "University Venue Booking"}</h1>
            <p className="text-sm text-slate-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
              <span>{error}</span>
              <button type="button" onClick={dismissError} className="shrink-0 text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Username</label>
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
              className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: loginText, opacity: 0.85 }}>
          {app_name || "University Venue Booking System"}
        </p>
        {support_phone && (
          <p className="mt-1 text-center text-xs" style={{ color: loginText, opacity: 0.7 }}>
            Need help? Call {support_phone}
          </p>
        )}
        <p className="mt-1 text-center text-xs" style={{ color: loginText, opacity: 0.7 }}>
          From{" "}
          <a
            href={footer_link || "https://dtech.co.tz/"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: loginText }}
            className="font-medium underline opacity-100 hover:opacity-80"
          >
            {footer_text || "DTECH INNOVATIONS"}
          </a>
        </p>
      </div>
    </div>
  );
}
