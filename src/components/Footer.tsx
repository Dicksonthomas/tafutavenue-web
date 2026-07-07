"use client";

import { useSettings } from "@/lib/settings";

export default function Footer() {
  const { support_phone } = useSettings();

  return (
    <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
      <p>&copy; {new Date().getFullYear()} University Venue Booking System — Mzumbe University. All rights reserved.</p>
      {support_phone && <p className="mt-0.5">Need help? Call {support_phone}</p>}
      <p className="mt-0.5">Developed by Dickson Thomas</p>
    </footer>
  );
}
