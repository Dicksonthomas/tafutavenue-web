"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown, UserRound, KeyRound, LogOut, MapPin, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchUnreadCount, notificationHref, NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifications";
import { User } from "@/lib/types";
import InstallAppButton from "./InstallAppButton";

const NOTIFICATION_POLL_MS = 120000;

function campusName(campus?: string): string | null {
  if (!campus) return null;
  return campus.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

/** "Dr. Kilima" for a Staff member with a title set, otherwise just the
 * first name (e.g. "Silivia") like everyone else. */
function greetingName(user: User): string {
  if (user.title) {
    const parts = user.name.trim().split(/\s+/);
    return `${user.title}. ${parts[parts.length - 1]}`;
  }
  return user.name.split(" ")[0];
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
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    function refresh() {
      fetchUnreadCount().then((count) => {
        if (!cancelled) setUnreadCount(count);
      });
    }
    refresh();
    const interval = setInterval(refresh, NOTIFICATION_POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, pathname]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6"
      style={{
        // Same compositing-layer pin used on BottomNav - without it, this
        // sticky header can visually slip/judder alongside the bottom nav
        // on Android when the page has a nested horizontally-scrollable
        // table (see the .overflow-x-auto rule in globals.css).
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      <button onClick={onMenuClick} className="text-slate-600 lg:hidden">
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 md:block">
          Hello, <span className="font-medium text-slate-800">{greetingName(user)}</span>
        </span>
        {campusName(user.campus) && (
          <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            <MapPin size={12} /> {campusName(user.campus)}
          </span>
        )}
        <InstallAppButton />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={notificationHref(user.role)}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

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
                  <UserRound size={16} /> My Profile
                </Link>
              )}

              <Link
                href={changePasswordHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <KeyRound size={16} /> Change Password
              </Link>

              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
