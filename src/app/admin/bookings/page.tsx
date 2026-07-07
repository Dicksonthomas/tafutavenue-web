"use client";

import { useEffect, useState } from "react";
import { Check, X, ClipboardCheck, MapPin, CalendarDays, Clock } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking } from "@/lib/types";
import { useReferenceData } from "@/lib/referenceData";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";

function campusLabel(value: string | undefined, campuses: { value: string; label: string }[]): string {
  if (!value) return "—";
  return campuses.find((c) => c.value === value)?.label ?? value;
}

export default function AdminBookingsPage() {
  const { campuses } = useReferenceData();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState<string>("pending");
  const [counts, setCounts] = useState<Record<string, number>>({});
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

  useEffect(() => {
    api.get("/admin/reports/summary", { params: { range: "all" } }).then(({ data }) => setCounts(data.by_status ?? {}));
  }, [bookings]);

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
    <div className="mx-auto max-w-7xl">
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

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["pending", "approved", "rejected", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg border p-3 text-left transition ${
              status === s ? "border-accent-500 bg-accent-50" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <p className="text-xs capitalize text-slate-500">{s}</p>
            <p className="mt-0.5 text-xl font-semibold text-slate-900">{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

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
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{b.venue?.name ?? `Venue #${b.venue_id}`}</h3>
                    {b.venue?.campus && (
                      <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        <MapPin size={11} /> {campusLabel(b.venue.campus, campuses)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {b.user?.name} · {b.user?.program} ({b.user?.level})
                  </p>
                  <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {b.booking_date?.slice(0, 10)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {b.start_time}–{b.end_time}</span>
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
