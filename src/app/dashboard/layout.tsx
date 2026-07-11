"use client";

import { ReactNode } from "react";
import { LayoutDashboard, Search, CalendarClock, ClipboardList, DoorOpen, User2, Settings, Bell } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth";

const baseNavItems: NavItem[] = [
  { href: "/dashboard/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Find Venue", icon: Search },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/venues", label: "All Venues", icon: DoorOpen },
  { href: "/dashboard/booked", label: "Booked Venues", icon: CalendarClock },
  { href: "/dashboard/lecturer", label: "Lecturer Timetable", icon: User2 },
  { href: "/dashboard/bookings", label: "My Bookings", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Bottom nav on mobile only has room for a handful of tabs before it looks
// cramped/broken - keep the 4 most-used destinations here, everything else
// (All Venues, Lecturer Timetable, Settings) stays reachable via the "More"
// tab, which opens the full drawer menu.
const mobileNavItems: NavItem[] = [
  { href: "/dashboard/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Find Venue", icon: Search },
  { href: "/dashboard/booked", label: "Booked Venues", icon: CalendarClock },
  { href: "/dashboard/bookings", label: "My Bookings", icon: ClipboardList },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isStaff = user?.role === "staff";
  // Lecturer Timetable is about looking up CR class schedules - meaningless
  // for Staff booking a meeting room.
  const navItems = isStaff ? baseNavItems.filter((item) => item.href !== "/dashboard/lecturer") : baseNavItems;

  return (
    <AuthGuard allow={["cr", "staff"]}>
      <DashboardShell
        navItems={navItems}
        mobileNavItems={mobileNavItems}
        roleLabel={isStaff ? "Staff" : "Class Representative"}
        profileHref="/dashboard/profile"
        changePasswordHref="/dashboard/change-password"
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
