"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { useSettings } from "./settings";
import { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { refresh: refreshSettings } = useSettings();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUserState(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function setUser(u: User) {
    localStorage.setItem("user", JSON.stringify(u));
    setUserState(u);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    // Wait for the user's personal color to load before navigating, so the
    // dashboard never briefly flashes the system default color first.
    await refreshSettings();
    router.push(data.user.role === "admin" ? "/admin" : "/dashboard/home");
  }

  async function logout() {
    try {
      await api.post("/logout");
    } catch {
      // ignore - we remove the local token even if the request fails
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserState(null);
    refreshSettings();
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
