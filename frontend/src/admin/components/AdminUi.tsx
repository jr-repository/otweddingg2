import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

export function adminInputCls() {
  return "block h-10 w-full rounded-[12px] border border-[rgba(200,182,153,0.34)] bg-white px-3 text-[12px] text-charcoal outline-none transition-colors focus:border-champagne focus:ring-2 focus:ring-champagne/20";
}

export function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[16px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-3 shadow-[0_16px_36px_-28px_rgba(63,47,37,0.16)]">
      <p className="text-[0.58rem] font-medium uppercase tracking-[0.26em] text-taupe">{label}</p>
      <p className="mt-3 font-serif text-3xl leading-none text-charcoal">{value}</p>
    </article>
  );
}

export function SidebarButton({
  active,
  compact,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  compact: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-left text-[12px] transition-colors ${
        compact ? "justify-center" : "gap-3"
      } ${active ? "bg-white/12 text-ivory" : "text-ivory/68 hover:bg-white/8 hover:text-ivory"}`}
    >
      {icon}
      {!compact && <span>{label}</span>}
    </button>
  );
}

export function SidebarAction({
  compact,
  label,
  onClick,
}: {
  compact: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex w-full items-center rounded-[12px] border border-white/10 bg-white/8 px-3 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory/84 transition-colors hover:bg-white/12 ${
        compact ? "justify-center" : "gap-2"
      }`}
    >
      <Download className="h-3.5 w-3.5" />
      {!compact && label}
    </button>
  );
}

export function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-[rgba(200,182,153,0.24)] bg-white px-3 py-3">
      <span className="mt-0.5 text-champagne">{icon}</span>
      <div>
        <p className="text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">{label}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-charcoal">{value}</p>
      </div>
    </div>
  );
}

export function EventToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] transition-colors ${
        active
          ? "bg-champagne text-charcoal"
          : "border border-white/10 bg-white/5 text-ivory/72 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={adminInputCls()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">
        {label}
      </span>
      {children}
    </label>
  );
}

export function PaginationControls({
  page,
  totalPages,
  start,
  end,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  start: number;
  end: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[rgba(200,182,153,0.18)] px-4 py-3 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(200,182,153,0.28)] bg-white text-charcoal transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[88px] text-center text-[11px] uppercase tracking-[0.2em] text-taupe">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(200,182,153,0.28)] bg-white text-charcoal transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
