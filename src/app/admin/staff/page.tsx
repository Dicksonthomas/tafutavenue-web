"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Briefcase, Check, Pencil, Search, Trash2, X } from "lucide-react";
import Pagination from "@/components/Pagination";
import { api, apiErrorMessage } from "@/lib/api";
import { User } from "@/lib/types";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { useDebouncedValue } from "@/lib/useDebounce";
import { useReferenceData } from "@/lib/referenceData";
import { confirmAction } from "@/lib/confirm";
import PageSizeSelect from "@/components/PageSizeSelect";
import { campusBadgeClasses } from "@/lib/campusColors";

function campusLabel(value: string | undefined, campuses: { value: string; label: string }[]): string {
  if (!value) return "—";
  return campuses.find((c) => c.value === value)?.label ?? value;
}

interface PaginatedUsers {
  data: User[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function isPending(u: User): boolean {
  return !u.is_active && !u.approved_at;
}

export default function AdminStaffPage() {
  const searchParams = useSearchParams();
  const [campusFilter, setCampusFilter] = useState(searchParams.get("campus") ?? "");
  const { campuses } = useReferenceData();

  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("20");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const debouncedQ = useDebouncedValue(q, 350);

  async function load(query = debouncedQ, pageNum = page, perPageVal = perPage) {
    setLoading(true);
    const { data } = await api.get("/admin/users", {
      params: {
        role: "staff",
        ...(query ? { q: query } : {}),
        ...(campusFilter ? { campus: campusFilter } : {}),
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
  }, [debouncedQ, campusFilter]);

  useEffect(() => {
    load(debouncedQ, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    setPage(1);
    load(debouncedQ, 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  async function approveStaff(u: User) {
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

  async function deleteUser(u: User) {
    const ok = await confirmAction(
      `Their personal information (name, email, phone) will be deleted, but their booking history will remain on record.`,
      { title: `Remove Staff "${u.name}"?`, confirmText: "Yes, remove" }
    );
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/users/${u.id}`);
      setSuccessMsg(`Staff "${u.name}" has been removed. Their history has been preserved.`);
      load(debouncedQ, page);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const users = result?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Staff"
        subtitle="Staff register themselves and need Admin approval before they can sign in and book meeting rooms."
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {successMsg && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-2 text-xs underline">Close</button>
        </div>
      )}

      {editingUser && (
        <EditStaffModal
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
            placeholder="Search by name, email, staff ID or position... (live search)"
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
        {campusFilter && (
          <button onClick={() => setCampusFilter("")} className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
            <X size={14} /> Clear Filter
          </button>
        )}
      </div>

      {!loading && result && (
        <p className="mb-4 text-sm font-medium text-slate-600">
          {result.total} Staff account{result.total === 1 ? "" : "s"} found{campusFilter || q ? " matching your search/filters" : ""}.
        </p>
      )}

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState icon={Briefcase} title="No Staff yet" description="Staff will appear here once they self-register." />
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Name / Staff ID</th>
                  <th className="px-4 py-3">Email / Phone</th>
                  <th className="px-4 py-3">Campus</th>
                  <th className="px-4 py-3">Position</th>
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
                      {u.staff_id && <p className="text-xs text-slate-400">{u.staff_id}</p>}
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
                    <td className="px-4 py-3 text-slate-600">{u.position || "—"}</td>
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
                        {isPending(u) && (
                          <button
                            onClick={() => approveStaff(u)}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            <Check size={12} /> {busyId === u.id ? "Approving..." : "Approve"}
                          </button>
                        )}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {result && (
            <Pagination page={result.current_page} lastPage={result.last_page} total={result.total} itemLabel="Staff" onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

function EditStaffModal({
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
  const [staffId, setStaffId] = useState(user.staff_id ?? "");
  const [email, setEmail] = useState(user.email);
  const [position, setPosition] = useState(user.position ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [campus, setCampus] = useState(user.campus ?? "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        staff_id: staffId,
        email,
        position: position || null,
        phone,
        campus,
        is_active: isActive,
      };
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
          <h2 className="font-semibold text-slate-900">Edit Staff: {user.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input required placeholder="Staff ID / Payroll No" value={staffId} onChange={(e) => setStaffId(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input required placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input type="password" placeholder="New Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

          <select required value={campus} onChange={(e) => setCampus(e.target.value)} className="col-span-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none">
            <option value="" disabled>Choose Campus...</option>
            {campuses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <label className="col-span-full flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Account Active
          </label>

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
