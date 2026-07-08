"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard/home");
    }
  }, [user, loading, router]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center text-slate-500">
      Loading...
    </div>
  );
}
