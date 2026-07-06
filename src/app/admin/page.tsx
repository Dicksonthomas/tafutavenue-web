"use client";

import { useEffect, useState } from "react";
import { ClipboardList, DoorOpen, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Card, PageHeader, Spinner } from "@/components/ui";

interface Summary {
  total_bookings: number;
  by_status: Record<string, number>;
  by_purpose: Record<string, number>;
  most_booked_venues: { venue_id: number; total: number; venue: { name: string; building: string | null } }[];
  total_venues: number;
}

const RANGES: { value: string; label: string }[] = [
  { value: "all", label: "Muda Wote" },
  { value: "today", label: "Leo" },
  { value: "yesterday", label: "Jana" },
  { value: "this_week", label: "Wiki Hii" },
  { value: "this_month", label: "Mwezi Huu" },
];

export default function AdminHomePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [range, setRange] = useState("all");

  useEffect(() => {
    api.get("/admin/reports/summary", { params: { range } }).then(({ data }) => setSummary(data));
  }, [range]);

  if (!summary) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Muhtasari"
        subtitle="Hali ya jumla ya mfumo wa Venue Booking."
        action={
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Jumla ya Bookings" value={summary.total_bookings} />
        <StatCard icon={DoorOpen} label="Venues" value={summary.total_venues} />
        {Object.entries(summary.by_status).map(([status, count]) => (
          <StatCard key={status} icon={TrendingUp} label={status} value={count} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Venues Zinazobookiwa Zaidi</h2>
      <Card>
        {summary.most_booked_venues.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Hakuna data bado.</p>
        ) : (
          summary.most_booked_venues.map((v) => (
            <div key={v.venue_id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <span className="text-sm text-slate-700">
                {v.venue?.name} <span className="text-slate-400">· {v.venue?.building}</span>
              </span>
              <span className="text-sm font-semibold text-slate-800">{v.total} bookings</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
        <Icon size={16} />
      </div>
      <p className="text-xs capitalize text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );
}
