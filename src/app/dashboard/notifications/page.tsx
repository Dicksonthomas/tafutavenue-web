"use client";

import { PageHeader } from "@/components/ui";
import NotificationsTable from "@/components/NotificationsTable";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Notifications" subtitle="Updates about your bookings and announcements from your campus Admin." />
      <NotificationsTable />
    </div>
  );
}
