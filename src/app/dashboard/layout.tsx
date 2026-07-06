"use client";

import { ReactNode } from "react";
import { Search, CalendarClock, ClipboardList, DoorOpen, User2, Settings } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tafuta Venue", icon: Search },
  { href: "/dashboard/venues", label: "Venues Zote", icon: DoorOpen },
  { href: "/dashboard/booked", label: "Booked Venues", icon: CalendarClock },
  { href: "/dashboard/lecturer", label: "Ratiba ya Lecturer", icon: User2 },
  { href: "/dashboard/bookings", label: "Bookings Zangu", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Mipangilio", icon: Settings },
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
