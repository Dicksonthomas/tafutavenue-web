"use client";

import { Mail, Phone, Building2, GraduationCap, Layers, BookOpenCheck, IdCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const fields = [
    { icon: IdCard, label: "Reg No", value: user.reg_no || "—" },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Namba ya Simu", value: user.phone || "—" },
    { icon: Building2, label: "Faculty", value: user.faculty || "—" },
    { icon: Layers, label: "Department", value: user.department || "—" },
    { icon: BookOpenCheck, label: "Program", value: user.program || "—" },
    { icon: GraduationCap, label: "Level", value: user.level || "—" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Profile Yangu" subtitle="Taarifa zako kama Class Representative (CR)." />

      <Card className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-600 text-xl font-semibold text-white">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
            <span className="inline-flex items-center rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-200">
              Class Representative
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <f.icon size={16} className="mt-0.5 text-slate-400" />
              <div>
                <dt className="text-xs text-slate-500">{f.label}</dt>
                <dd className="text-sm font-medium text-slate-800">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-slate-400">
          Kubadilisha taarifa hizi, wasiliana na Admin wa mfumo.
        </p>
      </Card>
    </div>
  );
}
