"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X, DoorOpen, UploadCloud, Link2, Pencil, Search } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { BookingPurpose, Level, Semester, Venue, VenueStatus, VenueType } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner, VenueStatusBadge } from "@/components/ui";
import { useDebouncedValue } from "@/lib/useDebounce";
import { useReferenceData } from "@/lib/referenceData";

const TYPES: VenueType[] = ["lecture_hall", "laboratory", "seminar_room", "hall", "other"];
const STATUSES: VenueStatus[] = ["available", "maintenance", "disabled"];
const PURPOSES: BookingPurpose[] = ["study_unit", "test", "makeup_class", "meeting", "other"];
const LEVELS: Level[] = ["Certificate", "Diploma", "Degree", "Masters", "PhD"];

/** Mfano wa link ya timetable kwa kila campus - Admin bado anaweza kuibadilisha. */
const CAMPUS_EXAMPLE_URLS: Record<string, string> = {
  morogoro_main: "https://mutimetable.mzumbe.ac.tz/timetables/teaching/semestertwo_2025_2026_all_programmes/",
  dar_es_salaam: "https://dcctimetable.mzumbe.ac.tz/dcctimetables/teaching/drft_25_26/",
};

interface VenueRestrictions {
  blocked_purposes: BookingPurpose[];
  restricted_levels: Level[];
  restricted_department: string;
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [q, setQ] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const { campuses } = useReferenceData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showLinkImport, setShowLinkImport] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const debouncedQ = useDebouncedValue(q, 300);

  async function load(query = debouncedQ, campus = campusFilter) {
    setLoading(true);
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (campus) params.campus = campus;
    const { data } = await api.get("/admin/venues", { params });
    setVenues(data.data ?? data);
    setLoading(false);
  }

  useEffect(() => {
    load(debouncedQ, campusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, campusFilter]);

  async function updateStatus(venue: Venue, status: VenueStatus) {
    setError(null);
    try {
      await api.put(`/admin/venues/${venue.id}`, { status });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function remove(venue: Venue) {
    if (!confirm(`Futa venue "${venue.name}"?`)) return;
    setError(null);
    try {
      await api.delete(`/admin/venues/${venue.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Venues"
        subtitle="Simamia venue zote za chuo - ongeza mpya, weka masharti ya ku-book, badilisha status, au futa."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowLinkImport((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {showLinkImport ? <X size={16} /> : <Link2 size={16} />}
              {showLinkImport ? "Funga" : "Vuta kwa Link"}
            </button>
            <button
              onClick={() => setShowImport((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {showImport ? <X size={16} /> : <UploadCloud size={16} />}
              {showImport ? "Funga" : "Import CSV"}
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Funga" : "Ongeza Venue"}
            </button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tafuta venue kwa jina, code au jengo... (live search)"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none"
          />
        </div>
        <select
          value={campusFilter}
          onChange={(e) => setCampusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
        >
          <option value="">Campus Zote</option>
          {campuses.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {showLinkImport && (
        <ImportFromLinkForm
          onImported={() => {
            setShowLinkImport(false);
            load();
          }}
        />
      )}

      {showImport && (
        <ImportTimetableForm
          onImported={() => {
            setShowImport(false);
            load();
          }}
        />
      )}

      {showForm && (
        <VenueForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {editingVenue && (
        <VenueEditModal
          venue={editingVenue}
          onClose={() => setEditingVenue(null)}
          onSaved={() => {
            setEditingVenue(null);
            load();
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : venues.length === 0 ? (
        <EmptyState icon={DoorOpen} title="Hakuna venue bado" description="Bonyeza 'Ongeza Venue' kuanza." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {v.name} {v.code && <span className="text-xs font-normal text-slate-400">({v.code})</span>}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {v.building || "—"} · Uwezo: {v.capacity} · {v.type.replace("_", " ")}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-brand-700">
                    {campuses.find((c) => c.value === v.campus)?.label ?? v.campus}
                  </p>
                </div>
                <VenueStatusBadge status={v.status} />
              </div>

              {(v.blocked_purposes?.length || v.restricted_levels?.length || v.restricted_department) ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {v.blocked_purposes?.map((p) => (
                    <span key={p} className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] text-red-600">Hakuna {p.replace("_", " ")}</span>
                  ))}
                  {v.restricted_levels?.length ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{v.restricted_levels.join("/")} pekee</span>
                  ) : null}
                  {v.restricted_department && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">{v.restricted_department} pekee</span>
                  )}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <select
                  value={v.status}
                  onChange={(e) => updateStatus(v, e.target.value as VenueStatus)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs focus:border-accent-500 focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={() => setEditingVenue(v)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil size={13} /> Masharti
                </button>
                <button onClick={() => remove(v)} className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  <Trash2 size={13} /> Futa
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function RestrictionFields({
  value,
  onChange,
}: {
  value: VenueRestrictions;
  onChange: (v: VenueRestrictions) => void;
}) {
  function togglePurpose(p: BookingPurpose) {
    const set = new Set(value.blocked_purposes);
    set.has(p) ? set.delete(p) : set.add(p);
    onChange({ ...value, blocked_purposes: Array.from(set) });
  }

  function toggleLevel(l: Level) {
    const set = new Set(value.restricted_levels);
    set.has(l) ? set.delete(l) : set.add(l);
    onChange({ ...value, restricted_levels: Array.from(set) });
  }

  return (
    <div className="col-span-full space-y-3 rounded-lg bg-slate-50 p-3">
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Purpose zisizoruhusiwa hapa (mfano Kingalu/Labs: Study Unit &amp; Test)</p>
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <label key={p} className="flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs">
              <input type="checkbox" checked={value.blocked_purposes.includes(p)} onChange={() => togglePurpose(p)} />
              {p.replace("_", " ")}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Level pekee zinazoruhusiwa (mfano venue za Masters/PhD)</p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <label key={l} className="flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-xs">
              <input type="checkbox" checked={value.restricted_levels.includes(l)} onChange={() => toggleLevel(l)} />
              {l}
            </label>
          ))}
        </div>
        <p className="mt-0.5 text-[11px] text-slate-400">Usichague yoyote kama venue hii ni ya wote.</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-slate-600">Department pekee inayoruhusiwa (mfano Ntare 112 = Law)</p>
        <input
          placeholder="mfano: Public Law (acha wazi kama ni ya wote)"
          value={value.restricted_department}
          onChange={(e) => onChange({ ...value, restricted_department: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

function VenueForm({ onCreated }: { onCreated: () => void }) {
  const { campuses } = useReferenceData();
  const [form, setForm] = useState({
    name: "",
    code: "",
    building: "",
    faculty: "",
    campus: "",
    capacity: 50,
    type: "lecture_hall" as VenueType,
    description: "",
  });
  const [restrictions, setRestrictions] = useState<VenueRestrictions>({
    blocked_purposes: [],
    restricted_levels: [],
    restricted_department: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/admin/venues", {
        ...form,
        blocked_purposes: restrictions.blocked_purposes,
        restricted_levels: restrictions.restricted_levels,
        restricted_department: restrictions.restricted_department || null,
      });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6 p-5">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {error && <div className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <input required placeholder="Jina la venue" value={form.name} onChange={(e) => update("name", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input placeholder="Code (hiari)" value={form.code} onChange={(e) => update("code", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input placeholder="Jengo/Building" value={form.building} onChange={(e) => update("building", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input placeholder="Faculty" value={form.faculty} onChange={(e) => update("faculty", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <select required value={form.campus} onChange={(e) => update("campus", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="" disabled>Chagua Campus...</option>
          {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input required type="number" min={0} placeholder="Uwezo (capacity)" value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <select value={form.type} onChange={(e) => update("type", e.target.value as VenueType)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea placeholder="Maelezo (hiari)" value={form.description} onChange={(e) => update("description", e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

        <RestrictionFields value={restrictions} onChange={setRestrictions} />

        <button disabled={submitting} className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Inahifadhi..." : "Hifadhi Venue"}
        </button>
      </form>
    </Card>
  );
}

function VenueEditModal({
  venue,
  onClose,
  onSaved,
}: {
  venue: Venue;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [restrictions, setRestrictions] = useState<VenueRestrictions>({
    blocked_purposes: venue.blocked_purposes ?? [],
    restricted_levels: venue.restricted_levels ?? [],
    restricted_department: venue.restricted_department ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.put(`/admin/venues/${venue.id}`, {
        blocked_purposes: restrictions.blocked_purposes,
        restricted_levels: restrictions.restricted_levels,
        restricted_department: restrictions.restricted_department || null,
      });
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Masharti ya Booking: {venue.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          <RestrictionFields value={restrictions} onChange={setRestrictions} />
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">Ghairi</button>
            <button disabled={submitting} className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {submitting ? "Inahifadhi..." : "Hifadhi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ImportModeChoice({
  existingSlots,
  mode,
  onChange,
}: {
  existingSlots: number | null;
  mode: "add" | "replace";
  onChange: (m: "add" | "replace") => void;
}) {
  if (existingSlots === null || existingSlots === 0) return null;

  return (
    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
      <p className="mb-2 font-medium">
        Tayari kuna ratiba {existingSlots} kwa semester hii. Unataka nini?
      </p>
      <label className="mb-1 flex items-center gap-2">
        <input type="radio" checked={mode === "add"} onChange={() => onChange("add")} />
        Ongeza Mpya (usifute zilizopo, ruka zinazofanana)
      </label>
      <label className="flex items-center gap-2">
        <input type="radio" checked={mode === "replace"} onChange={() => onChange("replace")} />
        Badilisha Zote (futa za zamani kwanza, kisha weka mpya)
      </label>
    </div>
  );
}

function ImportFromLinkForm({ onImported }: { onImported: () => void }) {
  const { campuses } = useReferenceData();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [campus, setCampus] = useState("");
  const [url, setUrl] = useState("");
  const [existingSlots, setExistingSlots] = useState<number | null>(null);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/semesters").then(({ data }) => {
      setSemesters(data);
      const active = data.find((s: Semester) => s.is_active) ?? data[0];
      if (active) setSemesterId(String(active.id));
    });
  }, []);

  useEffect(() => {
    if (!semesterId || !campus) return;
    api.get("/admin/venues/timetable-status", { params: { semester_id: semesterId, campus } }).then(({ data }) => {
      setExistingSlots(data.existing_slots);
    });
  }, [semesterId, campus]);

  function handleCampusChange(value: string) {
    setCampus(value);
    if (!url && CAMPUS_EXAMPLE_URLS[value]) setUrl(CAMPUS_EXAMPLE_URLS[value]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const { data } = await api.post("/admin/timetable/import-from-link", { semester_id: Number(semesterId), campus, url, mode });
      setMessage(data.message);
      onImported();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6 p-5">
      <p className="mb-3 text-xs text-slate-500">
        Bandika link ya ukurasa wa semester husika kutoka <span className="font-medium">mutimetable.mzumbe.ac.tz</span> (mfano ukurasa wa
        &quot;Teaching Timetable&quot; wa semester husika) - mfumo utavuta venues zote na ratiba (course, lecturer, muda) moja kwa moja.
        Inaweza kuchukua sekunde kadhaa.
      </p>

      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Campus</label>
            <select
              value={campus}
              onChange={(e) => handleCampusChange(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:w-auto"
            >
              <option value="" disabled>Chagua Campus...</option>
              {campuses.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Semester</label>
            <select
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:w-auto"
            >
              <option value="" disabled>Chagua...</option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <ImportModeChoice existingSlots={existingSlots} mode={mode} onChange={setMode} />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Link ya Timetable</label>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          />
        </div>
        <button disabled={submitting} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Inavuta Ratiba... (subiri)" : "Vuta Ratiba Sasa"}
        </button>
      </form>
    </Card>
  );
}

function ImportTimetableForm({ onImported }: { onImported: () => void }) {
  const { campuses } = useReferenceData();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [campus, setCampus] = useState("");
  const [existingSlots, setExistingSlots] = useState<number | null>(null);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/semesters").then(({ data }) => {
      setSemesters(data);
      const active = data.find((s: Semester) => s.is_active) ?? data[0];
      if (active) setSemesterId(String(active.id));
    });
  }, []);

  useEffect(() => {
    if (!semesterId || !campus) return;
    api.get("/admin/venues/timetable-status", { params: { semester_id: semesterId, campus } }).then(({ data }) => {
      setExistingSlots(data.existing_slots);
    });
  }, [semesterId, campus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !semesterId || !campus) return;
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("semester_id", semesterId);
      formData.append("campus", campus);
      formData.append("file", file);
      formData.append("mode", mode);
      const { data } = await api.post("/admin/venues/import-timetable", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(data.message);
      if (fileRef.current) fileRef.current.value = "";
      onImported();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6 p-5">
      <p className="mb-3 text-xs text-slate-500">
        Pakia CSV yenye columns: <span className="font-mono">day_of_week,start_time,end_time,venue_name,venue_code,building,capacity,course_unit,lecturer_name,program</span>.
      </p>

      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Campus</label>
          <select
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          >
            <option value="" disabled>Chagua Campus...</option>
            {campuses.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Semester</label>
          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
          >
            <option value="" disabled>Chagua...</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.txt" required className="text-sm" />
        <button disabled={submitting} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Inaingiza..." : "Ingiza Timetable"}
        </button>
        <div className="w-full">
          <ImportModeChoice existingSlots={existingSlots} mode={mode} onChange={setMode} />
        </div>
      </form>
    </Card>
  );
}
