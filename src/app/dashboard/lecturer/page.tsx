"use client";

import { useEffect, useState } from "react";
import { Search, User2, CalendarClock } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { TimetableSlot } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/lib/useDebounce";

export default function LecturerTimetablePage() {
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<TimetableSlot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedName = useDebouncedValue(name, 350);

  useEffect(() => {
    if (!debouncedName.trim()) {
      setSlots(null);
      return;
    }
    setError(null);
    setLoading(true);
    api
      .get("/timetable/by-lecturer", { params: { name: debouncedName } })
      .then(({ data }) => setSlots(data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedName]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Lecturer Timetable"
        subtitle="Type your Lecturer's name to see their entire weekly schedule - no hassle."
      />

      <Card className="mb-6 p-5">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Siyao (live search - just type)"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
        </div>
      </Card>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading && <Spinner />}

      {!loading && slots && slots.length === 0 && (
        <EmptyState icon={User2} title="No Lecturer found" description="Make sure you typed the correct name (or part of the name)." />
      )}

      {!loading && slots && slots.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-800">{s.day_of_week}</p>
                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                  <CalendarClock size={13} /> {s.start_time}–{s.end_time}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{s.course_unit ?? "—"} · {s.program ?? "—"}</p>
              <p className="mt-1 text-xs font-medium text-accent-700">{s.venue?.name}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
