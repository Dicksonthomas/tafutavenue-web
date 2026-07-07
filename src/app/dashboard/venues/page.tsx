"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Users, DoorOpen } from "lucide-react";
import { api } from "@/lib/api";
import { Semester, Venue } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner, VenueStatusBadge } from "@/components/ui";
import BookingModal from "@/components/BookingModal";
import { useDebouncedValue } from "@/lib/useDebounce";
import { useAuth } from "@/lib/auth";
import { useReferenceData } from "@/lib/referenceData";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowHm() {
  return new Date().toTimeString().slice(0, 5);
}

function to12h(time: string): string {
  const [hStr, m] = time.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${suffix}`;
}

export default function AllVenuesPage() {
  const { user } = useAuth();
  const { campuses } = useReferenceData();
  const campusName = campuses.find((c) => c.value === user?.campus)?.label ?? user?.campus;
  const [q, setQ] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [freeMode, setFreeMode] = useState(false);
  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);

  const isFreeQuery = debouncedQ.trim().toLowerCase() === "free";

  useEffect(() => {
    setLoading(true);
    setSuccessMsg(null);

    if (isFreeQuery) {
      setFreeMode(true);
      api.get("/semesters").then(({ data }: { data: Semester[] }) => {
        const active = data.find((s) => s.is_active) ?? data[0];
        if (!active) {
          setVenues([]);
          setLoading(false);
          return;
        }
        api.get("/venues/available", {
          params: { semester_id: active.id, date: todayIso(), start_time: nowHm(), end_time: "23:59" },
        }).then(({ data: availableData }) => {
          setVenues(availableData.venues);
          setLoading(false);
        });
      });
      return;
    }

    setFreeMode(false);
    api.get("/venues", { params: debouncedQ ? { q: debouncedQ } : {} }).then(({ data }) => {
      setVenues(data);
      setLoading(false);
    });
  }, [debouncedQ, isFreeQuery]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="All Venues"
        subtitle={`Search for any venue by name or number (e.g. Ntare 108), or type "free" to see venues free right now.${campusName ? ` Campus: ${campusName}.` : ""}`}
      />

      <div className="relative mb-6">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Type a venue name or number, or "free"...'
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>

      {successMsg && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">{successMsg}</div>}

      {freeMode && !loading && (
        <p className="mb-4 text-xs text-slate-500">Showing venues free from now until the end of today. Click a card to book it.</p>
      )}

      {loading ? (
        <Spinner />
      ) : venues.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No venue found" description="Try another name or number." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Card
              key={v.id}
              onClick={() => setBookingVenue(v)}
              className="cursor-pointer p-5 transition hover:border-accent-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">{v.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={13} /> {v.building || "—"} {v.code ? `· ${v.code}` : ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Users size={13} /> Capacity {v.capacity} · {v.type.replace("_", " ")}
                  </p>
                </div>
                <VenueStatusBadge status={v.status} />
              </div>

              {freeMode && v.free_from && v.free_until && (
                <p className="mt-2 rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  Free {to12h(v.free_from)} – {to12h(v.free_until)}
                </p>
              )}

              {(v.blocked_purposes?.length || v.restricted_levels?.length || v.restricted_department) ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {v.blocked_purposes?.map((p) => (
                    <span key={p} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">No {p.replace("_", " ")}</span>
                  ))}
                  {v.restricted_levels?.length ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{v.restricted_levels.join("/")} only</span>
                  ) : null}
                  {v.restricted_department && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{v.restricted_department} only</span>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {bookingVenue && (
        <BookingModal
          venue={bookingVenue}
          onClose={() => setBookingVenue(null)}
          onSuccess={() => {
            setSuccessMsg(`Booking for "${bookingVenue.name}" was successful and approved automatically!`);
            if (freeMode) {
              setVenues((prev) => prev.filter((v) => v.id !== bookingVenue.id));
            }
            setBookingVenue(null);
          }}
        />
      )}
    </div>
  );
}
