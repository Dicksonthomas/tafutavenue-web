"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export interface StudyUnitHours {
  [day: string]: { start: string; end: string };
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
}

interface SettingsContextValue extends AppSettings {
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
 * Derive the -700 (hover), -500 (lighter fill, e.g. active sidebar pill) and
 * -50 (soft badge tint) shades from the admin's chosen -600 base color, using
 * HSL lightness rather than a flat per-channel RGB offset - a flat offset can
 * shift hue unevenly and, for some picked colors, produce a washed-out or
 * off-toned "filled" look on hover/active states. Lightness is clamped so
 * white text stays readable on -500/-600/-700 regardless of how light or
 * dark the picked color is.
 */
export function deriveAccentShades(hex: string): { 500: string; 700: string; 50: string } {
  const [h, s, l] = hexToHsl(hex);
  return {
    700: hslToHex(h, s, clamp(l - 10, 8, 42)),
    500: hslToHex(h, s, clamp(l + 6, 20, 58)),
    50: hslToHex(h, Math.min(s, 50), 95),
  };
}

export const DEFAULT_LOGIN_BACKGROUND_COLOR = "#002d62";

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
  root.style.setProperty("--color-accent-700", shades[700]);
  root.style.setProperty("--color-accent-500", shades[500]);
  root.style.setProperty("--color-accent-50", shades[50]);
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
  });

  const load = useCallback(() => {
    return api.get("/settings").then(({ data }) => {
      setSettings(data);
      if (data.primary_color) applyColor(data.primary_color);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <SettingsContext.Provider value={{ ...settings, refresh: load }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
