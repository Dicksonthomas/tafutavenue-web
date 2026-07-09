"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking, BookingPurpose } from "@/lib/types";

const PURPOSES: { value: BookingPurpose; label: string }[] = [
  { value: "study_unit", label: "Study Unit" },
  { value: "test", label: "Test" },
  { value: "makeup_class", label: "Makeup Class" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

/**
 * Lets an Admin correct a CR's booking (date/time/purpose) - e.g. the CR
 * picked the wrong date and can't fix it themselves, or the Admin spots a
 * clash before approving. Doesn't touch status/approval - editing alone
 * never implies approve/reject, those stay separate buttons.
 */
export default function AdminEditBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(booking.booking_date.slice(0, 10));
  const [start, setStart] = useState(booking.start_time);
  const [end, setEnd] = useState(booking.end_time);
  const [purpose, setPurpose] = useState<BookingPurpose>(booking.purpose);
  const [title, setTitle] = useState(booking.title ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await api.put(`/admin/bookings/${booking.id}`, {
        venue_id: booking.venue_id,
        semester_id: booking.semester_id,
        booking_date: date,
        start_time: start,
        end_time: end,
        purpose,
        title,
      });
      onSuccess();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-0.5 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Edit Booking</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-500">
          {booking.venue?.name ?? `Venue #${booking.venue_id}`} · for {booking.user?.name ?? `User #${booking.user_id}`}
        </p>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as BookingPurpose)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title/Subject (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
