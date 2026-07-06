"use client";

import { useEffect, useState } from "react";
import { Check, X, ClipboardCheck } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/bookings", { params: status ? { status } : {} });
    setBookings(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Bookings"
        subtitle="Idhinisha au kataa maombi ya booking kutoka kwa CR."
        action={
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="">Zote</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Hakuna bookings" description="Hakuna maombi ya aina hii kwa sasa." />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{b.venue?.name ?? `Venue #${b.venue_id}`}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.user?.name} · {b.user?.program} ({b.user?.level})
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}
                  </p>
                  {b.title && <p className="mt-1 text-sm text-slate-600">{b.title}</p>}
                  <div className="mt-2">
                    <PurposeBadge purpose={b.purpose} />
                  </div>
                  {b.signature && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs text-slate-400">Saini ya CR</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.signature} alt="Saini" className="h-14 rounded border border-slate-200 bg-white" />
                    </div>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>

              {b.status === "pending" && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <button onClick={() => approve(b.id)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                    <Check size={14} /> Idhinisha
                  </button>
                  <button onClick={() => setRejectingId(rejectingId === b.id ? null : b.id)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                    <X size={14} /> Kataa
                  </button>
                </div>
              )}

              {rejectingId === b.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    autoFocus
                    placeholder="Sababu ya kukataa..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
                  />
                  <button onClick={() => reject(b.id)} disabled={!reason} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                    Thibitisha
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
