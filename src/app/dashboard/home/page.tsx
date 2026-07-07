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
        <Card className="mb-8 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, idx) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{b.venue?.name ?? `Venue #${b.venue_id}`}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}</td>
                  <td className="px-4 py-3"><PurposeBadge purpose={b.purpose} /></td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Activity</h2>
      {logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
