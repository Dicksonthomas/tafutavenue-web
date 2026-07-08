"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useReferenceData } from "@/lib/referenceData";
import { campusBadgeClasses } from "@/lib/campusColors";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { confirmAction } from "@/lib/confirm";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  campus: string | null;
  is_super_admin: boolean;
  is_main_super_admin: boolean;
}

export default function AdminAdminsPage() {
  const { user } = useAuth();
  const { campuses } = useReferenceData();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/admin/admins");
    setAdmins(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function removeAdmin(admin: AdminUser) {
    const ok = await confirmAction("This admin will lose access permanently.", { title: `Remove "${admin.name}"?`, confirmText: "Yes, remove" });
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/admins/${admin.id}`);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Admins"
        subtitle="Manage administrator accounts. The Super Admin cannot be removed, but can edit their own name, email and password."
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-700"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Close" : "Add Admin"}
          </button>
        }
      />

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>}

      {showForm && (
        <AddAdminForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSaved={() => {
            setEditingAdmin(null);
            load();
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : admins.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No admins found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a, idx) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-3 text-slate-600">{a.email}</td>
                  <td className="px-4 py-3">
                    {a.campus ? (
                      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${campusBadgeClasses(a.campus)}`}>
                        {campuses.find((c) => c.value === a.campus)?.label ?? a.campus}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">All Campuses</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.is_main_super_admin ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <ShieldCheck size={12} /> Super Admin Mkuu
                      </span>
                    ) : a.is_super_admin ? (
                      <span className="flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        <ShieldCheck size={12} /> Super Admin
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Admin</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.is_main_super_admin ? (
                      a.id === user?.id ? (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditingAdmin(a)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            <Pencil size={12} /> Edit My Details
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-slate-400">—</span>
                      )
                    ) : (
                      <div className="flex justify-end gap-1">
                        {user?.is_super_admin && (
                          <button
                            onClick={() => setEditingAdmin(a)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        )}
                        {a.id !== user?.id && (
                          <button
                            onClick={() => removeAdmin(a)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function AddAdminForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const { campuses } = useReferenceData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [campus, setCampus] = useState("");
  const [makeSuperAdmin, setMakeSuperAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/admin/admins", {
        name,
        email,
        password,
        ...(makeSuperAdmin ? { is_super_admin: true } : { campus }),
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
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {error && <div className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <input required type="password" minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
        <select
          required={!makeSuperAdmin}
          disabled={makeSuperAdmin}
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="" disabled>Choose Campus...</option>
          {campuses.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {user?.is_main_super_admin && (
          <label className="col-span-full flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={makeSuperAdmin} onChange={(e) => setMakeSuperAdmin(e.target.checked)} className="rounded border-slate-300" />
            Make this a Super Admin (sees and manages all campuses)
          </label>
        )}
        <button disabled={submitting} className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Saving..." : "Add Admin"}
        </button>
      </form>
    </Card>
  );
}

function EditAdminModal({ admin, onClose, onSaved }: { admin: AdminUser; onClose: () => void; onSaved: () => void }) {
  const { user, setUser } = useAuth();
  const { campuses } = useReferenceData();
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [password, setPassword] = useState("");
  const [campus, setCampus] = useState(admin.campus ?? "");
  const [isSuperAdmin, setIsSuperAdmin] = useState(admin.is_super_admin);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canPromote = !!user?.is_main_super_admin && !admin.is_main_super_admin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { name, email };
      if (password) payload.password = password;
      if (canPromote) {
        payload.is_super_admin = isSuperAdmin;
        if (!isSuperAdmin) payload.campus = campus;
      } else if (!admin.is_super_admin) {
        payload.campus = campus;
      }
      const { data } = await api.put(`/admin/admins/${admin.id}`, payload);
      if (user && admin.id === user.id) {
        setUser({ ...user, name: data.user.name, email: data.user.email });
      }
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
          <h2 className="font-semibold text-slate-900">Edit Admin: {admin.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
          <input type="password" minLength={8} placeholder="New Password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />

          {!canPromote && !admin.is_super_admin && (
            <select
              required
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
            >
              <option value="" disabled>Choose Campus...</option>
              {campuses.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          )}

          {canPromote && (
            <div className="space-y-2 rounded-lg bg-slate-50 p-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={isSuperAdmin} onChange={(e) => setIsSuperAdmin(e.target.checked)} className="rounded border-slate-300" />
                Make this a Super Admin (sees and manages all campuses)
              </label>
              {isSuperAdmin ? (
                <p className="text-xs text-slate-500">
                  A promoted Super Admin can manage regular admins and see all campuses, but cannot edit, demote or remove the main Super Admin.
                </p>
              ) : (
                <select
                  required
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
                >
                  <option value="" disabled>Choose Campus...</option>
                  {campuses.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
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
