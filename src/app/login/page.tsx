"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Building2, CalendarClock, KeyRound, Search, UserRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/api";
import { useSettings, getReadableTextColor, DEFAULT_LOGIN_BACKGROUND_COLOR } from "@/lib/settings";

const FEATURES = [
  { icon: Search, title: "Search Venues", description: "Find and view available venues across campus." },
  { icon: CalendarClock, title: "Make Bookings", description: "Reserve venues quickly and easily for your events." },
  { icon: BarChart3, title: "Track Bookings", description: "Monitor booking approvals and their status." },
];

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ backgroundColor: loginBg }}>
      {/* Purely decorative - soft glows, a faint building silhouette, and a
          scatter of dots to give the flat blue background some depth
          without distracting from the form. Never intercepts clicks. */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div
          className="absolute -bottom-52 -right-32 h-[520px] w-[520px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <Building2 className="absolute -bottom-16 right-10 hidden opacity-[0.08] lg:block" style={{ color: loginText }} size={320} strokeWidth={1} />
        <span className="absolute left-[55%] top-[18%] hidden h-2 w-2 rounded-full bg-white/30 lg:block" />
        <span className="absolute left-[62%] top-[65%] hidden h-1.5 w-1.5 rounded-full bg-white/20 lg:block" />
        <span className="absolute left-[50%] top-[75%] hidden h-2.5 w-2.5 rounded-full bg-white/15 lg:block" />
        <span className="absolute left-[68%] top-[30%] hidden h-1.5 w-1.5 rounded-full bg-white/20 lg:block" />
      </div>

      {/* Welcome/instructions - anchored to the left, vertically centered in
          line with the form card, independent of the form's own centering
          so the form stays dead-center on the page regardless of how much
          text lives here. Hidden on phones, where there isn't room for it
          alongside the form. */}
      <div className="absolute left-6 top-1/2 hidden max-w-md -translate-y-1/2 text-left sm:block lg:left-16">
        <p className="text-[22px] font-semibold" style={{ color: loginText, opacity: 0.9 }}>
          Welcome to
        </p>
        <h2 className="mt-1 text-4xl font-extrabold uppercase leading-[1.05] tracking-tight lg:text-6xl xl:text-7xl" style={{ color: loginText }}>
          {app_name || "University Venue Booking"}
        </h2>

        <div
          className="mt-4 h-1 w-[180px] rounded-full bg-accent-500 lg:mt-6"
          style={{ boxShadow: "0 0 16px 2px var(--color-accent-500)" }}
        />

        <p className="mt-4 max-w-md text-base leading-[1.6] lg:mt-6 lg:text-lg lg:leading-[1.7]" style={{ color: loginText, opacity: 0.85 }}>
          {app_name || "This system"} is the official platform for discovering, reserving and managing university venues. Sign in using your institutional account to continue.
        </p>

        {/* Feature list + tagline only from `lg` up - on a landscape phone
            (which lands in this `sm`-`lg` range: wide enough to trip the
            `sm:block` panel visibility above, but still short on height)
            this extra content would overflow the viewport and get clipped,
            so only show it once there's guaranteed to be real vertical room. */}
        <div className="mt-6 hidden space-y-4 lg:block">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                <f.icon size={20} style={{ color: loginText }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: loginText }}>{f.title}</p>
                <p className="mt-0.5 text-sm" style={{ color: loginText, opacity: 0.8 }}>{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 hidden text-sm font-medium text-accent-300 lg:block">Simple • Secure • Efficient</p>
      </div>

      <div className="relative w-full max-w-sm">
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
              <div className="relative">
                <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Password</label>
              <div className="relative">
                <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
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
