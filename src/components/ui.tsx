import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { BookingStatus, VenueStatus } from "@/lib/types";

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </div>
      <p className="font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}

const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  cancelled: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BOOKING_STATUS_STYLES[status]}`}>
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}

const VENUE_STATUS_STYLES: Record<VenueStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  maintenance: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  disabled: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
};

const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  available: "Available",
  maintenance: "Maintenance",
  disabled: "Disabled",
};

export function VenueStatusBadge({ status }: { status: VenueStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VENUE_STATUS_STYLES[status]}`}>
      {VENUE_STATUS_LABELS[status]}
    </span>
  );
}

export function PurposeBadge({ purpose }: { purpose: string }) {
  const labels: Record<string, string> = {
    study_unit: "Study Unit",
    test: "Test",
    makeup_class: "Makeup Class",
    meeting: "Meeting",
    other: "Other",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-200">
      {labels[purpose] ?? purpose}
    </span>
  );
}
