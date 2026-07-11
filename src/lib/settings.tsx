"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface StudyUnitHours {
  [day: string]: { start: string; end: string };
}

export interface RegistrationWindow {
  open_from: string | null;
  open_until: string | null;
}

interface AppSettings {
  primary_color: string | null;
  default_color: string | null;
  logo_url: string | null;
  app_name: string | null;
  support_phone: string | null;
  footer_text: string | null;
  footer_link: string | null;
  login_background_color: string | null;
  study_unit_hours: StudyUnitHours | null;
  cr_registration_closed_campuses: string[];
  cr_registration_windows: Record<string, RegistrationWindow>;
  staff_registration_windows: Record<string, RegistrationWindow>;
  staff_registration_closed_campuses: string[];
  marquee_enabled: boolean;
  marquee_until: string | null;
  maintenance_mode: boolean;
  maintenance_until: string | null;
}

interface SettingsContextValue extends AppSettings {
  /** True until the first /settings fetch resolves (success or failure) -
   * check this before treating a null field (e.g. logo_url) as "genuinely
   * not set", so the UI can show a neutral placeholder instead of flashing
   * a fallback that then gets replaced once the real value arrives. */
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  primary_color: null,
  default_color: null,
  logo_url: null,
  app_name: null,
  support_phone: null,
  footer_text: null,
  footer_link: null,
  login_background_color: null,
  study_unit_hours: null,
  cr_registration_closed_campuses: [],
  cr_registration_windows: {},
  staff_registration_windows: {},
  staff_registration_closed_campuses: [],
  marquee_enabled: true,
  marquee_until: null,
  maintenance_mode: false,
  maintenance_until: null,
  loading: true,
  refresh: () => Promise.resolve(),
});

function hexToHsl(hex: string): [number, number, number] {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = ((num >> 16) & 0xff) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(clamp(x, 0, 1) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Derive the full -50..-800 scale from the admin's chosen -600 base color,
 * using HSL lightness rather than a flat per-channel RGB offset - a flat
 * offset can shift hue unevenly and, for some picked colors, produce a
 * washed-out or off-toned "filled" look on hover/active states. Bounds are
 * wide (not tightly clamped) so this stays monotonic - each step lighter or
 * darker than the last - for BOTH light and dark base colors; a tight clamp
 * tuned only for dark bases would invert the ordering for a light one (e.g.
 * a pastel button color ending up with a "-500" that's darker than "-600").
 */
export function deriveAccentShades(hex: string): { 50: string; 100: string; 200: string; 300: string; 400: string; 500: string; 700: string; 800: string } {
  const [h, s, l] = hexToHsl(hex);
  return {
    800: hslToHex(h, s, clamp(l - 18, 3, 90)),
    700: hslToHex(h, s, clamp(l - 10, 4, 92)),
    500: hslToHex(h, s, clamp(l + 6, 6, 94)),
    400: hslToHex(h, Math.min(s, 70), clamp(l + 14, 8, 94)),
    300: hslToHex(h, Math.min(s, 60), clamp(l + 24, 10, 95)),
    200: hslToHex(h, Math.min(s, 55), clamp(l + 34, 15, 96)),
    100: hslToHex(h, Math.min(s, 45), clamp(l + 42, 20, 97)),
    50: hslToHex(h, Math.min(s, 50), 95),
  };
}

/**
 * Same idea as deriveAccentShades, but anchored at -800 (the picked color is
 * used exactly as-is for -800, matching how the sidebar/login background has
 * always been keyed off the "-800" slot) instead of -600. Only derives the
 * shades actually referenced anywhere in the UI (badges, hover, nav text).
 */
export function deriveBrandShades(hex: string): { 50: string; 100: string; 200: string; 300: string; 700: string; 800: string } {
  const [h, s, l] = hexToHsl(hex);
  return {
    800: hex,
    700: hslToHex(h, s, clamp(l + 8, 10, 90)),
    300: hslToHex(h, Math.min(s, 45), clamp(l + 40, 35, 92)),
    200: hslToHex(h, Math.min(s, 38), clamp(l + 50, 45, 95)),
    100: hslToHex(h, Math.min(s, 30), clamp(l + 58, 55, 97)),
    50: hslToHex(h, Math.min(s, 25), 96),
  };
}

export const DEFAULT_LOGIN_BACKGROUND_COLOR = "#0284c7";

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function defaultStudyUnitHours(): StudyUnitHours {
  return Object.fromEntries(WEEK_DAYS.map((day) => [day, { start: "19:00", end: "00:00" }]));
}

/** Pick a text color (white or black) that reads well against the given hex background. */
export function getReadableTextColor(hex: string): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? "#1e293b" : "#ffffff";
}

function applyColor(hex: string) {
  const shades = deriveAccentShades(hex);
  const root = document.documentElement;
  root.style.setProperty("--color-accent-600", hex);
  root.style.setProperty("--color-accent-800", shades[800]);
  root.style.setProperty("--color-accent-700", shades[700]);
  root.style.setProperty("--color-accent-500", shades[500]);
  root.style.setProperty("--color-accent-400", shades[400]);
  root.style.setProperty("--color-accent-300", shades[300]);
  root.style.setProperty("--color-accent-200", shades[200]);
  root.style.setProperty("--color-accent-100", shades[100]);
  root.style.setProperty("--color-accent-50", shades[50]);
}

/** Colors the sidebar (desktop + mobile drawer) and a handful of "brand"
 * badges/avatars app-wide - driven by the same color as the login page
 * background, so an Admin only has to pick one color for both. */
function applyBrandColor(hex: string) {
  const shades = deriveBrandShades(hex);
  const root = document.documentElement;
  root.style.setProperty("--color-brand-800", shades[800]);
  root.style.setProperty("--color-brand-700", shades[700]);
  root.style.setProperty("--color-brand-300", shades[300]);
  root.style.setProperty("--color-brand-200", shades[200]);
  root.style.setProperty("--color-brand-100", shades[100]);
  root.style.setProperty("--color-brand-50", shades[50]);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    primary_color: null,
    default_color: null,
    logo_url: null,
    app_name: null,
    support_phone: null,
    footer_text: null,
    footer_link: null,
    login_background_color: null,
    study_unit_hours: null,
    cr_registration_closed_campuses: [],
    cr_registration_windows: {},
    staff_registration_windows: {},
    staff_registration_closed_campuses: [],
    marquee_enabled: true,
    marquee_until: null,
    maintenance_mode: false,
    maintenance_until: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return api
      .get("/settings")
      .then(({ data }) => {
        setSettings(data);
        if (data.primary_color) applyColor(data.primary_color);
        applyBrandColor(data.login_background_color || DEFAULT_LOGIN_BACKGROUND_COLOR);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <SettingsContext.Provider value={{ ...settings, loading, refresh: load }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
