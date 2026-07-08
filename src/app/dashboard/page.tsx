"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Users, CalendarSearch, Sun, Moon, CalendarClock, BookOpen, DoorOpen, CheckCircle2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Semester, TimetableSlot, Booking, Venue } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";
import BookingModal from "@/components/BookingModal";
import { useAuth } from "@/lib/auth";
import { useReferenceData } from "@/lib/referenceData";
import { useMidnightRefresh } from "@/lib/useMidnightRefresh";

function to12h(time: string): string {
  const [hStr, m] = time.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${suffix}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { campuses } = useReferenceData();
  const campusName = campuses.find((c) => c.value === user?.campus)?.label ?? user?.campus;
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState<string>("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("18:00");

  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  const [bookedTimetable, setBookedTimetable] = useState<TimetableSlot[]>([]);
  const [bookedBookings, setBookedBookings] = useState<Booking[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<string | null>(null);

  const [bookingVenue, setBookingVenue] = useState<Venue | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [overview, setOverview] = useState<{ free_venues: number; busy_venues: number; total_venues: number; day_of_week: string } | null>(null);

  function refreshOverview() {
    api.get("/venues/today-overview").then(({ data }) => setOverview(data));
  }

  useEffect(() => {
    api.get("/semesters").then(({ data }) => {
      setSemesters(data);
      const active = data.find((s: Semester) => s.is_active) ?? data[0];
      if (active) setSemesterId(String(active.id));
      setLoadingSemesters(false);
    });
    refreshOverview();
  }, []);

  // If the page is left open across midnight, "Free Today" shouldn't keep
  // showing yesterday's date/counts - refresh it automatically once the day changes.
  useMidnightRefresh(refreshOverview);

  function applyPreset(start: string, end: string) {
    setStartTime(start);
    setEndTime(end);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSuccessMsg(null);
    setVenues(null);
    setSearching(true);
    try {
      const [availableRes, bookedRes] = await Promise.all([
        api.get("/venues/available", {
          params: { semester_id: semesterId, date, start_time: startTime, end_time: endTime },
        }),
        api.get("/venues/booked", { params: { date } }),
      ]);
      setVenues(availableRes.data.venues);
      setMessage(availableRes.data.message);
      setBookedTimetable(bookedRes.data.timetable);
      setBookedBookings(bookedRes.data.bookings);
      setDayOfWeek(bookedRes.data.day_of_week);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Find Available Venue"
        subtitle={`Choose a semester, date and time to see available venues. Evening Study Unit/Test and weekends (Saturday/Sunday) are allowed.${campusName ? ` Campus: ${campusName}.` : ""}`}
      />

      {overview && overview.total_venues === 0 && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          No venues have been registered for your campus yet ({campusName}). Contact the Admin to add some.
        </div>
      )}

      {overview && overview.total_venues > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Free Today ({overview.day_of_week})</p>
              <p className="text-lg font-semibold text-slate-900">{overview.free_venues}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarClock size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Booked Today</p>
              <p className="text-lg font-semibold text-slate-900">{overview.busy_venues}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <DoorOpen size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Venues</p>
              <p className="text-lg font-semibold text-slate-900">{overview.total_venues}</p>
            </div>
          </Card>
        </div>
      )}

      <Card className="mb-6 p-5">
        {loadingSemesters ? (
          <Spinner label="Loading semesters..." />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset("06:00", "18:00")}
                className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
              >
                <Sun size={14} /> Daytime (06:00–18:00)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("18:00", "20:00")}
                className="flex items-center gap-1.5 rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-100"
              >
                <Moon size={14} /> Evening - Study Unit/Test (18:00–20:00)
              </button>
              <span className="flex items-center text-xs text-slate-400">or set your own time below (Saturday/Sunday allowed)</span>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Semester</label>
                <select
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                >
                  <option value="" disabled>Choose...</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                <input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                <input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
              </div>
              <div className="flex items-end">
                <button
                  disabled={searching || semesters.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
                >
                  <Search size={16} />
                  {searching ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
          </>
        )}

        {!loadingSemesters && semesters.length === 0 && (
          <p className="mt-3 text-sm text-amber-600">
            No semester has been set up yet. Ask the Admin to add one first.
          </p>
        )}
      </Card>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}
      {successMsg && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">{successMsg}</div>}

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${
            venues?.length ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"
          }`}
        >
          {venues?.length ? `${venues.length} venues available (Available Free Venues)` : "No Available Venues — no venue is available for this time."}
        </div>
      )}

      {venues && venues.length === 0 && (
        <EmptyState
          icon={CalendarSearch}
          title="No venue available"
          description="Try changing the date or time, or choose a nearby venue."
        />
      )}

      {venues && venues.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Card
              key={v.id}
              onClick={() => setBookingVenue(v)}
              className="flex cursor-pointer flex-col justify-between p-5 transition hover:border-accent-300 hover:shadow-md"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{v.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={13} /> {v.building || "—"} {v.code ? `· ${v.code}` : ""}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Users size={13} /> Capacity {v.capacity} · {v.type.replace("_", " ")}
                </p>
                {v.free_from && v.free_until && (
                  <p className="mt-2 rounded-full bg-emerald-50 px-2.5 py-1 text-center text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Free {to12h(v.free_from)} – {to12h(v.free_until)}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setBookingVenue(v); }}
                className="mt-4 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Book This Venue
              </button>
            </Card>
          ))}
        </div>
      )}

      {date && (bookedTimetable.length > 0 || bookedBookings.length > 0) && (
        <div className="space-y-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarClock size={16} /> Booked Venues — already taken {dayOfWeek ? `(${dayOfWeek})` : ""}
          </h2>

          {bookedTimetable.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500">
                <BookOpen size={13} /> Official Lecture Timetable
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bookedTimetable.map((t) => (
                  <Card key={t.id} className="p-4">
                    <p className="text-sm font-medium text-slate-800">{t.venue?.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.course_unit ?? "—"}
                      {t.lecturer_name ? ` · ${t.lecturer_name}` : ""}
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-700">{t.start_time}–{t.end_time}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {bookedBookings.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">CR Bookings</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bookedBookings.map((b) => (
                  <Card key={b.id} className="p-4">
                    <p className="text-sm font-medium text-slate-800">{b.venue?.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{b.start_time}–{b.end_time} · {b.user?.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <PurposeBadge purpose={b.purpose} />
                      <StatusBadge status={b.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {bookingVenue && (
        <BookingModal
          venue={bookingVenue}
          semesterId={semesterId}
          date={date}
          startTime={startTime}
          endTime={endTime}
          onClose={() => setBookingVenue(null)}
          onSuccess={() => {
            setBookingVenue(null);
            setVenues((prev) => prev?.filter((v) => v.id !== bookingVenue.id) ?? null);
            setOverview((prev) => prev ? { ...prev, free_venues: Math.max(0, prev.free_venues - 1), busy_venues: prev.busy_venues + 1 } : prev);
            refreshOverview();
            setSuccessMsg(`Booking for "${bookingVenue.name}" was successful and approved automatically!`);
          }}
        />
      )}
    </div>
  );
}
