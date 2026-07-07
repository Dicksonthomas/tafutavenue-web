"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "@/lib/api";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import PageSizeSelect from "@/components/PageSizeSelect";
import Pagination from "@/components/Pagination";

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

export default function AdminLogsPage() {
  const [result, setResult] = useState<PaginatedLogs | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("30");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/logs", { params: { page, per_page: perPage } });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  const logs = result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Logs" subtitle="System activity log. Super Admin actions are only visible to the Super Admin." />

      <div className="mb-4 flex justify-end">
        <PageSizeSelect value={perPage} onChange={(v) => { setPage(1); setPerPage(v); }} />
      </div>

      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
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
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.message}</td>
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
