"use client";

import { ReactNode } from "react";
import { LayoutDashboard, DoorOpen, ClipboardCheck, CalendarRange, GraduationCap, Settings, CalendarClock, ShieldCheck, History, Bell, Briefcase, Megaphone } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell, { NavItem } from "@/components/DashboardShell";
import { useAuth } from "@/lib/auth";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/venues", label: "Venues", icon: DoorOpen },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
  { href: "/admin/booked-venues", label: "Booked Venues", icon: CalendarClock },
  { href: "/admin/semesters", label: "Semesters", icon: CalendarRange },
  { href: "/admin/students", label: "Students (CR)", icon: GraduationCap },
  { href: "/admin/staff", label: "Staff", icon: Briefcase },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/logs", label: "Logs", icon: History },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// A Staff Admin (admin_domain === "staff") is scoped to ONLY Staff-related
// admin work - a narrow nav instead of the full admin area above. "Admins"
// only appears for a Staff Super Admin (managing other Staff Admins).
function staffAdminNavItems(isSuperAdmin: boolean): NavItem[] {
  return [
    { href: "/admin/staff", label: "Staff", icon: Briefcase },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ...(isSuperAdmin ? [{ href: "/admin/admins", label: "Admins", icon: ShieldCheck }] : []),
  ];
}

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
  const { user } = useAuth();
  const isStaffAdmin = user?.admin_domain === "staff";
  const effectiveNavItems = isStaffAdmin ? staffAdminNavItems(!!user?.is_super_admin) : navItems;

  return (
    <AuthGuard allow={["admin"]}>
      <DashboardShell
        navItems={effectiveNavItems}
        mobileNavItems={isStaffAdmin ? undefined : mobileNavItems}
        roleLabel={isStaffAdmin ? "Staff Admin" : "Administrator"}
        changePasswordHref="/admin/change-password"
      >
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
