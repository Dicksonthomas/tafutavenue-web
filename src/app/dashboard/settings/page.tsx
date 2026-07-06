"use client";

import { PageHeader } from "@/components/ui";
import MyColorPreference from "@/components/MyColorPreference";

export default function DashboardSettingsPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Mipangilio Yangu" subtitle="Badilisha mwonekano wa rangi kwa akaunti yako binafsi." />
      <MyColorPreference />
    </div>
  );
}
