"use client";

import { ReactNode } from "react";
import { LayoutDashboard, DoorOpen, ClipboardCheck, CalendarRange, GraduationCap, Settings, CalendarClock, ShieldCheck, History } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/venues", label: "Venues", icon: DoorOpen },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/booked-venues", label: "Booked Venues", icon: CalendarClock },
  { href: "/admin/semesters", label: "Semesters", icon: CalendarRange },
  { href: "/admin/students", label: "Students (CR)", icon: GraduationCap },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/logs", label: "Logs", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Bottom nav on mobile only has room for a handful of tabs before it looks
// cramped/broken - keep the 4 most-used destinations here, everything else
// (Booked Venues, Semesters, Admins, Logs, Settings) stays reachable via the
// "More" tab, which opens the full drawer menu.
const mobileNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/venues", label: "Venues", icon: DoorOpen },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/students", label: "Students (CR)", icon: GraduationCap },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allow={["admin"]}>
      <DashboardShell
        navItems={navItems}
        mobileNavItems={mobileNavItems}
        roleLabel="Administrator"
        changePasswordHref="/admin/change-password"
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
