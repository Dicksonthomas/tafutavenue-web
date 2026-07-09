"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Clock } from "lucide-react";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner } from "@/components/ui";
import { formatRelativeTime } from "@/lib/relativeTime";
import { adminEventTimestamp, fetchAdminNotifications, isRecent } from "@/lib/notifications";

type FilterOption = "new" | "all";

export default function AdminNotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("new");

  useEffect(() => {
    fetchAdminNotifications().then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => new Date(adminEventTimestamp(b)).getTime() - new Date(adminEventTimestamp(a)).getTime()),
    [bookings]
  );

  const visible = useMemo(
    () => (filter === "new" ? sorted.filter((b) => isRecent(adminEventTimestamp(b))) : sorted),
    [sorted, filter]
  );

  return (
    <div className="mx-auto max-w-7xl">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => {
            const ts = adminEventTimestamp(b);
            const isNewItem = isRecent(ts);
            return (
              <Link key={b.id} href="/admin/bookings?status=pending" className="block h-full">
                <Card className={`flex h-full flex-col gap-3 p-4 transition-colors hover:bg-slate-50 ${isNewItem ? "ring-1 ring-accent-200" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Clock size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-slate-800">
                          {b.user?.name ?? "A CR"} requested {b.venue?.name ?? `Venue #${b.venue_id}`}
                        </p>
                        {isNewItem && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <PurposeBadge purpose={b.purpose} />
                    {b.title && <span className="truncate text-xs text-slate-500">{b.title}</span>}
                  </div>

                  <p className="mt-auto text-xs text-slate-400">{formatRelativeTime(ts)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
