"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, DoorOpen } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

interface PaginatedBookings {
  data: Booking[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminBookedVenuesPage() {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedBookings | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/bookings", {
      params: { ...(date ? { date } : {}), ...(status ? { status } : {}), page },
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status, page]);

  const bookings = result?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Booked Venues (Zote)"
        subtitle="Orodha kamili ya bookings zote, aliyebook, taarifa zake, na saini yake."
      />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tarehe (hiari)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setPage(1); setDate(e.target.value); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">Zote</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {date && (
            <button onClick={() => { setPage(1); setDate(""); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
              Futa Tarehe
            </button>
          )}
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Hakuna bookings" description="Hakuna booking inayolingana na vigezo hivi." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{b.venue?.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <CalendarClock size={12} /> {b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-2 rounded-lg bg-slate-50 p-2">
                  <p className="text-xs font-medium text-slate-700">Booked by: {b.user?.name}</p>
                  <p className="text-xs text-slate-500">{b.user?.email}</p>
                  <p className="text-xs text-slate-500">{b.user?.program} · {b.user?.level} · {b.user?.department}</p>
                </div>

                {b.title && <p className="mt-2 text-xs text-slate-600">{b.title}</p>}
                <div className="mt-2"><PurposeBadge purpose={b.purpose} /></div>

                {b.rejection_reason && (
                  <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">Kukataliwa: {b.rejection_reason}</p>
                )}

                {b.signature ? (
                  <div className="mt-3">
                    <p className="mb-1 text-xs text-slate-400">Saini ya CR</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.signature} alt="Saini" className="h-14 rounded border border-slate-200 bg-white" />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">Bado hajatia saini</p>
                )}
              </Card>
            ))}
          </div>

          {result && result.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Nyuma
              </button>
              <span className="text-sm text-slate-500">
                Ukurasa {result.current_page} kati ya {result.last_page} ({result.total} bookings)
              </span>
              <button
                disabled={page >= result.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Mbele <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
