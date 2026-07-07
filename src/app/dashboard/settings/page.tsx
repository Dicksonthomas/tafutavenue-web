"use client";

import { PageHeader } from "@/components/ui";
import MyColorPreference from "@/components/MyColorPreference";

export default function DashboardSettingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="My Settings" subtitle="Change the color theme for your personal account." />
      <MyColorPreference />
    </div>
  );
}
