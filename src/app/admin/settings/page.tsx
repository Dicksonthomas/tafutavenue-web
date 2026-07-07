"use client";

import { useRef, useState } from "react";
import { RotateCcw, UploadCloud } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSettings, DEFAULT_LOGIN_BACKGROUND_COLOR } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import MyColorPreference from "@/components/MyColorPreference";

const BRAND_DEFAULT_COLOR = "#3db166";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const settings = useSettings();
  const [color, setColor] = useState(settings.default_color ?? BRAND_DEFAULT_COLOR);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [appName, setAppName] = useState(settings.app_name ?? "");
  const [supportPhone, setSupportPhone] = useState(settings.support_phone ?? "");
  const [footerText, setFooterText] = useState(settings.footer_text ?? "");
  const [footerLink, setFooterLink] = useState(settings.footer_link ?? "");
  const [loginBg, setLoginBg] = useState(settings.login_background_color ?? DEFAULT_LOGIN_BACKGROUND_COLOR);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [brandingSuccess, setBrandingSuccess] = useState<string | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);

  async function saveBranding(e: React.SyntheticEvent, overrideLoginBg?: string) {
    e.preventDefault();
    setBrandingError(null);
    setBrandingSuccess(null);
    setSavingBranding(true);
    try {
      const { data } = await api.post("/admin/settings", {
        app_name: appName,
        support_phone: supportPhone,
        footer_text: footerText,
        footer_link: footerLink,
        login_background_color: overrideLoginBg ?? loginBg,
      });
      if (overrideLoginBg) setLoginBg(overrideLoginBg);
      setBrandingSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setBrandingError(apiErrorMessage(err));
    } finally {
      setSavingBranding(false);
    }
  }

  function resetLoginBg(e: React.SyntheticEvent) {
    saveBranding(e, DEFAULT_LOGIN_BACKGROUND_COLOR);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }

  async function saveColor(newColor: string) {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("primary_color", newColor);
      if (fileRef.current?.files?.[0]) {
        formData.append("logo", fileRef.current.files[0]);
      }
      const { data } = await api.post("/admin/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(data.message);
      setColor(newColor);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="System Settings" subtitle="Change the main color (default for all users) and the App logo." />

      <Card className="p-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

        <form onSubmit={(e) => { e.preventDefault(); saveColor(color); }} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Main System Color (Default)</label>
            <div className="flex flex-wrap items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300" />
              <input value={color} onChange={(e) => setColor(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-accent-500 focus:outline-none" />
              <button
                type="button"
                onClick={() => saveColor(BRAND_DEFAULT_COLOR)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={14} /> Restore Mzumbe Default
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">App Logo (optional)</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
                  <UploadCloud size={20} />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />
            </div>
          </div>

          <button disabled={submitting} className="w-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Save Default Settings"}
          </button>
        </form>
      </Card>

      {user?.is_super_admin && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">App Branding (Super Admin only)</h2>

          {brandingError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{brandingError}</div>}
          {brandingSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{brandingSuccess}</div>}

          <form onSubmit={saveBranding} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">App Name (shown on the Login page)</label>
              <input
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="University Venue Booking"
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Support Phone (shown to all users)</label>
              <input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="e.g. +255 700 000 000"
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Footer Text (shown on Login page and every dashboard footer)</label>
              <input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="DTECH INNOVATIONS"
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Footer Link (where the footer text points to)</label>
              <input
                type="url"
                value={footerLink}
                onChange={(e) => setFooterLink(e.target.value)}
                placeholder="https://dtech.co.tz/"
                className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Login Page Background Color (also used for the Sign In button)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input type="color" value={loginBg} onChange={(e) => setLoginBg(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300" />
                <input value={loginBg} onChange={(e) => setLoginBg(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-accent-500 focus:outline-none" />
                <button
                  type="button"
                  onClick={resetLoginBg}
                  disabled={savingBranding}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Reset to Default
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">Text on the login page automatically switches between white and dark to stay readable on this color.</p>
            </div>

            <button disabled={savingBranding} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {savingBranding ? "Saving..." : "Save Branding"}
            </button>
          </form>
        </Card>
      )}

      <MyColorPreference />
    </div>
  );
}
