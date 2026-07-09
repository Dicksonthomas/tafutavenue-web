"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import { api } from "@/lib/api";
import { Booking, BookingStatus } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { formatRelativeTime } from "@/lib/relativeTime";

const NEW_WINDOW_DAYS = 3;

const STATUS_STYLE: Record<BookingStatus, { icon: typeof CheckCircle2; bg: string; color: string; verb: string }> = {
  approved: { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600", verb: "was approved" },
  rejected: { icon: XCircle, bg: "bg-red-50", color: "text-red-600", verb: "was rejected" },
  pending: { icon: Clock, bg: "bg-amber-50", color: "text-amber-600", verb: "is awaiting approval" },
  cancelled: { icon: Ban, bg: "bg-slate-100", color: "text-slate-500", verb: "was cancelled" },
};

type FilterOption = "new" | "all";

function eventTimestamp(b: Booking): string {
  return b.updated_at ?? b.created_at ?? b.booking_date;
}

function isNew(b: Booking): boolean {
  const ts = new Date(eventTimestamp(b)).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export default function NotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("new");

  useEffect(() => {
    api.get("/bookings").then(({ data }) => {
      setBookings(data.data ?? data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => new Date(eventTimestamp(b)).getTime() - new Date(eventTimestamp(a)).getTime()),
    [bookings]
  );

  const visible = useMemo(() => (filter === "new" ? sorted.filter(isNew) : sorted), [sorted, filter]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Notifications" subtitle="Updates about your bookings." />

      <div className="mb-5">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium focus:border-accent-500 focus:outline-none"
        >
          <option value="new">New Notifications</option>
          <option value="all">All Notifications</option>
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={filter === "new" ? "No new notifications" : "No notifications yet"}
          description={filter === "new" ? "Nothing in the last few days - switch to 'All Notifications' to see older updates." : "You'll see updates here once you make a booking."}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const style = STATUS_STYLE[b.status];
            const Icon = style.icon;
            return (
              <Card key={b.id} className={`flex items-start gap-3 p-4 ${isNew(b) ? "ring-1 ring-accent-200" : ""}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.color}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      Your booking for {b.venue?.name ?? `Venue #${b.venue_id}`} {style.verb}
                    </p>
                    {isNew(b) && <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}
                  </p>
                  {b.status === "rejected" && b.rejection_reason && (
                    <p className="mt-1 text-xs text-red-600">Reason: {b.rejection_reason}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(eventTimestamp(b))}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
