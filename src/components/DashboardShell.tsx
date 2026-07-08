"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, X, Building2 } from "lucide-react";
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
  const { logo_url, loading: settingsLoading } = useSettings();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        {settingsLoading ? (
          // Neutral placeholder while /settings loads, so this never shows
          // the "no logo" fallback icon first and then swaps to the real
          // logo once it arrives.
          <div className="h-9 w-9 rounded-lg bg-white/10" />
        ) : logo_url ? (
          <img src={logo_url} alt="Logo" className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-white">
            <Building2 size={18} />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Venue Booking</p>
          <p className="text-xs text-brand-200 leading-tight">{roleLabel}</p>
        </div>
        <button onClick={() => setMobileOpen(false)} className="ml-auto text-brand-200 md:hidden">
          <X size={20} />
        </button>
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-500 text-white"
                  : "text-brand-100 hover:bg-brand-700 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="px-5 py-4 text-xs text-brand-300">University Venue Booking System</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-brand-800 md:block">{sidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-brand-800 shadow-xl">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          profileHref={profileHref}
          changePasswordHref={changePasswordHref}
        />
        <OfflineBanner />

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 md:pb-6">{children}</main>
        <div className="hidden md:block"><Footer /></div>
        <BottomNav
          navItems={mobileNavItems ?? navItems.slice(0, 4)}
          allNavItems={navItems}
          onMoreClick={() => setMobileOpen(true)}
        />
      </div>
    </div>
  );
}
