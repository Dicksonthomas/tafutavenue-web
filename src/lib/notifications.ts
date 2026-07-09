import { api } from "./api";
import { Booking, Role } from "./types";

export const NOTIFICATION_NEW_WINDOW_DAYS = 3;

export function notificationHref(role: Role): string {
  return role === "admin" ? "/admin/notifications" : "/dashboard/notifications";
}

/** CR: most recent activity on their own bookings (status changes). */
export function crEventTimestamp(b: Booking): string {
  return b.updated_at ?? b.created_at ?? b.booking_date;
}

/** Admin: when the pending booking request came in. */
export function adminEventTimestamp(b: Booking): string {
  return b.created_at ?? b.booking_date;
}

export function isRecent(iso: string): boolean {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= NOTIFICATION_NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export async function fetchCrNotifications(): Promise<Booking[]> {
  const { data } = await api.get("/bookings");
  return data.data ?? data;
}

export async function fetchAdminNotifications(): Promise<Booking[]> {
  const { data } = await api.get("/admin/bookings", { params: { status: "pending", per_page: 50 } });
  return data.data ?? data;
}

export async function fetchNewNotificationCount(role: Role): Promise<number> {
  if (role === "admin") {
    const bookings = await fetchAdminNotifications();
    return bookings.filter((b) => isRecent(adminEventTimestamp(b))).length;
  }
  const bookings = await fetchCrNotifications();
  return bookings.filter((b) => isRecent(crEventTimestamp(b))).length;
}
