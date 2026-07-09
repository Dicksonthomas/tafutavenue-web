"use client";

import { CheckCircle2, PenLine } from "lucide-react";

/**
 * Shown right after a booking is created, so a CR who mis-picked a date/time
 * knows immediately (not after digging through "My Bookings") that they have
 * a short window to fix it themselves - matches the 10-minute edit window
 * enforced server-side in BookingController::update().
 */
export default function BookingSuccessModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={28} />
        </div>
        <h2 className="font-semibold text-slate-900">Booking Successful</h2>
        <p className="mt-1 text-sm text-slate-600">{message}</p>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2.5 text-left text-xs text-accent-700">
          <PenLine size={14} className="mt-0.5 shrink-0" />
          <span>
            Made a mistake with the date or time? You can edit this booking from &quot;My Bookings&quot; within{" "}
            <b>10 minutes</b> of submitting it. After that, editing is locked.
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}
