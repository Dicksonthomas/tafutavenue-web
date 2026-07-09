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
    <div className="relative mt-5 flex justify-center">
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
        aria-label="Back to Top"
        title="Back to Top"
        className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
      >
        <ChevronUp size={16} />
      </button>
    </div>
  );
}
