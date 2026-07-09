export default function ShowMoreButton({
  onClick,
  loading,
  label = "Show More",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-5 flex justify-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Loading..." : label}
      </button>
    </div>
  );
}
