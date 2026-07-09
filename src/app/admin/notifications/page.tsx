"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner } from "@/components/ui";
import { formatRelativeTime } from "@/lib/relativeTime";

const NEW_WINDOW_DAYS = 3;

type FilterOption = "new" | "all";

function eventTimestamp(b: Booking): string {
  return b.created_at ?? b.booking_date;
}

function isNew(b: Booking): boolean {
  const ts = new Date(eventTimestamp(b)).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export default function AdminNotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("new");

  useEffect(() => {
    api.get("/admin/bookings", { params: { status: "pending", per_page: 50 } }).then(({ data }) => {
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
      <PageHeader title="Notifications" subtitle="Bookings waiting for your approval." />

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
          title={filter === "new" ? "No new notifications" : "Nothing pending"}
          description={filter === "new" ? "No new booking requests in the last few days." : "There are no bookings waiting for approval right now."}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((b) => (
            <Link key={b.id} href="/admin/bookings?status=pending">
              <Card className={`flex items-start gap-3 p-4 transition-colors hover:bg-slate-50 ${isNew(b) ? "ring-1 ring-accent-200" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Clock size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {b.user?.name ?? "A CR"} requested {b.venue?.name ?? `Venue #${b.venue_id}`}
                    </p>
                    {isNew(b) && <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}</span>
                    <PurposeBadge purpose={b.purpose} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(eventTimestamp(b))}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
