"use client";

import { PageHeader } from "@/components/ui";
import NotificationsTable from "@/components/NotificationsTable";

export default function AdminNotificationsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Notifications"
        subtitle="New booking requests, pending registrations, and announcements posted by admins on your campus."
      />

      <NotificationsTable />
    </div>
  );
}
