"use client";

import { ReactNode } from "react";
import { LayoutDashboard, DoorOpen, ClipboardCheck, CalendarRange, GraduationCap, Settings, CalendarClock } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Muhtasari", icon: LayoutDashboard },
  { href: "/admin/venues", label: "Venues", icon: DoorOpen },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/booked-venues", label: "Booked Venues", icon: CalendarClock },
  { href: "/admin/semesters", label: "Semesters", icon: CalendarRange },
  { href: "/admin/students", label: "Wanafunzi (CR)", icon: GraduationCap },
  { href: "/admin/settings", label: "Mipangilio", icon: Settings },
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
