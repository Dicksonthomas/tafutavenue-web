const PAGE_SIZES = [10, 20, 30, 50, 70, 100, 150, 200];

export default function PageSizeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none"
    >
      {PAGE_SIZES.map((n) => (
        <option key={n} value={n}>{n} per page</option>
      ))}
      <option value="all">All</option>
    </select>
  );
}
