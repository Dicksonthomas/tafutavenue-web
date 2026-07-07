"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, GraduationCap, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Level, User } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/lib/useDebounce";
import EducationFields, { EducationValue } from "@/components/EducationFields";
import { useReferenceData } from "@/lib/referenceData";
import { confirmAction } from "@/lib/confirm";

function campusLabel(value: string | undefined, campuses: { value: string; label: string }[]): string {
  if (!value) return "—";
  return campuses.find((c) => c.value === value)?.label ?? value;
}

const EMAIL_DOMAIN = "mustudent.ac.tz";
const MIN_INTAKE_YEAR = 2022;

function maxIntakeYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

interface ImportResult {
  message: string;
  created: { name: string; reg_no: string; email: string }[];
  skipped: string[];
}

function previewEmail(name: string, regNo: string): { email: string | null; error: string | null } {
  const match = regNo.trim().match(/\.(\d{2})$/);
  if (!match) return { email: null, error: null };

  const year = 2000 + parseInt(match[1], 10);
  if (year < MIN_INTAKE_YEAR) {
    return { email: null, error: `Reg No hii ina mwaka wa nyuma sana (${year}). Tumia "Weka Email Mwenyewe".` };
  }
  const max = maxIntakeYear();
  if (year > max) {
    return { email: null, error: `Reg No ya mwaka ${year} bado haijaruhusiwa (inafunguliwa Oktoba ${year}).` };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { email: null, error: null };

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = slug(parts[0]);
  const last = slug(parts[parts.length - 1]);
  const local = parts.length > 1 ? `${first}.${last}${match[1]}` : `${first}${match[1]}`;

  return { email: `${local}@${EMAIL_DOMAIN}`, error: null };
}

interface PaginatedUsers {
  data: User[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminStudentsPage() {
  const { campuses } = useReferenceData();
  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedQ = useDebouncedValue(q, 350);

  async function load(query = "", pageNum = 1) {
    setLoading(true);
    const { data } = await api.get("/admin/users", { params: { ...(query ? { q: query } : {}), page: pageNum } });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    load(debouncedQ, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    load(debouncedQ, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function deleteUser(u: User) {
    const ok = await confirmAction(
      `Taarifa zake binafsi (jina, email, simu) zitafutwa, lakini historia ya bookings zake itabaki kwa rekodi.`,
      { title: `Futa CR "${u.name}"?`, confirmText: "Ndiyo, futa" }
    );
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setSuccessMsg(`CR "${u.name}" amefutwa. Historia yake imehifadhiwa.`);
      load(debouncedQ, page);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function downloadTemplate() {
    const res = await api.get("/admin/users/import-template", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cr_import_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImportResult(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/admin/users/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      await load(debouncedQ, page);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const users = result?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Wanafunzi (CR)"
        subtitle="Sajili CR mmoja mmoja au ingiza wengi kwa mkupuo kupitia CSV/Excel. Email na password hutengenezwa kiotomatiki na kutumwa kwa CR husika."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Download size={16} /> Pakua Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Upload size={16} /> {importing ? "Inaingiza..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleImport} className="hidden" />
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Funga" : "Ongeza CR"}
            </button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-2 text-xs underline">Funga</button>
        </div>
      )}

      {importResult && (
        <Card className="mb-4 p-4">
          <p className="text-sm font-medium text-slate-800">{importResult.message}</p>
          {importResult.created.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-1 pr-4">Jina</th>
                    <th className="pb-1 pr-4">Reg No</th>
                    <th className="pb-1">Email (Password imetumwa huko)</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult.created.map((c) => (
                    <tr key={c.email} className="border-t border-slate-100">
                      <td className="py-1 pr-4">{c.name}</td>
                      <td className="py-1 pr-4 font-mono">{c.reg_no}</td>
                      <td className="py-1 font-mono">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {importResult.skipped.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">Zilizorukwa: {importResult.skipped.join(", ")}</p>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-slate-400 underline">Funga</button>
        </Card>
      )}

      {showForm && (
        <StudentForm
          onCreated={(message) => {
            setShowForm(false);
            setSuccessMsg(message);
            load(debouncedQ, page);
          }}
        />
      )}

      {editingUser && (
        <EditStudentModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(message) => {
            setEditingUser(null);
            setSuccessMsg(message);
            load(debouncedQ, page);
          }}
        />
      )}

      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tafuta kwa jina, email, reg no au program... (live search)"
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none"
        />
        {loading && q && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">...</span>
        )}
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Hakuna CR bado" description="Ongeza CR mmoja au import CSV kuanza." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{u.name}</p>
                    {u.reg_no && <p className="text-xs text-slate-400">{u.reg_no}</p>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      <Pencil size={12} /> Hariri
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={12} /> Futa
                    </button>
                  </div>
                </div>
                <p className="mt-2 truncate text-xs text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-500">{u.phone}</p>
                <p className="mt-1 text-xs text-slate-400">{u.faculty} · {u.department}</p>
                <p className="truncate text-xs text-slate-400">{u.program}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {campusLabel(u.campus, campuses)}
                  </span>
                  <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                    {u.level} - Mwaka {u.year_of_study ?? "?"}
                  </span>
                  {u.sex && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {u.sex === "male" ? "Male" : "Female"}
                    </span>
                  )}
                  {!u.is_active && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Amesimamishwa</span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {result && result.last_page > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Nyuma
              </button>
              <span className="text-sm text-slate-500">
                Ukurasa {result.current_page} kati ya {result.last_page} ({result.total} CR)
              </span>
              <button
                disabled={page >= result.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Mbele <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StudentForm({ onCreated }: { onCreated: (message: string) => void }) {
  const { campuses } = useReferenceData();
  const [useManualEmail, setUseManualEmail] = useState(false);
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [campus, setCampus] = useState("");
  const [sex, setSex] = useState("");
  const [edu, setEdu] = useState<EducationValue>({
    faculty: "",
    department: "",
    program: "",
    level: "Degree" as Level,
    year_of_study: 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => previewEmail(name, regNo), [name, regNo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = useManualEmail
        ? { name, email, phone, campus, sex, ...edu }
        : { name, reg_no: regNo, phone, campus, sex, ...edu };
      const { data } = await api.post("/admin/users", payload);
      onCreated(data.message);
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

        <input required placeholder="Jina Kamili" value={name} onChange={(e) => setName(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:col-span-1" />

        {useManualEmail ? (
          <input required type="email" placeholder="Email (mwenyewe)" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        ) : (
          <div className="col-span-2">
            <input required placeholder="Reg No (mfano: 14322055/T.25)" value={regNo} onChange={(e) => setRegNo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
            {preview.error && <p className="mt-1 text-xs text-red-600">{preview.error}</p>}
            {preview.email && <p className="mt-1 text-xs text-slate-500">Email: <span className="font-medium text-accent-700">{preview.email}</span></p>}
          </div>
        )}

        <button
          type="button"
          onClick={() => setUseManualEmail((v) => !v)}
          className="col-span-full -mt-1 text-left text-xs text-slate-400 underline"
        >
          {useManualEmail ? "Tumia Reg No badala yake" : "Reg No ina tatizo? Weka Email Mwenyewe"}
        </button>

        <input required placeholder="Namba ya Simu" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

        <select required value={campus} onChange={(e) => setCampus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="" disabled>Chagua Campus...</option>
          {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select required value={sex} onChange={(e) => setSex(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="" disabled>Jinsia...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <EducationFields value={edu} onChange={setEdu} campus={campus} />

        <button disabled={submitting} className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Inasajili..." : "Sajili CR"}
        </button>
      </form>
    </Card>
  );
}

function EditStudentModal({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { campuses } = useReferenceData();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [campus, setCampus] = useState(user.campus ?? "");
  const [sex, setSex] = useState(user.sex ?? "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [edu, setEdu] = useState<EducationValue>({
    faculty: user.faculty ?? "",
    department: user.department ?? "",
    program: user.program ?? "",
    level: (user.level ?? "Degree") as Level,
    year_of_study: user.year_of_study ?? 1,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { name, phone, campus, sex, is_active: isActive, ...edu };
      if (password) payload.password = password;
      const { data } = await api.put(`/admin/users/${user.id}`, payload);
      onSaved(data.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Hariri CR: {user.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input required placeholder="Jina Kamili" value={name} onChange={(e) => setName(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:col-span-1" />
          <input required placeholder="Namba ya Simu" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input type="password" placeholder="Password Mpya (hiari)" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

          <select required value={campus} onChange={(e) => setCampus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="" disabled>Chagua Campus...</option>
            {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select required value={sex} onChange={(e) => setSex(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="" disabled>Jinsia...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <EducationFields value={edu} onChange={setEdu} campus={campus} />

          <label className="col-span-full flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Akaunti Active (mzima)
          </label>

          <p className="col-span-full text-xs text-slate-400">
            Jina likibadilika, email mpya itatengenezwa kiotomatiki (kama ana Reg No) na kutumwa kwake.
          </p>

          <div className="col-span-full flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">Ghairi</button>
            <button disabled={submitting} className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {submitting ? "Inahifadhi..." : "Hifadhi Mabadiliko"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
