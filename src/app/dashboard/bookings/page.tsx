"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ClipboardList, PenLine } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import EditBookingModal from "@/components/EditBookingModal";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";
import ShowMoreButton from "@/components/ShowMoreButton";
import { confirmAction } from "@/lib/confirm";

const EDITABLE_STATUSES = ["pending", "approved"];
const EDIT_WINDOW_MS = 10 * 60 * 1000;

const SHOW_STEP = 9;

/** Mirrors BookingController::EDIT_WINDOW_MINUTES on the backend, which is
 * the actual source of truth - this is just so the button disappears on its
 * own instead of staying clickable and failing with a 422. */
function isWithinEditWindow(b: Booking): boolean {
  if (!b.created_at) return false;
  return Date.now() - new Date(b.created_at).getTime() <= EDIT_WINDOW_MS;
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [perPage, setPerPage] = useState(SHOW_STEP);
  const [total, setTotal] = useState(0);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forces a re-render every 30s so the Edit button disappears on its own
  // once a booking's 10-minute edit window passes, without needing a
  // page refresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  async function load(withPerPage = perPage) {
    const { data } = await api.get("/bookings", { params: { per_page: withPerPage } });
    setBookings(data.data ?? data);
    setTotal(data.total ?? (data.data ?? data).length);
  }

  useEffect(() => {
    setLoading(true);
    load(SHOW_STEP).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function showMore() {
    setLoadingMore(true);
    const next = perPage + SHOW_STEP;
    setPerPage(next);
    await load(next);
    setLoadingMore(false);
  }

  async function cancelBooking(id: number) {
    const ok = await confirmAction("This booking will be cancelled and you won't be able to use it again.", { title: "Cancel this booking?", confirmText: "Yes, cancel" });
    if (!ok) return;
    setError(null);
    try {
      await api.post(`/bookings/${id}/cancel`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function submitSignature(id: number, dataUrl: string) {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/bookings/${id}/sign`, { signature: dataUrl });
      setSigningId(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="My Bookings" subtitle="Track all your venue requests and confirm with a signature." />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={ClipboardList} title="You have no bookings yet" description="Go to 'Find Venue' to make a new booking." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{b.venue?.name ?? `Venue #${b.venue_id}`}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <CalendarClock size={13} />
                    {b.booking_date?.slice(0, 10)} · {b.start_time}–{b.end_time}
                  </p>
                  {b.title && <p className="mt-1 text-sm text-slate-600">{b.title}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PurposeBadge purpose={b.purpose} />
                    {b.signed_at && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        <PenLine size={12} /> Signed
                      </span>
                    )}
                  </div>
                  {b.reason && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Your reason (beyond daily limit): {b.reason}
                    </p>
                  )}
                  {b.status === "approved" && b.approver && (
                    <p className="mt-2 text-xs text-slate-400">Approved by {b.approver.name}</p>
                  )}
                  {b.rejection_reason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Rejection reason: {b.rejection_reason}
                    </p>
                  )}
                  {b.signature && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-slate-400">Your Signature</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.signature} alt="Signature" className="h-16 rounded border border-slate-200 bg-white" />
                    </div>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-4 flex gap-2">
                {EDITABLE_STATUSES.includes(b.status) && isWithinEditWindow(b) && (
                  <button onClick={() => setEditingBooking(b)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Edit
                  </button>
                )}
                {b.status === "pending" && (
                  <button onClick={() => cancelBooking(b.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Cancel Booking
                  </button>
                )}
                {b.status === "approved" && !b.signed_at && (
                  <button
                    onClick={() => setSigningId(signingId === b.id ? null : b.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Add Digital Signature
                  </button>
                )}
              </div>

              {signingId === b.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs text-slate-500">Draw your signature below to confirm the booking:</p>
                  <SignaturePad saving={busy} onSave={(dataUrl) => submitSignature(b.id, dataUrl)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && bookings.length < total && (
        <ShowMoreButton onClick={showMore} loading={loadingMore} />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
            setEditingBooking(null);
            load();
          }}
        />
      )}
    </div>
  );
}
