"use client";

import { useEffect, useState } from "react";
import { History, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import PageSizeSelect from "@/components/PageSizeSelect";
import Pagination from "@/components/Pagination";
import { confirmAction } from "@/lib/confirm";

interface LogEntry {
  id: number;
  action: string;
  message: string;
  created_at: string;
  user: { id: number; name: string } | null;
  booking: { id: number; venue_id: number; booking_date: string; start_time: string; end_time: string } | null;
}

interface PaginatedLogs {
  data: LogEntry[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function actionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

export default function AdminLogsPage() {
  const [result, setResult] = useState<PaginatedLogs | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/logs", {
      params: { page, per_page: perPage, ...(actionFilter ? { action: actionFilter } : {}) },
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    api.get("/admin/logs/actions").then(({ data }) => setActions(data));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, actionFilter]);

  async function deleteOne(log: LogEntry) {
    const ok = await confirmAction("This log entry will be permanently deleted.", { title: "Delete this log?", confirmText: "Yes, delete" });
    if (!ok) return;
    setError(null);
    setDeletingId(log.id);
    try {
      await api.delete(`/admin/logs/${log.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAll() {
    const scopeLabel = actionFilter ? `all "${actionLabel(actionFilter)}" logs` : "ALL logs";
    const ok = await confirmAction(
      `This will permanently delete ${scopeLabel} you can see. This cannot be undone.`,
      { title: `Delete ${scopeLabel}?`, confirmText: "Yes, delete them all" }
    );
    if (!ok) return;
    setError(null);
    setDeletingAll(true);
    try {
      await api.delete("/admin/logs", { params: actionFilter ? { action: actionFilter } : {} });
      setPage(1);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDeletingAll(false);
    }
  }

  const logs = result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Logs"
        subtitle="System activity log. Super Admin actions are only visible to the Super Admin."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => { setPage(1); setActionFilter(e.target.value); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">All Actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>{actionLabel(a)}</option>
              ))}
            </select>
            <button
              onClick={deleteAll}
              disabled={deletingAll || logs.length === 0}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> {deletingAll ? "Deleting..." : "Delete All"}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex justify-end">
        <PageSizeSelect value={perPage} onChange={(v) => { setPage(1); setPerPage(v); }} />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">
                    {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 0) + idx + 1}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{log.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                      {actionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.message}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteOne(log)}
                      disabled={deletingId === log.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result && (
        <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="entries" onPageChange={setPage} />
      )}
    </div>
  );
}
