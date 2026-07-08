"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, X, ClipboardCheck, Download, Trash2 } from "lucide-react";
import { api, apiErrorMessage, blobErrorMessage } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";
import PageSizeSelect from "@/components/PageSizeSelect";
import Pagination from "@/components/Pagination";
import { confirmAction } from "@/lib/confirm";

interface PaginatedBookings {
  data: Booking[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PaginatedBookings | null>(null);
  const [status, setStatus] = useState<string>(searchParams.get("status") ?? "pending");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("30");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/bookings", {
      params: { ...(status ? { status } : {}), page, per_page: perPage },
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, perPage]);

  useEffect(() => {
    api.get("/admin/reports/summary", { params: { range: "all" } }).then(({ data }) => setCounts(data.by_status ?? {}));
  }, [result]);

  async function approve(id: number) {
    setError(null);
    try {
      await api.post(`/admin/bookings/${id}/approve`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function reject(id: number) {
    setError(null);
    try {
      await api.post(`/admin/bookings/${id}/reject`, { rejection_reason: reason });
      setRejectingId(null);
      setReason("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function deleteBooking(b: Booking) {
    const ok = await confirmAction(
      `This ${b.status} booking of "${b.venue?.name ?? "this venue"}" by ${b.user?.name ?? "this CR"} will be permanently deleted.`,
      { title: "Delete this booking?", confirmText: "Yes, delete" }
    );
    if (!ok) return;
    setError(null);
    setDeletingId(b.id);
    try {
      await api.delete(`/admin/bookings/${b.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteAllBookings() {
    const scopeLabel = status ? `all "${status}" bookings` : "ALL bookings";
    const ok = await confirmAction(
      `This will permanently delete ${scopeLabel} matching the current filter. This cannot be undone.`,
      { title: `Delete ${scopeLabel}?`, confirmText: "Yes, delete them all" }
    );
    if (!ok) return;
    setError(null);
    setDeletingAll(true);
    try {
      await api.delete("/admin/bookings", { params: status ? { status } : {} });
      setPage(1);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setDeletingAll(false);
    }
  }

  async function downloadReport() {
    setError(null);
    setDownloading(true);
    try {
      const res = await api.get("/admin/reports/bookings/export-pdf", {
        params: status ? { status } : {},
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "bookings_report.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(await blobErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  const bookings = result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Bookings"
        subtitle="Approve or reject booking requests from CRs."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={downloadReport} disabled={downloading} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Download size={16} /> {downloading ? "Preparing..." : "Download Report"}
            </button>
            <button
              onClick={deleteAllBookings}
              disabled={deletingAll || bookings.length === 0}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} /> {deletingAll ? "Deleting..." : "Delete All"}
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["pending", "approved", "rejected", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setPage(1); setStatus(s); }}
            className={`rounded-lg border p-3 text-left transition ${
              status === s ? "border-accent-500 bg-accent-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-xs capitalize text-slate-500">{s}</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-900">{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <PageSizeSelect value={perPage} onChange={(v) => { setPage(1); setPerPage(v); }} />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No bookings" description="There are no requests of this kind at the moment." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Booked By</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0 align-top hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">
                    {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 0) + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{b.venue?.name ?? `Venue #${b.venue_id}`}</p>
                    {b.title && <p className="text-xs text-slate-500">{b.title}</p>}
                    {b.reason && (
                      <p className="mt-1 max-w-xs rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                        Beyond daily limit: {b.reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.booking_date?.slice(0, 10)}
                    <br />
                    <span className="text-xs text-slate-400">{b.start_time}–{b.end_time}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{b.user?.name}</p>
                    <p className="text-xs text-slate-400">{b.user?.program} ({b.user?.level})</p>
                  </td>
                  <td className="px-4 py-3"><PurposeBadge purpose={b.purpose} /></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                    {b.status === "approved" && b.approver && (
                      <p className="mt-1 text-xs text-slate-400">by {b.approver.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex justify-end gap-2">
                        {b.status === "pending" && (
                          <>
                            <button onClick={() => approve(b.id)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                              <Check size={14} /> Approve
                            </button>
                            <button onClick={() => setRejectingId(rejectingId === b.id ? null : b.id)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                              <X size={14} /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteBooking(b)}
                          disabled={deletingId === b.id}
                          className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                      {rejectingId === b.id && (
                        <div className="flex w-56 gap-2">
                          <input
                            autoFocus
                            placeholder="Reason for rejection..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-accent-500 focus:outline-none"
                          />
                          <button onClick={() => reject(b.id)} disabled={!reason} className="rounded-lg bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                            OK
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result && (
        <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="bookings" onPageChange={setPage} />
      )}
    </div>
  );
}
