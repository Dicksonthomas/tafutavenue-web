"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Download, GraduationCap, Pencil, Plus, Printer, Search, Trash2, Upload, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import { api, apiErrorMessage, blobErrorMessage } from "@/lib/api";
import { Level, User } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/lib/useDebounce";
import EducationFields, { EducationValue } from "@/components/EducationFields";
import { useReferenceData } from "@/lib/referenceData";
import { confirmAction } from "@/lib/confirm";
import PageSizeSelect from "@/components/PageSizeSelect";
import { campusBadgeClasses } from "@/lib/campusColors";

function campusLabel(value: string | undefined, campuses: { value: string; label: string }[]): string {
  if (!value) return "—";
  return campuses.find((c) => c.value === value)?.label ?? value;
}

function isPending(u: User): boolean {
  return !u.is_active && !u.approved_at;
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
    return { email: null, error: `This Reg No has too old an intake year (${year}). Use "Enter Email Manually".` };
  }
  const max = maxIntakeYear();
  if (year > max) {
    return { email: null, error: `Reg No for year ${year} is not yet allowed (opens in October ${year}).` };
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
  per_page: number;
}

export default function AdminStudentsPage() {
  const searchParams = useSearchParams();
  const [campusFilter, setCampusFilter] = useState(searchParams.get("campus") ?? "");
  const [facultyFilter, setFacultyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");

  const { campuses, faculties, departmentsByFaculty, programs, levelYears } = useReferenceData(campusFilter || undefined);
  const departmentOptions = facultyFilter
    ? (departmentsByFaculty[facultyFilter] ?? [])
    : Array.from(new Set(Object.values(departmentsByFaculty).flat())).sort();
  const maxYearOption = Object.values(levelYears).length > 0 ? Math.max(...Object.values(levelYears)) : 4;
  const yearOptions = Array.from({ length: maxYearOption }, (_, i) => i + 1);

  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("20");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [printing, setPrinting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const debouncedQ = useDebouncedValue(q, 350);

  const filters = {
    campus: campusFilter,
    faculty: facultyFilter,
    department: departmentFilter,
    program: programFilter,
    level: levelFilter,
    year_of_study: yearFilter,
    sex: sexFilter,
  };
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function clearFilters() {
    setCampusFilter("");
    setFacultyFilter("");
    setDepartmentFilter("");
    setProgramFilter("");
    setLevelFilter("");
    setYearFilter("");
    setSexFilter("");
  }

  async function load(query = debouncedQ, pageNum = page, perPageVal = perPage) {
    setLoading(true);
    const { data } = await api.get("/admin/users", {
      params: {
        ...(query ? { q: query } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        page: pageNum,
        per_page: perPageVal,
      },
    });
    setResult(data);
    setLoading(false);
  }

  useEffect(() => {
    setPage(1);
    load(debouncedQ, 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, campusFilter, facultyFilter, departmentFilter, programFilter, levelFilter, yearFilter, sexFilter]);

  async function printList() {
    setError(null);
    setPrinting(true);
    try {
      const res = await api.get("/admin/users/export-pdf", {
        params: {
          ...(debouncedQ ? { q: debouncedQ } : {}),
          ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "cr_list.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(await blobErrorMessage(err));
    } finally {
      setPrinting(false);
    }
  }

  // When Faculty changes, the selected Department might not belong to the
  // new faculty - clear it so it doesn't keep filtering incorrectly.
  useEffect(() => {
    if (facultyFilter && departmentFilter && !(departmentsByFaculty[facultyFilter] ?? []).includes(departmentFilter)) {
      setDepartmentFilter("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyFilter]);

  useEffect(() => {
    load(debouncedQ, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    setPage(1);
    load(debouncedQ, 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  async function approveCr(u: User) {
    setError(null);
    setBusyId(u.id);
    try {
      const { data } = await api.post(`/admin/users/${u.id}/approve`);
      setSuccessMsg(data.message);
      load(debouncedQ, page);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectCr(u: User) {
    const ok = await confirmAction(
      "This account was never approved and has no booking history - it will be deleted completely and cannot be recovered.",
      { title: `Reject CR registration "${u.name}"?`, confirmText: "Yes, reject and delete" }
    );
    if (!ok) return;
    setError(null);
    setBusyId(u.id);
    try {
      const { data } = await api.post(`/admin/users/${u.id}/reject`);
      setSuccessMsg(data.message);
      load(debouncedQ, page);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(u: User) {
    const ok = await confirmAction(
      `Their personal information (name, email, phone) will be deleted, but their booking history will remain on record.`,
      { title: `Remove CR "${u.name}"?`, confirmText: "Yes, remove" }
    );
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setSuccessMsg(`CR "${u.name}" has been removed. Their history has been preserved.`);
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
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Students (CR)"
        subtitle="Self-registered CRs need your approval before they can sign in (Pending below). You can also add or import CRs directly here - their password is emailed to them right away."
        action={
          <div className="flex flex-wrap gap-2">
            <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Download size={16} /> Download Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Upload size={16} /> {importing ? "Importing..." : "Import CSV"}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleImport} className="hidden" />
            <button onClick={printList} disabled={printing} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              <Printer size={16} /> {printing ? "Preparing..." : "Print List"}
            </button>
            <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close" : "Add CR"}
            </button>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-2 text-xs underline">Close</button>
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
                    <th className="pb-1 pr-4">Name</th>
                    <th className="pb-1 pr-4">Reg No</th>
                    <th className="pb-1">Email (Password sent there)</th>
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
            <p className="mt-2 text-xs text-amber-600">Skipped: {importResult.skipped.join(", ")}</p>
          )}
          <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-slate-400 underline">Close</button>
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

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, reg no or program... (live search)"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:outline-none"
          />
          {loading && q && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">...</span>
          )}
        </div>
        <PageSizeSelect value={perPage} onChange={setPerPage} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Campuses</option>
          {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Faculties</option>
          {faculties.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Departments</option>
          {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Programs</option>
          {programs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Levels</option>
          {Object.keys(levelYears).map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Years</option>
          {yearOptions.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select value={sexFilter} onChange={(e) => setSexFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="">All Sexes</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <X size={14} /> Clear Filters
          </button>
        )}
      </div>

      {!loading && result && (
        <p className="mb-4 text-sm font-medium text-slate-600">
          {result.total} CR{result.total === 1 ? "" : "s"} found{hasActiveFilters || q ? " matching your search/filters" : ""}.
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No CR yet" description="Add a CR or import CSV to get started." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name / Reg No</th>
                  <th className="px-4 py-3">Email / Phone</th>
                  <th className="px-4 py-3">Campus</th>
                  <th className="px-4 py-3">Faculty / Department</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Sex</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-400">
                      {((result?.current_page ?? 1) - 1) * (result?.per_page ?? 0) + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.name}</p>
                      {u.reg_no && <p className="text-xs text-slate-400">{u.reg_no}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">{u.email}</p>
                      <p className="text-xs text-slate-400">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${campusBadgeClasses(u.campus)}`}>
                        {campusLabel(u.campus, campuses)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.faculty} · {u.department}</td>
                    <td className="px-4 py-3 text-slate-600">{u.program}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                        {u.level} - Year {u.year_of_study ?? "?"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.sex === "male" ? "Male" : u.sex === "female" ? "Female" : "—"}</td>
                    <td className="px-4 py-3">
                      {isPending(u) ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>
                      ) : u.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Suspended</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {isPending(u) ? (
                          <>
                            <button
                              onClick={() => approveCr(u)}
                              disabled={busyId === u.id}
                              className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <Check size={12} /> {busyId === u.id ? "Approving..." : "Approve"}
                            </button>
                            <button
                              onClick={() => rejectCr(u)}
                              disabled={busyId === u.id}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <X size={12} /> Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => deleteUser(u)}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {result && (
            <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="CR" onPageChange={setPage} />
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

        <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:col-span-1" />

        {useManualEmail ? (
          <input required type="email" placeholder="Email (manual)" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        ) : (
          <div className="col-span-2">
            <input required placeholder="Reg No (e.g. 14322055/T.25)" value={regNo} onChange={(e) => setRegNo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
            {preview.error && <p className="mt-1 text-xs text-red-600">{preview.error}</p>}
            {preview.email && <p className="mt-1 text-xs text-slate-500">Email: <span className="font-medium text-accent-700">{preview.email}</span></p>}
          </div>
        )}

        <button
          type="button"
          onClick={() => setUseManualEmail((v) => !v)}
          className="col-span-full -mt-1 text-left text-xs text-slate-400 underline"
        >
          {useManualEmail ? "Use Reg No instead" : "Problem with Reg No? Enter Email Manually"}
        </button>

        <input required placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

        <select required value={campus} onChange={(e) => setCampus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="" disabled>Choose Campus...</option>
          {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select required value={sex} onChange={(e) => setSex(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
          <option value="" disabled>Sex...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <EducationFields value={edu} onChange={setEdu} campus={campus} />

        <button disabled={submitting} className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Registering..." : "Register CR"}
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
  const [regNo, setRegNo] = useState(user.reg_no ?? "");
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
      const payload: Record<string, unknown> = { name, reg_no: regNo || null, phone, campus, sex, is_active: isActive, ...edu };
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
          <h2 className="font-semibold text-slate-900">Edit CR: {user.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none sm:col-span-1" />
          <input placeholder="Reg No (e.g. 14322055/T.25)" value={regNo} onChange={(e) => setRegNo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input required placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input type="password" placeholder="New Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

          <select required value={campus} onChange={(e) => setCampus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="" disabled>Choose Campus...</option>
            {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select required value={sex} onChange={(e) => setSex(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="" disabled>Sex...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <EducationFields value={edu} onChange={setEdu} campus={campus} />

          <label className="col-span-full flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Account Active
          </label>

          <p className="col-span-full text-xs text-slate-400">
            If the name or Reg No is changed, a new email will be generated automatically (as long as a Reg No is set) and sent to them.
          </p>

          <div className="col-span-full flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button disabled={submitting} className="flex-1 rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
