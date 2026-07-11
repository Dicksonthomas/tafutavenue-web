"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DatabaseZap, RotateCcw } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  useSettings,
  deriveAccentShades,
  DEFAULT_LOGIN_BACKGROUND_COLOR,
  WEEK_DAYS,
  defaultStudyUnitHours,
  StudyUnitHours,
} from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import MyColorPreference from "@/components/MyColorPreference";
import { useReferenceData } from "@/lib/referenceData";

const BRAND_DEFAULT_COLOR = "#FF7F50";

/**
 * "00:00" as an end time means midnight (end of day), not "no duration" -
 * everywhere else in the system (BookingController, BookingModal) treats it
 * the same way, so this mirrors that instead of introducing a 3rd meaning.
 */
function durationLabel(start: string, end: string): { label: string; invalid: boolean } {
  if (!start || !end) return { label: "—", invalid: false };
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = end === "00:00" ? 24 * 60 : eh * 60 + em;
  const diff = endMin - startMin;

  if (diff <= 0) return { label: "End must be after start", invalid: true };

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return { label: [hours > 0 ? `${hours}h` : "", mins > 0 ? `${mins}m` : ""].filter(Boolean).join(" ") || "0m", invalid: false };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const isStaffAdmin = user?.admin_domain === "staff";
  const settings = useSettings();
  const [color, setColor] = useState(settings.default_color ?? BRAND_DEFAULT_COLOR);
  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(color);
  const previewShades = useMemo(
    () => (isValidHex ? deriveAccentShades(color) : null),
    [color, isValidHex]
  );
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

  const [studyUnitHours, setStudyUnitHours] = useState<StudyUnitHours>(settings.study_unit_hours ?? defaultStudyUnitHours());
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [hoursSuccess, setHoursSuccess] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  // Every field above is seeded from `settings` via useState's initial value,
  // which only runs once - if this page mounts before the /settings fetch
  // resolves, they'd be stuck on the hardcoded fallbacks forever. Sync them
  // once real values arrive.
  useEffect(() => {
    if (!settings.loading) {
      setColor(settings.default_color ?? BRAND_DEFAULT_COLOR);
      setLogoPreview(settings.logo_url);
      setAppName(settings.app_name ?? "");
      setSupportPhone(settings.support_phone ?? "");
      setFooterText(settings.footer_text ?? "");
      setFooterLink(settings.footer_link ?? "");
      setLoginBg(settings.login_background_color ?? DEFAULT_LOGIN_BACKGROUND_COLOR);
      setStudyUnitHours(settings.study_unit_hours ?? defaultStudyUnitHours());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.loading]);

  function updateDayHours(day: string, field: "start" | "end", value: string) {
    setStudyUnitHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  const hoursValidation = useMemo(() => {
    const result: Record<string, { label: string; invalid: boolean }> = {};
    for (const day of WEEK_DAYS) {
      result[day] = durationLabel(studyUnitHours[day]?.start ?? "19:00", studyUnitHours[day]?.end ?? "00:00");
    }
    return result;
  }, [studyUnitHours]);

  const hasInvalidDay = Object.values(hoursValidation).some((v) => v.invalid);

  async function saveHours(e: React.FormEvent) {
    e.preventDefault();
    setHoursError(null);
    setHoursSuccess(null);
    if (hasInvalidDay) {
      setHoursError("Fix the day(s) marked in red first - the end time must be after the start time.");
      return;
    }
    setSavingHours(true);
    try {
      const { data } = await api.post("/admin/settings", { study_unit_hours: studyUnitHours });
      setHoursSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setHoursError(apiErrorMessage(err));
    } finally {
      setSavingHours(false);
    }
  }

  function resetHours() {
    setStudyUnitHours(defaultStudyUnitHours());
  }

  const [migrateOutput, setMigrateOutput] = useState<string | null>(null);
  const [migrateError, setMigrateError] = useState<string | null>(null);
  const [runningMigrate, setRunningMigrate] = useState(false);

  async function runMigrations() {
    setMigrateError(null);
    setMigrateOutput(null);
    setRunningMigrate(true);
    try {
      const { data } = await api.post("/admin/system/migrate");
      setMigrateOutput(data.output || "Done - no pending migrations.");
    } catch (err) {
      setMigrateError(apiErrorMessage(err));
    } finally {
      setRunningMigrate(false);
    }
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

  async function resetLogo() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("reset_logo", "1");
      const { data } = await api.post("/admin/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(data.message);
      if (fileRef.current) fileRef.current.value = "";
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // CR Registration open/closed, per campus. A regular Admin only sees/can
  // toggle their own campus; a Super Admin sees and can toggle all four.
  const { campuses } = useReferenceData();
  const [closedCampuses, setClosedCampuses] = useState<string[]>(settings.cr_registration_closed_campuses ?? []);
  const [crRegError, setCrRegError] = useState<string | null>(null);
  const [crRegSuccess, setCrRegSuccess] = useState<string | null>(null);
  const [savingCrReg, setSavingCrReg] = useState(false);
  const visibleCampuses = user?.is_super_admin ? campuses : campuses.filter((c) => c.value === user?.campus);

  useEffect(() => {
    if (!settings.loading) setClosedCampuses(settings.cr_registration_closed_campuses ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.loading]);

  function toggleCampusClosed(value: string) {
    setClosedCampuses((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }

  async function saveCrRegistration(e: React.FormEvent) {
    e.preventDefault();
    setCrRegError(null);
    setCrRegSuccess(null);
    setSavingCrReg(true);
    try {
      const { data } = await api.post("/admin/settings", { cr_registration_closed_campuses: closedCampuses });
      setCrRegSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setCrRegError(apiErrorMessage(err));
    } finally {
      setSavingCrReg(false);
    }
  }

  // Marquee (scrolling announcement banner on CR/Staff dashboards) - a
  // manual on/off switch, plus an optional "show until" date after which it
  // hides itself automatically. Applies to both CR and Staff alike.
  const [marqueeEnabled, setMarqueeEnabled] = useState(settings.marquee_enabled);
  const [marqueeUntil, setMarqueeUntil] = useState(settings.marquee_until ? settings.marquee_until.slice(0, 16) : "");
  const [marqueeError, setMarqueeError] = useState<string | null>(null);
  const [marqueeSuccess, setMarqueeSuccess] = useState<string | null>(null);
  const [savingMarquee, setSavingMarquee] = useState(false);

  useEffect(() => {
    if (!settings.loading) {
      setMarqueeEnabled(settings.marquee_enabled);
      setMarqueeUntil(settings.marquee_until ? settings.marquee_until.slice(0, 16) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.loading]);

  async function saveMarquee(e: React.FormEvent) {
    e.preventDefault();
    setMarqueeError(null);
    setMarqueeSuccess(null);
    setSavingMarquee(true);
    try {
      const { data } = await api.post("/admin/settings", {
        marquee_enabled: marqueeEnabled,
        marquee_until: marqueeUntil || null,
      });
      setMarqueeSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setMarqueeError(apiErrorMessage(err));
    } finally {
      setSavingMarquee(false);
    }
  }

  // Staff Registration open window - the Staff-side equivalent of CR
  // Registration's per-campus toggle, managed by a Staff Admin instead. Each
  // campus gets its own optional [open_from, open_until] datetime window (not
  // just a date - so an Admin can close it at a specific time of day too).
  // Outside the window, the Register page disables the Staff tab for that
  // campus the same way it does for a closed CR campus.
  type StaffWindowState = { open_from: string; open_until: string };
  function buildStaffWindowState(): Record<string, StaffWindowState> {
    const windows = settings.staff_registration_windows ?? {};
    return Object.fromEntries(
      campuses.map((c) => [
        c.value,
        {
          open_from: windows[c.value]?.open_from?.slice(0, 16) ?? "",
          open_until: windows[c.value]?.open_until?.slice(0, 16) ?? "",
        },
      ])
    );
  }
  const [staffWindows, setStaffWindows] = useState<Record<string, StaffWindowState>>({});
  const [staffRegError, setStaffRegError] = useState<string | null>(null);
  const [staffRegSuccess, setStaffRegSuccess] = useState<string | null>(null);
  const [savingStaffReg, setSavingStaffReg] = useState(false);

  useEffect(() => {
    if (!settings.loading && campuses.length > 0) setStaffWindows(buildStaffWindowState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.loading, campuses.length]);

  function updateStaffWindow(campus: string, field: "open_from" | "open_until", value: string) {
    setStaffWindows((prev) => ({ ...prev, [campus]: { ...prev[campus], [field]: value } }));
  }

  async function saveStaffRegistration(e: React.FormEvent) {
    e.preventDefault();
    setStaffRegError(null);
    setStaffRegSuccess(null);
    setSavingStaffReg(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(staffWindows).map(([campus, w]) => [
          campus,
          { open_from: w.open_from || null, open_until: w.open_until || null },
        ])
      );
      const { data } = await api.post("/admin/settings", { staff_registration_windows: payload });
      setStaffRegSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setStaffRegError(apiErrorMessage(err));
    } finally {
      setSavingStaffReg(false);
    }
  }

  // Maintenance Mode - any Admin (general or Staff domain, super or not) can
  // flip this to tell ordinary CR/Staff users the system is unavailable,
  // while every Admin keeps logging in normally so they can turn it back off.
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenance_mode);
  const [maintenanceUntil, setMaintenanceUntil] = useState(settings.maintenance_until ? settings.maintenance_until.slice(0, 16) : "");
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);
  const [savingMaintenance, setSavingMaintenance] = useState(false);

  useEffect(() => {
    if (!settings.loading) {
      setMaintenanceMode(settings.maintenance_mode);
      setMaintenanceUntil(settings.maintenance_until ? settings.maintenance_until.slice(0, 16) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.loading]);

  async function saveMaintenance(e: React.FormEvent) {
    e.preventDefault();
    setMaintenanceError(null);
    setMaintenanceSuccess(null);
    setSavingMaintenance(true);
    try {
      const { data } = await api.post("/admin/settings", {
        maintenance_mode: maintenanceMode,
        maintenance_until: maintenanceUntil || null,
      });
      setMaintenanceSuccess(data.message);
      settings.refresh();
    } catch (err) {
      setMaintenanceError(apiErrorMessage(err));
    } finally {
      setSavingMaintenance(false);
    }
  }

  // Bulk-suspend every active CR (or Staff, for a Staff Admin) account on a
  // campus in one action - for an operational issue affecting that campus.
  // Reversible via the matching "Reactivate" button. Admins are never
  // affected either way, so they can always log back in to undo this.
  const suspendLabel = isStaffAdmin ? "Staff" : "CR";
  const [suspendCampusValue, setSuspendCampusValue] = useState("");
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [suspendSuccess, setSuspendSuccess] = useState<string | null>(null);
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    if (visibleCampuses.length > 0 && !suspendCampusValue) setSuspendCampusValue(visibleCampuses[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCampuses.length]);

  async function runCampusSuspend(action: "suspend-campus" | "unsuspend-campus") {
    if (!suspendCampusValue) return;
    const verb = action === "suspend-campus" ? "suspend" : "reactivate";
    if (!window.confirm(`This will ${verb} ALL ${suspendLabel} accounts on this campus. Continue?`)) return;

    setSuspendError(null);
    setSuspendSuccess(null);
    setSuspending(true);
    try {
      const { data } = await api.post(`/admin/users/${action}`, { campus: suspendCampusValue });
      setSuspendSuccess(data.message);
    } catch (err) {
      setSuspendError(apiErrorMessage(err));
    } finally {
      setSuspending(false);
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
                <RotateCcw size={14} /> Restore Default (Coral Orange)
              </button>
            </div>
            {!isValidHex && (
              <p className="mt-1 text-xs text-red-600">Enter a full 6-digit hex color (e.g. #FF7F50) to see the preview.</p>
            )}
          </div>

          {previewShades && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Preview - how this color looks before you save
              </label>
              <div className="flex flex-wrap items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-10 w-36 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white"
                    style={{ backgroundColor: previewShades[500] }}
                  >
                    <span className="h-2 w-2 rounded-full bg-white/70" /> Sidebar (active)
                  </div>
                  <span className="text-[11px] text-slate-400">Selected nav item</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    className="h-10 w-32 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    Save / Add
                  </button>
                  <span className="text-[11px] text-slate-400">Filled button</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    className="h-10 w-32 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: previewShades[700] }}
                  >
                    Save / Add
                  </button>
                  <span className="text-[11px] text-slate-400">Filled button (hover)</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className="flex h-10 items-center rounded-full px-3 text-xs font-medium"
                    style={{ backgroundColor: previewShades[50], color: previewShades[700] }}
                  >
                    Approved
                  </span>
                  <span className="text-[11px] text-slate-400">Badge / tag</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">App Logo (optional)</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain" />
              ) : (
                <img src="/default-logo.jpg" alt="Default logo" className="h-14 w-14 rounded-lg border border-slate-200 object-contain" />
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />
              <button
                type="button"
                onClick={resetLogo}
                disabled={submitting}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw size={14} /> Reset to Default Logo
              </button>
            </div>
          </div>

          <button disabled={submitting} className="w-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Save Default Settings"}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Marquee (scrolling announcement banner)</h2>
        <p className="mb-4 text-xs text-slate-500">
          Controls the scrolling banner shown at the top of every CR and Staff dashboard, listing recent
          announcements. Turn it off to hide it entirely, or set an end date/time after which it hides itself
          automatically - you can turn it back on any time.
        </p>

        {marqueeError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{marqueeError}</div>}
        {marqueeSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{marqueeSuccess}</div>}

        <form onSubmit={saveMarquee} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={marqueeEnabled} onChange={(e) => setMarqueeEnabled(e.target.checked)} />
            Show the marquee banner
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Show until (optional)</label>
            <input
              type="datetime-local"
              value={marqueeUntil}
              onChange={(e) => setMarqueeUntil(e.target.value)}
              disabled={!marqueeEnabled}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank to keep it showing until you turn it off yourself.</p>
          </div>
          <button disabled={savingMarquee} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {savingMarquee ? "Saving..." : "Save"}
          </button>
        </form>
      </Card>

      {!isStaffAdmin && (
      <>
      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Study Unit Booking Hours</h2>
        <p className="mb-4 text-xs text-slate-500">
          Per day of the week, set the window CRs are allowed to book a venue for &quot;Study Unit&quot;. <b>Start</b> is when the window opens
          (e.g. <code>19:00</code>); <b>End</b> is when it closes - use <code>00:00</code> for &quot;until midnight&quot;. A CR's booking must both
          start and finish inside this window, or it's rejected with the allowed hours shown to them.
        </p>

        {hoursError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{hoursError}</div>}
        {hoursSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{hoursSuccess}</div>}

        <form onSubmit={saveHours} className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">End</th>
                  <th className="py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {WEEK_DAYS.map((day) => {
                  const { label, invalid } = hoursValidation[day];
                  return (
                    <tr key={day} className={`border-t border-slate-100 ${invalid ? "bg-red-50/60" : ""}`}>
                      <td className="py-2 pr-4 font-medium text-slate-700">{day}</td>
                      <td className="py-2 pr-4">
                        <input
                          type="time"
                          value={studyUnitHours[day]?.start ?? "19:00"}
                          onChange={(e) => updateDayHours(day, "start", e.target.value)}
                          className={`rounded-lg border px-2 py-1.5 text-sm focus:outline-none ${invalid ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-accent-500"}`}
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <input
                          type="time"
                          value={studyUnitHours[day]?.end ?? "00:00"}
                          onChange={(e) => updateDayHours(day, "end", e.target.value)}
                          className={`rounded-lg border px-2 py-1.5 text-sm focus:outline-none ${invalid ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-accent-500"}`}
                        />
                      </td>
                      <td className={`py-2 text-xs ${invalid ? "font-medium text-red-600" : "text-slate-500"}`}>{label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={resetHours} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <RotateCcw size={14} /> Reset to Default
            </button>
            <button disabled={savingHours || hasInvalidDay} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {savingHours ? "Saving..." : "Save Hours"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">CR Registration</h2>
        <p className="mb-4 text-xs text-slate-500">
          Close CR self-registration for a campus once that campus&apos;s intake is done - the Register page then
          only shows Staff registration (or, for other campuses still open, disables just that campus with an
          explanation).
        </p>

        {crRegError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{crRegError}</div>}
        {crRegSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{crRegSuccess}</div>}

        <form onSubmit={saveCrRegistration} className="space-y-3">
          <div className="space-y-2">
            {visibleCampuses.map((c) => {
              const closed = closedCampuses.includes(c.value);
              return (
                <label key={c.value} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{c.label}</span>
                  <span className="flex items-center gap-2">
                    <span className={closed ? "text-slate-400" : "text-emerald-600"}>{closed ? "Closed" : "Open"}</span>
                    <input type="checkbox" checked={!closed} onChange={() => toggleCampusClosed(c.value)} />
                  </span>
                </label>
              );
            })}
          </div>
          <button disabled={savingCrReg} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {savingCrReg ? "Saving..." : "Save"}
          </button>
        </form>
      </Card>
      </>
      )}

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
              <label className="mb-1 block text-sm font-medium text-slate-600">Login Page &amp; Sidebar Background Color</label>
              <div className="flex flex-wrap items-center gap-3">
                <input type="color" value={loginBg} onChange={(e) => setLoginBg(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300" />
                <input value={loginBg} onChange={(e) => setLoginBg(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-accent-500 focus:outline-none" />
                <button
                  type="button"
                  onClick={resetLoginBg}
                  disabled={savingBranding}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Reset to Default (Sky Blue)
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Used for the Login page background AND the sidebar for every CR and Admin. Text on the login page automatically switches between white and dark to stay readable on this color.
              </p>
            </div>

            <button disabled={savingBranding} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {savingBranding ? "Saving..." : "Save Branding"}
            </button>
          </form>
        </Card>
      )}

      {user?.is_super_admin && (
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Database Maintenance (Super Admin only)</h2>
          <p className="mb-4 text-xs text-slate-500">
            Applies any pending database changes from the latest deployment. Use this if a feature was just
            updated and you see unexpected server errors right after a new release.
          </p>

          {migrateError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{migrateError}</div>}
          {migrateOutput && (
            <pre className="mb-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
              {migrateOutput}
            </pre>
          )}

          <button
            onClick={runMigrations}
            disabled={runningMigrate}
            className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
          >
            <DatabaseZap size={16} />
            {runningMigrate ? "Running..." : "Run Database Migrations"}
          </button>
        </Card>
      )}

      {isStaffAdmin && (
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Staff Registration</h2>
          <p className="mb-4 text-xs text-slate-500">
            Restrict Staff self-registration to a specific period per campus - e.g. only during onboarding season,
            down to the exact time of day it opens/closes. Leave both blank for a campus to keep it open
            indefinitely there. Outside its window, the Register page disables Staff registration for that campus.
          </p>

          {staffRegError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{staffRegError}</div>}
          {staffRegSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{staffRegSuccess}</div>}

          <form onSubmit={saveStaffRegistration} className="space-y-4">
            {visibleCampuses.map((c) => (
              <div key={c.value} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-medium text-slate-700">{c.label}</p>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Open from</label>
                    <input
                      type="datetime-local"
                      value={staffWindows[c.value]?.open_from ?? ""}
                      onChange={(e) => updateStaffWindow(c.value, "open_from", e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Open until</label>
                    <input
                      type="datetime-local"
                      value={staffWindows[c.value]?.open_until ?? ""}
                      onChange={(e) => updateStaffWindow(c.value, "open_until", e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button disabled={savingStaffReg} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {savingStaffReg ? "Saving..." : "Save"}
            </button>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Maintenance Mode</h2>
        <p className="mb-4 text-xs text-slate-500">
          When on, ordinary CR and Staff users are told the system is under maintenance and cannot use it. Every
          Admin (any type) can still log in and use the system as normal, so this can always be switched back off.
        </p>

        {maintenanceError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{maintenanceError}</div>}
        {maintenanceSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{maintenanceSuccess}</div>}

        <form onSubmit={saveMaintenance} className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            System is under maintenance
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Expected back until (optional, shown to users)</label>
            <input
              type="datetime-local"
              value={maintenanceUntil}
              onChange={(e) => setMaintenanceUntil(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <button disabled={savingMaintenance} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {savingMaintenance ? "Saving..." : "Save"}
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Suspend {suspendLabel} Accounts by Campus</h2>
        <p className="mb-4 text-xs text-slate-500">
          For an operational problem affecting one campus - suspends every currently-active {suspendLabel} account
          there at once, so none of them can log in until you reactivate them. Admins are never affected.
        </p>

        {suspendError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{suspendError}</div>}
        {suspendSuccess && <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{suspendSuccess}</div>}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Campus</label>
            <select
              value={suspendCampusValue}
              onChange={(e) => setSuspendCampusValue(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              {visibleCampuses.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={suspending || !suspendCampusValue}
            onClick={() => runCampusSuspend("suspend-campus")}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {suspending ? "Working..." : `Suspend all ${suspendLabel} on this campus`}
          </button>
          <button
            type="button"
            disabled={suspending || !suspendCampusValue}
            onClick={() => runCampusSuspend("unsuspend-campus")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {suspending ? "Working..." : "Reactivate"}
          </button>
        </div>
      </Card>

      <MyColorPreference />
    </div>
  );
}
