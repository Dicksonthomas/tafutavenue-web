"use client";

import { ReactNode } from "react";
import { LayoutDashboard, Search, CalendarClock, ClipboardList, DoorOpen, User2, Settings } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";

const navItems: NavItem[] = [
  { href: "/dashboard/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Find Venue", icon: Search },
  { href: "/dashboard/venues", label: "All Venues", icon: DoorOpen },
  { href: "/dashboard/booked", label: "Booked Venues", icon: CalendarClock },
  { href: "/dashboard/lecturer", label: "Lecturer Timetable", icon: User2 },
  { href: "/dashboard/bookings", label: "My Bookings", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allow={["cr"]}>
      <DashboardShell
        navItems={navItems}
        roleLabel="Class Representative"
        profileHref="/dashboard/profile"
        changePasswordHref="/dashboard/change-password"
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
