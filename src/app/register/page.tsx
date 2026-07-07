"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

import { Level } from "@/lib/types";
import EducationFields, { EducationValue } from "@/components/EducationFields";
import { useReferenceData } from "@/lib/referenceData";

const EMAIL_DOMAIN = "mustudent.ac.tz";
const MIN_INTAKE_YEAR = 2022;

function maxIntakeYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Onyesho la awali la email itakayotengenezwa (preview tu - uthibitisho halisi
 * unafanyika server-side). Mfano: "Dickson Musa Thomas" + "14322055/T.25"
 * -> dickson.thomas25@mustudent.ac.tz
 */
function previewEmail(name: string, regNo: string): { email: string | null; error: string | null } {
  const match = regNo.trim().match(/\.(\d{2})$/);
  if (!match) return { email: null, error: null };

  const year = 2000 + parseInt(match[1], 10);
  if (year < MIN_INTAKE_YEAR) {
    return { email: null, error: `This Reg No has too old an intake year (${year}). Contact the Admin.` };
  }
  const max = maxIntakeYear();
  if (year > max) {
    return { email: null, error: `Reg No for year ${year} is not yet allowed. Registration opens officially in October ${year}.` };
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { email: null, error: null };

  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const first = slug(parts[0]);
  const last = slug(parts[parts.length - 1]);
  const yearSuffix = match[1];

  const local = parts.length > 1 ? `${first}.${last}${yearSuffix}` : `${first}${yearSuffix}`;

  return { email: `${local}@${EMAIL_DOMAIN}`, error: null };
}

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const { logo_url, refresh: refreshSettings } = useSettings();
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [campus, setCampus] = useState("");
  const { campuses } = useReferenceData();
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
      const { data } = await api.post("/register", { name, reg_no: regNo, phone, sex, campus, ...edu });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      refreshSettings();
      router.push("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          {logo_url ? (
            <img src={logo_url} alt="Logo" className="mb-3 h-11 w-11 rounded-xl object-contain" />
          ) : (
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-800 text-white">
              <Building2 size={22} />
            </div>
          )}
          <h1 className="text-lg font-semibold text-slate-900">CR Registration</h1>
          <p className="text-sm text-slate-500">Class Representative Registration</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="col-span-full">
              <label className="mb-1 block text-sm font-medium text-slate-600">Campus</label>
              <select
                required
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="" disabled>Choose Campus...</option>
                {campuses.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-full">
              <label className="mb-1 block text-sm font-medium text-slate-600">Full Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>

            <div className="col-span-full">
              <label className="mb-1 block text-sm font-medium text-slate-600">Reg No</label>
              <input
                required
                placeholder="e.g. 14322055/T.25"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
              {preview.error && <p className="mt-1 text-xs text-red-600">{preview.error}</p>}
              {preview.email && (
                <p className="mt-1 text-xs text-slate-500">
                  Your email will be: <span className="font-medium text-accent-700">{preview.email}</span>
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Your email and password will be generated automatically and sent to that email.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Phone Number</label>
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Sex</label>
              <select
                required
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="" disabled>Choose...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <EducationFields value={edu} onChange={setEdu} campus={campus} />

            <button
              type="submit"
              disabled={submitting}
              className="col-span-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-700 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
