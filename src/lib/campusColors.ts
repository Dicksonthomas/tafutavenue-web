/**
 * Distinct colors for each campus, so they can be told apart at a glance.
 * Color basis: teal/green is already the Mzumbe "brand" in this system
 * (see brand-800 #002f3a and BRAND_DEFAULT_COLOR #3db166 in Settings), and
 * gold/amber as seen on www.mu.ac.tz as a secondary color.
 */
export const CAMPUS_BADGE_CLASSES: Record<string, string> = {
  morogoro_main: "bg-teal-50 text-teal-700 ring-teal-200",
  dar_es_salaam: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  tanga: "bg-amber-50 text-amber-700 ring-amber-200",
  mbeya: "bg-violet-50 text-violet-700 ring-violet-200",
};

const DEFAULT_CAMPUS_BADGE = "bg-slate-100 text-slate-600 ring-slate-200";

export function campusBadgeClasses(campus: string | undefined | null): string {
  if (!campus) return DEFAULT_CAMPUS_BADGE;
  return CAMPUS_BADGE_CLASSES[campus] ?? DEFAULT_CAMPUS_BADGE;
}
