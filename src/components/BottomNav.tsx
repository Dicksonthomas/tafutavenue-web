"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "./DashboardShell";

export default function BottomNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

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
    </nav>
  );
}
