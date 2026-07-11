"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, Menu, X } from "lucide-react";
import TopBar from "./TopBar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import OfflineBanner from "./OfflineBanner";
import { useSettings } from "@/lib/settings";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";

export default function DashboardShell({
  navItems,
  mobileNavItems,
  roleLabel,
  profileHref,
  changePasswordHref,
  children,
}: {
  navItems: NavItem[];
  /** Curated subset (max 4) shown directly in the bottom nav on mobile - the
   * rest stay reachable via the "More" tab, which opens the same drawer as
   * the hamburger menu. Falls back to the first 4 of `navItems` if omitted. */
  mobileNavItems?: NavItem[];
  roleLabel: string;
  profileHref?: string;
  changePasswordHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { logo_url, loading: settingsLoading } = useSettings();

  // Remember the collapsed/expanded choice per browser, for every user.
  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  function renderSidebar(isCollapsible: boolean) {
    const isCollapsed = isCollapsible && collapsed;

    return (
      <div className="flex h-full flex-col">
        <div className={`flex gap-2 px-5 py-5 ${isCollapsed ? "flex-col items-center px-2" : "items-center"}`}>
          <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col" : "min-w-0"}`}>
            {settingsLoading ? (
              // Neutral placeholder while /settings loads, so this never
              // shows the "no logo" fallback icon first and then swaps to
              // the real logo once it arrives.
              <div className="h-9 w-9 shrink-0 rounded-lg bg-white/10" />
            ) : (
              <img src={logo_url || "/default-logo.jpg"} alt="Logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            )}
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white leading-tight">Venue Booking</p>
                <p className="truncate text-xs text-brand-200 leading-tight">{roleLabel}</p>
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto text-brand-200 lg:hidden">
            <X size={20} />
          </button>
          {isCollapsible && (
            <button
              onClick={toggleCollapsed}
              title={isCollapsed ? "Expand menu" : "Collapse menu"}
              className={`hidden text-brand-200 hover:text-white lg:block ${isCollapsed ? "" : "ml-auto"}`}
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isCollapsed ? "justify-center px-0" : ""
                } ${active ? "bg-accent-500 text-white" : "text-brand-100 hover:bg-brand-700 hover:text-white"}`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                {!isCollapsed && item.label}
                {isCollapsed && (
                  <span
                    className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                  >
                    <span
                      className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900"
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!isCollapsed && <p className="px-5 py-4 text-xs text-brand-300">University Venue Booking System</p>}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-slate-50">
      {/* Permanent sidebar - from `lg` up, so tablets (which land in the
          `md`-`lg` range) still get the phone-style bottom nav + drawer
          below instead of a cramped permanent sidebar. */}
      {/* h-dvh (not h-screen) - h-screen is a fixed 100vh, which resizes as
          the mobile browser's address bar shows/hides on scroll, making the
          whole layout visibly jump. dvh tracks the actual visible viewport. */}
      <aside className={`sticky top-0 hidden h-dvh shrink-0 overflow-y-auto bg-brand-800 transition-all duration-200 lg:block ${collapsed ? "w-16" : "w-64"}`}>
        {renderSidebar(true)}
      </aside>

      {/* Mobile/tablet drawer - always shows the full (uncollapsed) sidebar,
          since it's an overlay the user explicitly opened and closes with
          the X above, independent of the desktop collapse preference. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-brand-800 shadow-xl">{renderSidebar(false)}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          profileHref={profileHref}
          changePasswordHref={changePasswordHref}
        />
        <OfflineBanner />

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
        <div className="hidden lg:block"><Footer /></div>
        <BottomNav
          navItems={mobileNavItems ?? navItems.slice(0, 4)}
          allNavItems={navItems}
          onMoreClick={() => setMobileOpen(true)}
        />
      </div>
    </div>
  );
}
