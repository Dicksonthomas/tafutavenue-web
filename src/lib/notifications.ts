import { api } from "./api";
import { Announcement, Notification, NotificationType, Role } from "./types";

export function notificationHref(role: Role): string {
  return role === "admin" ? "/admin/notifications" : "/dashboard/notifications";
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  booking_approved: "Booking Approved",
  booking_rejected: "Booking Rejected",
  booking_pending: "Booking Pending",
  booking_edited: "Booking Edited",
  announcement: "Announcement",
};

/** Where clicking a notification of this type should navigate to, if anywhere. */
export function notificationTargetHref(n: Notification): string | null {
  if (n.type === "booking_pending") return "/admin/bookings?status=pending";
  return null;
}

export interface PaginatedNotifications {
  data: Notification[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface NotificationFilters {
  type?: string;
  read?: "unread" | "read" | "";
  date?: string;
  q?: string;
  page?: number;
  per_page?: string | number;
}

export async function fetchNotifications(filters: NotificationFilters = {}): Promise<PaginatedNotifications> {
  const { data } = await api.get("/notifications", { params: filters });
  return data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get("/notifications/unread-count");
  return data.count;
}

export const NOTIFICATIONS_CHANGED_EVENT = "notifications-changed";

function announceChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const { data } = await api.post(`/notifications/${id}/read`);
  announceChange();
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
  announceChange();
}

export interface PaginatedAnnouncements {
  data: Announcement[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export async function fetchMyAnnouncements(page = 1, perPage: string | number = 20): Promise<PaginatedAnnouncements> {
  const { data } = await api.get("/admin/announcements", { params: { page, per_page: perPage } });
  return data;
}

export async function updateAnnouncement(id: number, title: string, body: string): Promise<Announcement> {
  const { data } = await api.put(`/admin/announcements/${id}`, { title, body });
  announceChange();
  return data;
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await api.delete(`/admin/announcements/${id}`);
  announceChange();
}
