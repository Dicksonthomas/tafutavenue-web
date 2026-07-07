"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, DoorOpen, TrendingUp, GraduationCap, UserRound, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { useReferenceData } from "@/lib/referenceData";
import { Card, PageHeader, Spinner } from "@/components/ui";

interface Summary {
  total_bookings: number;
  by_status: Record<string, number>;
  by_purpose: Record<string, number>;
  most_booked_venues: { venue_id: number; total: number; venue: { name: string; building: string | null } }[];
  total_venues: number;
  venues_by_campus: Record<string, number>;
  total_crs: number;
  male_crs: number;
  female_crs: number;
}

const RANGES: { value: string; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

export default function AdminHomePage() {
  const { campuses } = useReferenceData();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [range, setRange] = useState("all");

  useEffect(() => {
    api.get("/admin/reports/summary", { params: { range } }).then(({ data }) => setSummary(data));
  }, [range]);

  if (!summary) return <Spinner />;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Overview"
        subtitle="Overall status of the Venue Booking system."
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

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Bookings" value={summary.total_bookings} href="/admin/bookings" />
        <StatCard icon={DoorOpen} label="Venues" value={summary.total_venues} href="/admin/venues" />
        {Object.entries(summary.by_status).map(([status, count]) => (
          <StatCard key={status} icon={TrendingUp} label={status} value={count} href={`/admin/bookings?status=${status}`} />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Venues by Campus</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {campuses.map((c) => (
          <StatCard
            key={c.value}
            icon={MapPin}
            label={c.label}
            value={summary.venues_by_campus[c.value] ?? 0}
            href={`/admin/venues?campus=${c.value}`}
          />
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Registered CRs</h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={GraduationCap} label="Total CRs" value={summary.total_crs} href="/admin/students" />
        <StatCard icon={UserRound} label="Male CRs" value={summary.male_crs} color="blue" />
        <StatCard icon={UserRound} label="Female CRs" value={summary.female_crs} color="pink" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Most Booked Venues</h2>
      <Card className="overflow-x-auto">
        {summary.most_booked_venues.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No data yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3">Building</th>
                <th className="px-4 py-3 text-right">Bookings</th>
              </tr>
            </thead>
            <tbody>
              {summary.most_booked_venues.map((v, idx) => (
                <tr key={v.venue_id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 text-slate-700">{v.venue?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{v.venue?.building ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{v.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

const COLOR_CLASSES: Record<string, string> = {
  accent: "bg-accent-50 text-accent-600",
  blue: "bg-blue-50 text-blue-600",
  pink: "bg-pink-50 text-pink-600",
};

function StatCard({
  icon: Icon,
  label,
  value,
  color = "accent",
  href,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  color?: "accent" | "blue" | "pink";
  href?: string;
}) {
  const content = (
    <Card className={`p-4 ${href ? "cursor-pointer transition hover:border-accent-300 hover:shadow-md" : ""}`}>
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${COLOR_CLASSES[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs capitalize text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</p>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
