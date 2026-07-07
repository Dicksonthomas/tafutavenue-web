"use client";

import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "@/lib/api";
import { BookingPurpose, Semester, Venue } from "@/lib/types";
import SignaturePad from "@/components/SignaturePad";

const PURPOSES: { value: BookingPurpose; label: string }[] = [
  { value: "study_unit", label: "Study Unit" },
  { value: "test", label: "Test" },
  { value: "makeup_class", label: "Makeup Class" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

const STUDY_UNIT_START = "19:00";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isWithinStudyUnitWindow(start: string, end: string): boolean {
  return start >= STUDY_UNIT_START && (end === "00:00" || end > start);
}

export default function BookingModal({
  venue,
  semesterId,
  date,
  startTime,
  endTime,
  onClose,
  onSuccess,
}: {
  venue: Venue;
  semesterId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [internalSemesterId, setInternalSemesterId] = useState(semesterId ?? "");
  const [internalDate, setInternalDate] = useState(date ?? todayIso());
  const [internalStart, setInternalStart] = useState(startTime ?? "19:00");
  const [internalEnd, setInternalEnd] = useState(endTime ?? "20:00");

  const [purpose, setPurpose] = useState<BookingPurpose>("study_unit");
  const [title, setTitle] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsOwnSchedule = !semesterId || !date || !startTime || !endTime;

  useEffect(() => {
    if (!semesterId) {
      api.get("/semesters").then(({ data }) => {
        setSemesters(data);
        const active = data.find((s: Semester) => s.is_active) ?? data[0];
        if (active) setInternalSemesterId(String(active.id));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveStart = startTime ?? internalStart;
  const effectiveEnd = endTime ?? internalEnd;
  const studyUnitViolation = purpose === "study_unit" && !isWithinStudyUnitWindow(effectiveStart, effectiveEnd);

  async function handleSubmit() {
    if (!signature) return;
    if (studyUnitViolation) {
      setError("Study Unit bookings are only allowed between 19:00 and 00:00 (7 PM - midnight).");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        venue_id: venue.id,
        semester_id: Number(semesterId ?? internalSemesterId),
        booking_date: date ?? internalDate,
        start_time: effectiveStart,
        end_time: effectiveEnd,
        purpose,
        title,
        signature,
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
        <h2 className="font-semibold text-slate-900">Book: {venue.name}</h2>

        {!needsOwnSchedule ? (
          <p className="mb-4 mt-0.5 text-xs text-slate-500">{date} · {startTime}–{endTime}</p>
        ) : (
          <p className="mb-4 mt-0.5 text-xs text-slate-500">Choose the date and time you want to book.</p>
        )}

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="space-y-3">
          {needsOwnSchedule && (
            <>
              {!semesterId && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Semester</label>
                  <select value={internalSemesterId} onChange={(e) => setInternalSemesterId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
                    <option value="" disabled>Choose...</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {!date && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                  <input type="date" value={internalDate} onChange={(e) => setInternalDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
                </div>
              )}
              {(!startTime || !endTime) && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">From</label>
                    <input type="time" value={internalStart} onChange={(e) => setInternalStart(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">To</label>
                    <input type="time" value={internalEnd} onChange={(e) => setInternalEnd(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value as BookingPurpose)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            {purpose === "study_unit" && (
              <p className={`mt-1 text-xs ${studyUnitViolation ? "text-red-600" : "text-slate-400"}`}>
                Study Unit bookings are only allowed between 19:00 and 00:00 (evening).
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Title/Subject (optional)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Structures Study Group" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Your Signature (Digital Signature) - required to confirm the booking
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
              disabled={submitting || !signature}
              className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
