"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { Card, EmptyState, PageHeader, Spinner } from "@/components/ui";
import { confirmAction } from "@/lib/confirm";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
        subtitle="Manage administrator accounts. The Super Admin cannot be removed."
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

      {loading ? (
        <Spinner />
      ) : admins.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No admins found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {admins.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{a.name}</p>
                  <p className="truncate text-xs text-slate-500">{a.email}</p>
                </div>
                {a.is_super_admin ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    <ShieldCheck size={12} /> Super Admin
                  </span>
                ) : (
                  <button
                    onClick={() => removeAdmin(a)}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddAdminForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/admin/admins", { name, email, password });
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
        <button disabled={submitting} className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50">
          {submitting ? "Saving..." : "Add Admin"}
        </button>
      </form>
    </Card>
  );
}
