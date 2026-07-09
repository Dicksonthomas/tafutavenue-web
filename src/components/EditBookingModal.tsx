"use client";

import { useState } from "react";
import axios from "axios";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking, BookingPurpose } from "@/lib/types";
import { useSettings } from "@/lib/settings";
import SignaturePad from "@/components/SignaturePad";

const PURPOSES: { value: BookingPurpose; label: string }[] = [
  { value: "study_unit", label: "Study Unit" },
  { value: "test", label: "Test" },
  { value: "makeup_class", label: "Makeup Class" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

function dayOfWeekFromDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

function isWithinStudyUnitWindow(start: string, end: string, windowStart: string): boolean {
  return start >= windowStart && (end === "00:00" || end > start);
}

const MAX_TEST_MINUTES = 60;

function durationMinutes(start: string, end: string): number {
  const effectiveEnd = end === "00:00" ? "23:59" : end;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = effectiveEnd.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/**
 * Lets a CR fix their own date/time/purpose mistake on a booking that's
 * still Pending or Approved, without cancelling and starting over. Venue
 * and semester stay fixed - only the fields a CR is likely to have
 * fat-fingered are editable here.
 */
export default function EditBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { study_unit_hours } = useSettings();
  const [date, setDate] = useState(booking.booking_date.slice(0, 10));
  const [start, setStart] = useState(booking.start_time);
  const [end, setEnd] = useState(booking.end_time);
  const [purpose, setPurpose] = useState<BookingPurpose>(booking.purpose);
  const [title, setTitle] = useState(booking.title ?? "");
  const [signature, setSignature] = useState<string | null>(booking.signature ?? null);
  const [reason, setReason] = useState("");
  const [needsReason, setNeedsReason] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const dayHours = study_unit_hours?.[dayOfWeekFromDate(date)] ?? { start: "19:00", end: "00:00" };
  const studyUnitViolation = purpose === "study_unit" && !isWithinStudyUnitWindow(start, end, dayHours.start);
  const testViolation = purpose === "test" && durationMinutes(start, end) > MAX_TEST_MINUTES;

  async function handleSubmit() {
    if (!signature) return;
    if (studyUnitViolation) {
      setError(`Study Unit bookings are only allowed from ${dayHours.start} until ${dayHours.end === "00:00" ? "midnight" : dayHours.end}.`);
      return;
    }
    if (testViolation) {
      setError("A Test booking cannot be longer than 1 hour. Please shorten the time.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.put(`/bookings/${booking.id}`, {
        venue_id: booking.venue_id,
        semester_id: booking.semester_id,
        booking_date: date,
        start_time: start,
        end_time: end,
        purpose,
        title,
        signature,
        ...(needsReason ? { reason } : {}),
      });
      onSuccess();
    } catch (err) {
      const reasonError = axios.isAxiosError(err) && err.response?.status === 422
        ? (err.response.data?.errors?.reason?.[0] as string | undefined)
        : undefined;
      if (reasonError) {
        setNeedsReason(true);
        setError(reasonError);
      } else {
        setError(apiErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <h2 className="font-semibold text-slate-900">Edit Booking: {booking.venue?.name ?? `Venue #${booking.venue_id}`}</h2>
        <p className="mb-4 mt-0.5 text-xs text-slate-500">Fix the date/time or purpose if you made a mistake.</p>

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
            {purpose === "study_unit" && (
              <p className={`mt-1 text-xs ${studyUnitViolation ? "text-red-600" : "text-slate-400"}`}>
                Study Unit bookings are only allowed from {dayHours.start} until {dayHours.end === "00:00" ? "midnight" : dayHours.end}. Longer than 4 hours total needs a reason.
              </p>
            )}
            {purpose === "test" && (
              <p className={`mt-1 text-xs ${testViolation ? "text-red-600" : "text-slate-400"}`}>
                Test bookings can be at most 1 hour (e.g. 17:00-18:00).
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title/Subject (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>

          {needsReason && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Reason - your campus Admin will review this
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Your Signature - required to confirm the change
            </label>
            {signature ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Signature captured ✓
                <button type="button" onClick={() => setSignature(null)} className="underline">Redraw</button>
              </div>
            ) : (
              <SignaturePad confirmLabel="Use This Signature" onSave={(dataUrl) => setSignature(dataUrl)} />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !signature || (needsReason && !reason.trim()) || testViolation}
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
