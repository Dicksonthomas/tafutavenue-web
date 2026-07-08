"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { Role } from "@/lib/types";

export default function AuthGuard({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow: Role[];
}) {
  const { user, loading } = useAuth();
  const { loading: settingsLoading } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allow.includes(user.role)) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard/home");
    }
  }, [user, loading, allow, router]);

  // Also wait for settings (logo/color) so a hard refresh on any dashboard
  // page never briefly shows the default color/logo before the real one
  // (or the user's personal color) loads in.
  if (loading || settingsLoading || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
