"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, DoorOpen, Search } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";
import PageSizeSelect from "@/components/PageSizeSelect";
import Pagination from "@/components/Pagination";
import { useDebouncedValue } from "@/lib/useDebounce";
import { useMidnightRefresh } from "@/lib/useMidnightRefresh";
import { todayIso } from "@/lib/date";

interface PaginatedBookings {
  data: Booking[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export default function AdminBookedVenuesPage() {
  const [view, setView] = useState<"day" | "history">("day");
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("30");
  const [result, setResult] = useState<PaginatedBookings | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const isAutoDateRef = useRef(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/bookings", {
      params: {
        ...(view === "day" && date ? { date } : {}),
        ...(status ? { status } : {}),
        ...(debouncedQ ? { q: debouncedQ } : {}),
        page,
        per_page: perPage,
      },
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, status, debouncedQ, page, perPage]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useMidnightRefresh(() => {
    if (isAutoDateRef.current) {
      setDate(todayIso());
    }
  });

  const bookings = result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Booked Venues"
        subtitle="View bookings for a specific day, or the full history of all bookings."
        action={
          <select
            value={view}
            onChange={(e) => { setPage(1); setView(e.target.value as "day" | "history"); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-accent-500 focus:outline-none"
          >
            <option value="day">Booked Venues for a Specific Day</option>
            <option value="history">Booked History (All)</option>
          </select>
        }
      />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Venue, CR name, time, purpose, reason... (live search)"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>
          </div>
          {view === "day" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setPage(1); isAutoDateRef.current = false; setDate(e.target.value); }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Show</label>
            <PageSizeSelect value={perPage} onChange={(v) => { setPage(1); setPerPage(v); }} />
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No bookings" description="No booking matches these criteria." />
      ) : view === "day" ? (
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
                <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">Rejected: {b.rejection_reason}</p>
              )}

              {b.signature ? (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-slate-400">CR Signature</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.signature} alt="Signature" className="h-14 rounded border border-slate-200 bg-white" />
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400">Not signed yet</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Booked By</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Signature</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">
                    {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 0) + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{b.venue?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{b.booking_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.start_time}–{b.end_time}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{b.user?.name}</p>
                    <p className="text-xs text-slate-400">{b.user?.email}</p>
                  </td>
                  <td className="px-4 py-3"><PurposeBadge purpose={b.purpose} /></td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    {b.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.signature} alt="Signature" className="h-10 rounded border border-slate-200 bg-white" />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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
