"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ClipboardList, PenLine } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import { api, apiErrorMessage } from "@/lib/api";
import { Booking } from "@/lib/types";
import { Card, EmptyState, PageHeader, PurposeBadge, Spinner, StatusBadge } from "@/components/ui";
import { confirmAction } from "@/lib/confirm";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/bookings");
    setBookings(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelBooking(id: number) {
    const ok = await confirmAction("Booking hii itaghairiwa na huwezi kuitumia tena.", { title: "Ghairi booking hii?", confirmText: "Ndiyo, ghairi" });
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
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Bookings Zangu" subtitle="Fuatilia maombi yako yote ya venue na uthibitishe kwa saini." />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {loading ? (
        <Spinner />
      ) : bookings.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Huna booking yoyote bado" description="Nenda 'Tafuta Venue' kutengeneza booking mpya." />
      ) : (
        <div className="space-y-3">
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
                        <PenLine size={12} /> Imesainiwa
                      </span>
                    )}
                  </div>
                  {b.rejection_reason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Sababu ya kukataliwa: {b.rejection_reason}
                    </p>
                  )}
                  {b.signature && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-slate-400">Saini Yako</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.signature} alt="Saini" className="h-16 rounded border border-slate-200 bg-white" />
                    </div>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-4 flex gap-2">
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
                    Tia Digital Signature
                  </button>
                )}
              </div>

              {signingId === b.id && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs text-slate-500">Chora saini yako hapa chini kuthibitisha booking:</p>
                  <SignaturePad saving={busy} onSave={(dataUrl) => submitSignature(b.id, dataUrl)} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
