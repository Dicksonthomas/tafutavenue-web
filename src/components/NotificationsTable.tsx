"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, Clock, Megaphone, XCircle } from "lucide-react";
import { Notification, NotificationType } from "@/lib/types";
import {
  NOTIFICATION_TYPE_LABELS,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTargetHref,
  PaginatedNotifications,
} from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/relativeTime";
import { Card, EmptyState, Spinner } from "@/components/ui";
import Pagination from "@/components/Pagination";
import PageSizeSelect from "@/components/PageSizeSelect";
import { useDebouncedValue } from "@/lib/useDebounce";

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  booking_approved: CheckCircle2,
  booking_rejected: XCircle,
  booking_pending: Clock,
  announcement: Megaphone,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  booking_approved: "bg-emerald-50 text-emerald-600",
  booking_rejected: "bg-red-50 text-red-600",
  booking_pending: "bg-amber-50 text-amber-600",
  announcement: "bg-brand-50 text-brand-700",
};

export default function NotificationsTable() {
  const router = useRouter();
  const [result, setResult] = useState<PaginatedNotifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [readFilter, setReadFilter] = useState<"" | "unread" | "read">("");
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("20");
  const [openId, setOpenId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetchNotifications({
      type: type || undefined,
      read: readFilter || undefined,
      date: date || undefined,
      q: debouncedQ || undefined,
      page,
      per_page: perPage,
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, readFilter, date, debouncedQ, page, perPage]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, readFilter, date, debouncedQ]);

  async function openNotification(n: Notification) {
    if (!n.read_at) {
      const updated = await markNotificationRead(n.id);
      setResult((prev) => (prev ? { ...prev, data: prev.data.map((x) => (x.id === n.id ? updated : x)) } : prev));
    }

    const target = notificationTargetHref(n);
    if (target) {
      router.push(target);
      return;
    }

    setOpenId((current) => (current === n.id ? null : n.id));
  }

  async function markAllRead() {
    await markAllNotificationsRead();
    await load();
  }

  const notifications = result?.data ?? [];
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div>
      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or body..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">All Types</option>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as "" | "unread" | "read")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            />
          </div>
          <button
            onClick={markAllRead}
            disabled={!hasUnread}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Nothing matches these filters yet." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Notification</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n, idx) => {
                  const Icon = TYPE_ICON[n.type];
                  const isUnread = !n.read_at;
                  const expanded = openId === n.id;
                  return (
                    <Fragment key={n.id}>
                      <tr
                        onClick={() => openNotification(n)}
                        className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${isUnread ? "bg-accent-50/40" : ""}`}
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 20) + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${TYPE_COLOR[n.type]}`}>
                            <Icon size={16} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className={`truncate ${isUnread ? "font-semibold text-slate-900" : "text-slate-700"}`}>{n.title}</p>
                            {n.type === "booking_pending" && (
                              <span className="shrink-0 text-xs font-medium text-accent-600">Review →</span>
                            )}
                          </div>
                          {n.booking && (
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {n.booking.venue?.name} · {n.booking.booking_date?.slice(0, 10)} · {n.booking.start_time}–{n.booking.end_time}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatRelativeTime(n.created_at)}</td>
                        <td className="px-4 py-3">
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-1 text-xs font-medium text-accent-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" /> Unread
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Read</span>
                          )}
                        </td>
                      </tr>
                      {expanded && n.body && (
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <td />
                          <td colSpan={4} className="px-4 py-3 text-sm text-slate-600">{n.body}</td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <PageSizeSelect value={perPage} onChange={setPerPage} />
            {result && <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="notifications" onPageChange={setPage} />}
          </div>
        </>
      )}
    </div>
  );
}
