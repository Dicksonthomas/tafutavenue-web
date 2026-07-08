"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useSettings } from "@/lib/settings";
import { Card } from "@/components/ui";

export default function MyColorPreference() {
  const { primary_color, default_color, loading: settingsLoading, refresh } = useSettings();
  const [color, setColor] = useState(primary_color ?? default_color ?? "#da4e1f");

  // useState's initial value only runs once, but settings.tsx's fetch may
  // still be in flight at that point - sync once real values arrive instead
  // of permanently showing the hardcoded fallback color.
  useEffect(() => {
    if (!settingsLoading) {
      setColor(primary_color ?? default_color ?? "#da4e1f");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoading]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function save(newColor: string | null) {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const { data } = await api.post("/me/color-preference", { color: newColor });
      setSuccess(data.message);
      refresh();
      if (newColor) setColor(newColor);
      else if (default_color) setColor(default_color);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-sm font-semibold text-slate-800">My Personal Color</h2>
      <p className="mb-4 text-xs text-slate-500">
        Change the color theme for your account only, without affecting other users.
      </p>

      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-slate-300" />
        <input value={color} onChange={(e) => setColor(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-accent-500 focus:outline-none" />
        <button
          disabled={submitting}
          onClick={() => save(color)}
          className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
        >
          Save My Color
        </button>
        <button
          disabled={submitting}
          onClick={() => save(null)}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RotateCcw size={14} /> Reset to Default
        </button>
      </div>
    </Card>
  );
}
