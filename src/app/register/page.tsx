"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";

import { Level } from "@/lib/types";
import EducationFields, { EducationValue } from "@/components/EducationFields";
import { useReferenceData } from "@/lib/referenceData";

const EMAIL_DOMAIN = "mustudent.ac.tz";
const MIN_INTAKE_YEAR = 2022;
const STAFF_TITLES = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Eng", "CPA"];

function maxIntakeYear(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * Preview of the email that will be generated (preview only - actual
 * validation happens server-side). Example: "Dickson Musa Thomas" +
 * "14322055/T.25" -> dickson.thomas25@mustudent.ac.tz
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
  const {
    logo_url,
    loading: settingsLoading,
    refresh: refreshSettings,
    cr_registration_closed_campuses,
    staff_registration_open_from,
    staff_registration_open_until,
  } = useSettings();
  const { campuses } = useReferenceData();
  const crFullyClosed = campuses.length > 0 && campuses.every((c) => cr_registration_closed_campuses.includes(c.value));
  const todayIso = new Date().toISOString().slice(0, 10);
  const staffFullyClosed =
    (!!staff_registration_open_from && todayIso < staff_registration_open_from) ||
    (!!staff_registration_open_until && todayIso > staff_registration_open_until);
  const [mode, setMode] = useState<"cr" | "staff">("cr");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState("");
  const [campus, setCampus] = useState("");
  const [edu, setEdu] = useState<EducationValue>({
    faculty: "",
    department: "",
    program: "",
    level: "Degree" as Level,
    year_of_study: 1,
  });
  const [staffId, setStaffId] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string; pending: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => previewEmail(name, regNo), [name, regNo]);
  const crClosedForSelectedCampus = mode === "cr" && !!campus && cr_registration_closed_campuses.includes(campus);

  // If CR registration has been closed for every campus, only Staff
  // registration makes sense - force the mode and never show the CR tab.
  // Same the other way if Staff registration is outside its open window.
  useEffect(() => {
    if (crFullyClosed && !staffFullyClosed && mode === "cr") setMode("staff");
    if (staffFullyClosed && !crFullyClosed && mode === "staff") setMode("cr");
  }, [crFullyClosed, staffFullyClosed, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "staff") {
        const { data } = await api.post("/register-staff", {
          name,
          title: title || null,
          staff_id: staffId,
          email: staffEmail,
          phone,
          position,
          campus,
        });
        // No token is issued for a pending Staff account - it can't be used
        // to sign in until an Admin approves it, so we don't touch auth state.
        setCredentials({ email: data.user.email, password: data.password, pending: true });
        return;
      }

      const { data } = await api.post("/register", { name, reg_no: regNo, phone, sex, campus, ...edu });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      refreshSettings();
      // Shown once, right here - not emailed - so save-and-continue below
      // is the only way to see this password again.
      setCredentials({ email: data.user.email, password: data.password, pending: false });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function copyPassword() {
    if (!credentials) return;
    navigator.clipboard.writeText(credentials.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (credentials) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              {credentials.pending ? "Registration Submitted" : "Account Created"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {credentials.pending
                ? "An Admin must approve your account before you can sign in. Save your password below - you will need it once approved."
                : "Save your login details below - you will need the password to sign in again later. It is shown only this once."}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {credentials.email}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-800">
                    {credentials.password}
                  </div>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push(credentials.pending ? "/login" : "/dashboard")}
              className="mt-6 w-full rounded-lg bg-accent-600 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              {credentials.pending ? "I've Saved It - Go to Login" : "I've Saved It - Continue to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          {settingsLoading ? (
            <div className="mb-3 h-11 w-11 rounded-xl bg-slate-100" />
          ) : (
            <img src={logo_url || "/default-logo.jpg"} alt="Logo" className="mb-3 h-11 w-11 rounded-xl object-contain" />
          )}
          <h1 className="text-lg font-semibold text-slate-900">Registration</h1>
          <p className="text-sm text-slate-500">
            {mode === "cr" ? "Class Representative Registration" : "University Staff Registration"}
          </p>
        </div>

        {!crFullyClosed && !staffFullyClosed && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("cr")}
              className={`rounded-md py-1.5 ${mode === "cr" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              Class Representative
            </button>
            <button
              type="button"
              onClick={() => setMode("staff")}
              className={`rounded-md py-1.5 ${mode === "staff" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              Staff
            </button>
          </div>
        )}

        {staffFullyClosed && mode === "staff" && (
          <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
            Staff registration is currently closed. Contact the Admin.
          </div>
        )}

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
              {crClosedForSelectedCampus && (
                <p className="mt-1 text-xs text-red-600">
                  CR registration is closed for this campus. Register as Staff instead, or contact the Admin.
                </p>
              )}
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

            {mode === "cr" ? (
              <>
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
                    Your email and password will be generated automatically and shown to you after registering.
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
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Title</label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  >
                    <option value="">Choose (optional)...</option>
                    {STAFF_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Staff ID / Payroll No</label>
                  <input
                    required
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Position</label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Registrar Officer"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>

                <div className="col-span-full">
                  <label className="mb-1 block text-sm font-medium text-slate-600">Official Email</label>
                  <input
                    required
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="you@mzumbe.ac.tz"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Your password will be generated automatically and shown to you after registering. Your account
                    needs Admin approval before you can sign in.
                  </p>
                </div>

                <div className="col-span-full">
                  <label className="mb-1 block text-sm font-medium text-slate-600">Phone Number</label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting || crClosedForSelectedCampus || (mode === "staff" && staffFullyClosed)}
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
