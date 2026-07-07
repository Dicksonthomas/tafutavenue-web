"use client";

import { useMemo, useState } from "react";
import { CalendarClock, BookOpen, Search, User2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking, TimetableSlot } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function BookedVenuesPage() {
  const [date, setDate] = useState(todayIso());
  const [timetable, setTimetable] = useState<TimetableSlot[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [dayOfWeek, setDayOfWeek] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filteredTimetable = useMemo(() => {
    if (!timetable) return timetable;
    const query = q.trim().toLowerCase();
    if (!query) return timetable;
    return timetable.filter((t) =>
      [t.venue?.name, t.course_unit, t.lecturer_name, t.program]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(query))
    );
  }, [timetable, q]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setQ("");
    setLoading(true);
    try {
      const { data } = await api.get("/venues/booked", { params: { date } });
      setTimetable(data.timetable);
      setBookings(data.bookings);
      setDayOfWeek(data.day_of_week);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Booked Venues"
        subtitle="Angalia venue zilizoshikwa (mihadhara rasmi na bookings) kwa tarehe fulani - asubuhi hadi jioni."
      />

      <Card className="mb-6 p-5">
        <form onSubmit={search} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tarehe</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
            <Search size={16} /> Angalia
          </button>
          {dayOfWeek && <span className="text-sm text-slate-500">Siku: {dayOfWeek}</span>}
        </form>
      </Card>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading && <Spinner />}

      {!loading && timetable && bookings && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BookOpen size={16} /> Ratiba Rasmi ya Mihadhara na Lecturer (Timetable)
            </h2>

            {timetable.length > 0 && (
              <div className="relative mb-3">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tafuta kwa venue, course, lecturer au program... (live search)"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
              </div>
            )}

            {timetable.length === 0 ? (
              <EmptyState icon={BookOpen} title="Hakuna mhadhara rasmi siku hii" />
            ) : filteredTimetable && filteredTimetable.length === 0 ? (
              <EmptyState icon={Search} title="Hakuna kilicholingana na utafutaji wako" description="Jaribu neno lingine." />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTimetable?.map((t) => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800">{t.venue?.name}</p>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                        <CalendarClock size={13} /> {t.start_time}–{t.end_time}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{t.course_unit ?? "—"} · {t.program ?? "—"}</p>
                    {t.lecturer_name && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-accent-700">
                        <User2 size={12} /> {t.lecturer_name}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarClock size={16} /> Bookings za CR (Study Units / Tests)
            </h2>
            {bookings.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Hakuna booking siku hii" />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bookings.map((b) => (
                  <Card key={b.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{b.venue?.name}</p>
                        <p className="text-xs text-slate-500">Booked by {b.user?.name}</p>
                        <p className="text-xs text-slate-500">{b.start_time}–{b.end_time}</p>
                        {b.title && <p className="mt-0.5 truncate text-xs text-slate-500">{b.title}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={b.status} />
                        <PurposeBadge purpose={b.purpose} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
