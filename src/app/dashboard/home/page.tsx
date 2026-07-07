"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, History } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";

interface LogEntry {
  id: number;
  action: string;
  message: string;
  created_at: string;
  user: { id: number; name: string } | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardHomePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState(0);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/bookings"),
      api.get("/logs", { params: { per_page: 10 } }),
    ]).then(([bookingsRes, logsRes]) => {
      const allBookings: Booking[] = bookingsRes.data.data ?? bookingsRes.data;
      setBookings(allBookings.slice(0, 5));
      setUpcoming(allBookings.filter((b) => b.status === "approved" && b.booking_date >= todayIso()).length);
      setTotal(bookingsRes.data.total ?? allBookings.length);
      setLogs(logsRes.data.data ?? logsRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Your booking history and recent activity at a glance." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <ClipboardList size={16} />
          </div>
          <p className="text-xs text-slate-500">Total Bookings</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">{total}</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={16} />
          </div>
          <p className="text-xs text-slate-500">Upcoming (Approved)</p>
          <p className="mt-0.5 text-2xl font-semibold text-slate-900">{upcoming}</p>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent Bookings</h2>
      {bookings.length === 0 ? (
        <EmptyState icon={CalendarClock} title="You have no bookings yet" description="Go to 'Find Venue' to make a new booking." />
      ) : (
        <Card className="mb-8">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{b.venue?.name ?? `Venue #${b.venue_id}`}</p>
                <p className="text-xs text-slate-400">{b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PurposeBadge purpose={b.purpose} />
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Activity</h2>
      {logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <Card>
          {logs.map((log) => (
            <div key={log.id} className="border-b border-slate-100 px-5 py-3 last:border-0">
              <p className="text-sm text-slate-700">{log.message}</p>
              <p className="mt-0.5 text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
