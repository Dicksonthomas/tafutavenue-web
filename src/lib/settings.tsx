"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

interface AppSettings {
  primary_color: string | null;
  default_color: string | null;
  logo_url: string | null;
  app_name: string | null;
  support_phone: string | null;
}

interface SettingsContextValue extends AppSettings {
  refresh: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  primary_color: null,
  default_color: null,
  logo_url: null,
  app_name: null,
  support_phone: null,
  refresh: () => {},
});

function shadeHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function applyColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--color-accent-600", hex);
  root.style.setProperty("--color-accent-700", shadeHex(hex, -0.12));
  root.style.setProperty("--color-accent-500", shadeHex(hex, 0.08));
  root.style.setProperty("--color-accent-50", shadeHex(hex, 0.85));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({ primary_color: null, default_color: null, logo_url: null, app_name: null, support_phone: null });

  const load = useCallback(() => {
    api.get("/settings").then(({ data }) => {
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
