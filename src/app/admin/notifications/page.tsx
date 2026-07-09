"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Megaphone, Pencil, Trash2, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useReferenceData } from "@/lib/referenceData";
import { Announcement } from "@/lib/types";
import { PageHeader, Card, EmptyState, Spinner } from "@/components/ui";
import Combobox from "@/components/Combobox";
import Pagination from "@/components/Pagination";
import NotificationsTable from "@/components/NotificationsTable";
import { confirmAction } from "@/lib/confirm";
import { formatRelativeTime } from "@/lib/relativeTime";
import { deleteAnnouncement, fetchMyAnnouncements, PaginatedAnnouncements, updateAnnouncement } from "@/lib/notifications";

type View = "inbox" | "mine";

export default function AdminNotificationsPage() {
  const [composing, setComposing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [view, setView] = useState<View>("inbox");

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

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setView("inbox")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
            view === "inbox" ? "border-accent-600 text-accent-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Bell size={16} /> Inbox
        </button>
        <button
          onClick={() => setView("mine")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium ${
            view === "mine" ? "border-accent-600 text-accent-700" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Megaphone size={16} /> My Announcements
        </button>
      </div>

      {view === "inbox" ? <NotificationsTable key={refreshKey} /> : <AnnouncementsManager refreshKey={refreshKey} />}

      {composing && (
        <NewAnnouncementModal
          onClose={() => setComposing(false)}
          onSent={() => {
            setComposing(false);
            setView("mine");
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

function AnnouncementsManager({ refreshKey }: { refreshKey: number }) {
  const [result, setResult] = useState<PaginatedAnnouncements | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchMyAnnouncements(page);
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, refreshKey]);

  async function handleDelete(a: Announcement) {
    const ok = await confirmAction(
      `"${a.title}" will be removed from every CR's notifications immediately. This can't be undone.`,
      { title: "Delete this announcement?", confirmText: "Yes, delete" }
    );
    if (!ok) return;

    setDeletingId(a.id);
    try {
      await deleteAnnouncement(a.id);
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  const announcements = result?.data ?? [];

  return (
    <div>
      {loading ? (
        <Spinner />
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Announcements you post to CRs will appear here, and you can edit or delete them any time." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Announcement</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Recipients</th>
                  <th className="px-4 py-3">Read</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a, idx) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-400">
                      {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 20) + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{a.title}</p>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{a.body}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatRelativeTime(a.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{a.notifications_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">{a.read_count ?? 0} / {a.notifications_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(a)}
                          title="Edit"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={deletingId === a.id}
                          title="Delete"
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {result && <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="announcements" onPageChange={setPage} />}
        </>
      )}

      {editing && (
        <EditAnnouncementModal
          announcement={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EditAnnouncementModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateAnnouncement(announcement.id, title, body);
      onSaved();
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
          <h2 className="font-semibold text-slate-900">Edit Announcement</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

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
          <p className="text-xs text-slate-400">This updates the announcement for every CR who already received it.</p>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewAnnouncementModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.is_super_admin;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"cr" | "admin">("cr");
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

  // Union of all departments (not filtered to the typed faculty) - same
  // choice made in EducationFields, since faculty is free text here too and
  // an exact-match filter often produced an empty list.
  const departmentOptions = useMemo(
    () => Array.from(new Set(Object.values(departmentsByFaculty).flat())).sort(),
    [departmentsByFaculty]
  );

  const levelOptions = Object.keys(levelYears);
  const maxYear = level ? levelYears[level] ?? 4 : 4;
  const yearOptions = Array.from({ length: maxYear }, (_, i) => i + 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { title, body, audience };
      if (audience === "cr") {
        if (isSuperAdmin && campus) payload.campus = campus;
        if (faculty) payload.faculty = faculty;
        if (department) payload.department = department;
        if (program) payload.program = program;
        if (level) payload.level = level;
        if (yearOfStudy) payload.year_of_study = Number(yearOfStudy);
      }

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
            <p className="text-sm text-slate-700">
              Announcement sent to {sentTo} {audience === "admin" ? `admin${sentTo === 1 ? "" : "s"}` : `CR${sentTo === 1 ? "" : "s"}`}.
            </p>
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

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAudience("cr")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    audience === "cr" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  CRs
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("admin")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                    audience === "admin" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Admins
                </button>
              </div>

              {audience === "admin" ? (
                <p className="text-xs text-slate-500">Goes to every other Admin, as a direct notification.</p>
              ) : (
                <>
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
                    Leave a field blank to reach everyone in that campus. Choose from the list or type your own if it's not listed.
                    Admins in that campus also get a read-only copy.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Combobox
                      value={faculty}
                      onChange={setFaculty}
                      options={faculties.map((f) => f.value)}
                      placeholder="Any Faculty"
                    />

                    <Combobox
                      value={department}
                      onChange={setDepartment}
                      options={departmentOptions}
                      placeholder="Any Department"
                    />

                    <div className="col-span-2">
                      <Combobox
                        value={program}
                        onChange={setProgram}
                        options={programs}
                        placeholder="Any Program"
                      />
                    </div>

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
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                    >
                      <option value="">Any Year of Study</option>
                      {yearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </>
              )}
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
