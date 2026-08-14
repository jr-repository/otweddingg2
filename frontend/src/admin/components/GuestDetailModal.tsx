import { ExternalLink } from "lucide-react";

import type { AdminRecord } from "@/admin/types";

function MinimalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-[rgba(200,182,153,0.16)] py-3 first:border-t-0 first:pt-0">
      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-taupe">{label}</span>
      <span className="max-w-[62%] text-right text-[12px] leading-relaxed text-charcoal">
        {value}
      </span>
    </div>
  );
}

export function GuestDetailModal({
  record,
  onClose,
}: {
  record: AdminRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/44 px-4 py-6 max-[450px]:items-end max-[450px]:px-0 max-[450px]:py-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[24px] border border-[rgba(200,182,153,0.24)] bg-white px-5 py-4 shadow-[0_30px_60px_-36px_rgba(63,47,37,0.28)] max-[450px]:max-w-none max-[450px]:rounded-b-none max-[450px]:rounded-t-[26px] max-[450px]:border-x-0 max-[450px]:border-b-0 max-[450px]:px-4 max-[450px]:pb-[calc(18px+env(safe-area-inset-bottom))] max-[450px]:pt-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 hidden justify-center max-[450px]:flex">
          <span className="h-1.5 w-14 rounded-full bg-[rgba(200,182,153,0.58)]" />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
              Guest Detail
            </p>
            <h3 className="mt-2 truncate font-serif text-3xl leading-none text-charcoal max-[450px]:text-[2.1rem]">
              {record.fullName}
            </h3>
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-taupe">
              {record.guestCode || "No guest code"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(200,182,153,0.24)] px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-charcoal transition-colors hover:bg-cream"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-[18px] border border-[rgba(200,182,153,0.18)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e7_100%)] p-4 text-center">
          {record.qrCodeDataUrl ? (
            <img
              src={record.qrCodeDataUrl}
              alt={`Guest QR for ${record.fullName}`}
              className="mx-auto max-w-[160px] rounded-[14px] border border-[rgba(200,182,153,0.22)] bg-white p-2"
            />
          ) : (
            <div className="rounded-[14px] border border-[rgba(200,182,153,0.18)] bg-white px-5 py-6 text-[12px] text-muted-foreground">
              QR unavailable
            </div>
          )}

          {record.passUrl && (
            <a
              href={record.passUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-charcoal transition-colors hover:text-champagne"
            >
              Open pass
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        <div className="mt-4 rounded-[18px] border border-[rgba(200,182,153,0.18)] bg-white px-4 py-4">
          <MinimalRow label="Email" value={record.email || "-"} />
          <MinimalRow label="WhatsApp" value={record.phone || "-"} />
          <MinimalRow
            label="Attendance"
            value={`${record.attendingLabel} · ${record.guestsLabel}`}
          />
          <MinimalRow label="Events" value={record.eventsLabel} />
        </div>
      </div>
    </div>
  );
}
