"use client";

import { useEffect, useState } from "react";
import { CalendarRange, CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Semester } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/semesters");
    setSemesters(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(id: number) {
    setError(null);
    try {
      await api.post(`/admin/semesters/${id}/activate`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Semesters"
        subtitle="Semester inayotumika (active) ndiyo huonekana kwa CR wakati wa kutafuta venue."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Funga" : "Ongeza Semester"}
          </button>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {showForm && (
        <SemesterForm
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {editingSemester && (
        <SemesterForm
          semester={editingSemester}
          onDone={() => {
            setEditingSemester(null);
            load();
          }}
          onCancel={() => setEditingSemester(null)}
        />
      )}

      {loading ? (
        <Spinner />
      ) : semesters.length === 0 ? (
        <EmptyState icon={CalendarRange} title="Hakuna semester bado" description="Ongeza semester ya kwanza kuanza kupokea bookings." />
      ) : (
        <div className="space-y-3">
          {semesters.map((s) => (
            <Card key={s.id} className="flex items-center justify-between p-5">
              <div>
                <h3 className="font-semibold text-slate-900">{s.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.academic_year} · Semester {s.semester_number} · {s.start_date?.slice(0, 10)} hadi {s.end_date?.slice(0, 10)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.is_active ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <CheckCircle2 size={13} /> Active
                  </span>
                ) : (
                  <button onClick={() => activate(s.id)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Fanya Active
                  </button>
                )}
                <button onClick={() => setEditingSemester(s)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil size={13} /> Hariri
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SemesterForm({
  semester,
  onDone,
  onCancel,
}: {
  semester?: Semester;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    name: semester?.name ?? "",
    academic_year: semester?.academic_year ?? "",
    semester_number: semester?.semester_number ?? 1,
    start_date: semester?.start_date?.slice(0, 10) ?? "",
    end_date: semester?.end_date?.slice(0, 10) ?? "",
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
      if (semester) {
        await api.put(`/admin/semesters/${semester.id}`, form);
      } else {
        await api.post("/admin/semesters", form);
      }
      onDone();
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

        <input required placeholder="Jina (mfano: Semester I 2025/2026)" value={form.name} onChange={(e) => update("name", e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input required placeholder="Academic Year (2025/2026)" value={form.academic_year} onChange={(e) => update("academic_year", e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <select value={form.semester_number} onChange={(e) => update("semester_number", Number(e.target.value))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value={1}>Semester 1</option>
          <option value={2}>Semester 2</option>
          <option value={3}>Semester 3</option>
        </select>
        <div />
        <div>
          <label className="mb-1 block text-xs text-slate-500">Tarehe ya Kuanza</label>
          <input required type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Tarehe ya Mwisho</label>
          <input required type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        </div>

        <div className="col-span-full flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Ghairi
            </button>
          )}
          <button disabled={submitting} className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
            {submitting ? "Inahifadhi..." : semester ? "Hifadhi Mabadiliko" : "Hifadhi Semester"}
          </button>
        </div>
      </form>
    </Card>
  );
}
