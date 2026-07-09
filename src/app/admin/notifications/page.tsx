"use client";

import { useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useReferenceData } from "@/lib/referenceData";
import { PageHeader } from "@/components/ui";
import NotificationsTable from "@/components/NotificationsTable";

export default function AdminNotificationsPage() {
  const [composing, setComposing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Notifications"
        subtitle="New booking requests, and announcements you've sent to CRs."
        action={
          <button
            onClick={() => setComposing(true)}
            className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
          >
            <Megaphone size={16} /> New Announcement
          </button>
        }
      />

      <NotificationsTable key={refreshKey} />

      {composing && (
        <NewAnnouncementModal
          onClose={() => setComposing(false)}
          onSent={() => {
            setComposing(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

function campusLabel(value: string, campuses: { value: string; label: string }[]): string {
  return campuses.find((c) => c.value === value)?.label ?? value;
}

function NewAnnouncementModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.is_super_admin;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [campus, setCampus] = useState(""); // super admin only - "" = all campuses
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [level, setLevel] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<number | null>(null);

  const effectiveCampus = isSuperAdmin ? campus : user?.campus;
  const { campuses, faculties, departmentsByFaculty, programs, levelYears } = useReferenceData(effectiveCampus || undefined);

  const departmentOptions = useMemo(() => {
    if (faculty) return departmentsByFaculty[faculty] ?? [];
    const set = new Set<string>();
    Object.values(departmentsByFaculty).forEach((list) => list.forEach((d) => set.add(d)));
    return Array.from(set).sort();
  }, [departmentsByFaculty, faculty]);

  const levelOptions = Object.keys(levelYears);
  const maxYear = level ? levelYears[level] ?? 4 : 4;
  const yearOptions = Array.from({ length: maxYear }, (_, i) => i + 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { title, body };
      if (isSuperAdmin && campus) payload.campus = campus;
      if (faculty) payload.faculty = faculty;
      if (department) payload.department = department;
      if (program) payload.program = program;
      if (level) payload.level = level;
      if (yearOfStudy) payload.year_of_study = Number(yearOfStudy);

      const { data } = await api.post("/admin/announcements", payload);
      setSentTo(data.recipients);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">New Announcement</h2>
          <button onClick={sentTo === null ? onClose : onSent} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {sentTo !== null ? (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-700">Announcement sent to {sentTo} CR{sentTo === 1 ? "" : "s"}.</p>
            <button
              onClick={onSent}
              className="mt-4 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

            <input
              required
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
            <textarea
              required
              placeholder="Write the announcement..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</p>

              {isSuperAdmin ? (
                <div className="mb-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">Campus</label>
                  <select
                    value={campus}
                    onChange={(e) => { setCampus(e.target.value); setProgram(""); }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                  >
                    <option value="">All Campuses</option>
                    {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              ) : (
                <p className="mb-2 text-xs text-slate-500">
                  Goes to CRs on your campus{user?.campus ? ` (${campusLabel(user.campus, campuses)})` : ""}.
                </p>
              )}

              <p className="mb-2 text-xs text-slate-500">
                Leave the fields below as &quot;Any&quot; to reach everyone in that campus, or narrow it down to a specific group.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={faculty}
                  onChange={(e) => { setFaculty(e.target.value); setDepartment(""); }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Any Faculty</option>
                  {faculties.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Any Department</option>
                  {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Any Program</option>
                  {programs.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                  value={level}
                  onChange={(e) => { setLevel(e.target.value); setYearOfStudy(""); }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Any Level</option>
                  {levelOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>

                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="">Any Year of Study</option>
                  {yearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send Announcement"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
