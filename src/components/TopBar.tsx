"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown, UserRound, KeyRound, LogOut, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";

function campusName(campus?: string): string | null {
  if (!campus) return null;
  return campus.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default function TopBar({
  onMenuClick,
  profileHref,
  changePasswordHref,
}: {
  onMenuClick: () => void;
  profileHref?: string;
  changePasswordHref: string;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <button onClick={onMenuClick} className="text-slate-600 md:hidden">
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 md:block">
          Habari, <span className="font-medium text-slate-800">{user.name.split(" ")[0]}</span>
        </span>
        {campusName(user.campus) && (
          <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            <MapPin size={12} /> {campusName(user.campus)}
          </span>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-xs font-semibold text-white">
            {initials}
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
              {user.campus && (
                <p className="mt-0.5 truncate text-xs font-medium text-accent-700">
                  {user.campus.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
                </p>
              )}
            </div>

            {profileHref && (
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <UserRound size={16} /> Profile Yangu
              </Link>
            )}

            <Link
              href={changePasswordHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <KeyRound size={16} /> Badilisha Password
            </Link>

            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Toka
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
