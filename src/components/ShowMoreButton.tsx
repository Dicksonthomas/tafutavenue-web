"use client";

import { ChevronUp } from "lucide-react";

export default function ShowMoreButton({
  onClick,
  loading,
  label = "Show More",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  function backToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mt-5 flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Loading..." : label}
      </button>
      <button
        type="button"
        onClick={backToTop}
        className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
      >
        <ChevronUp size={14} /> Back to Top
      </button>
    </div>
  );
}
