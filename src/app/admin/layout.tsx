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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allow={["admin"]}>
      <DashboardShell
        navItems={navItems}
        roleLabel="Administrator"
        changePasswordHref="/admin/change-password"
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
