"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
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

function NewAnnouncementModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/announcements", { title, body });
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
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              This goes to every CR on your campus as a notification (a Super Admin's announcement goes to every CR university-wide).
            </p>

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
