"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { NavItem } from "./DashboardShell";

export default function BottomNav({
  navItems,
  allNavItems,
  onMoreClick,
}: {
  navItems: NavItem[];
  allNavItems: NavItem[];
  onMoreClick: () => void;
}) {
  const pathname = usePathname();
  const hasMore = allNavItems.length > navItems.length;
  const isOnHiddenItem = hasMore && !navItems.some((item) => item.href === pathname)
    && allNavItems.some((item) => item.href === pathname);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={`flex flex-1 items-center justify-center py-3 ${
              active ? "text-accent-600" : "text-slate-400"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
          </Link>
        );
      })}

      {hasMore && (
        <button
          onClick={onMoreClick}
          title="More"
          aria-label="More"
          className={`flex flex-1 items-center justify-center py-3 ${
            isOnHiddenItem ? "text-accent-600" : "text-slate-400"
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={isOnHiddenItem ? 2.4 : 2} />
        </button>
      )}
    </nav>
  );
}
