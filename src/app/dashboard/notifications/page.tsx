"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import { Booking, BookingStatus } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner } from "@/components/ui";
import { formatRelativeTime } from "@/lib/relativeTime";
import { crEventTimestamp, fetchCrNotifications, isRecent } from "@/lib/notifications";

const STATUS_STYLE: Record<BookingStatus, { icon: typeof CheckCircle2; bg: string; color: string; verb: string }> = {
  approved: { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600", verb: "was approved" },
  rejected: { icon: XCircle, bg: "bg-red-50", color: "text-red-600", verb: "was rejected" },
  pending: { icon: Clock, bg: "bg-amber-50", color: "text-amber-600", verb: "is awaiting approval" },
  cancelled: { icon: Ban, bg: "bg-slate-100", color: "text-slate-500", verb: "was cancelled" },
};

type FilterOption = "new" | "all";

export default function NotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("new");

  useEffect(() => {
    fetchCrNotifications().then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => new Date(crEventTimestamp(b)).getTime() - new Date(crEventTimestamp(a)).getTime()),
    [bookings]
  );

  const visible = useMemo(
    () => (filter === "new" ? sorted.filter((b) => isRecent(crEventTimestamp(b))) : sorted),
    [sorted, filter]
  );

  return (
    <div className="mx-auto max-w-7xl">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((b) => {
            const style = STATUS_STYLE[b.status];
            const Icon = style.icon;
            const ts = crEventTimestamp(b);
            const isNewItem = isRecent(ts);
            return (
              <Card key={b.id} className={`flex flex-col gap-3 p-4 ${isNewItem ? "ring-1 ring-accent-200" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg} ${style.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-slate-800">
                        Your booking for {b.venue?.name ?? `Venue #${b.venue_id}`} {style.verb}
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

                {b.status === "rejected" && b.rejection_reason && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">Reason: {b.rejection_reason}</p>
                )}
                {b.status === "approved" && b.approver?.name && (
                  <p className="text-xs text-slate-400">Approved by {b.approver.name}</p>
                )}

                <p className="mt-auto text-xs text-slate-400">{formatRelativeTime(ts)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
