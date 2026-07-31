import { CheckCircle2, ExternalLink, Mail, MapPin, Phone, Ticket } from "lucide-react";

import { DetailRow } from "@/admin/components/AdminUi";
import type { AdminRecord } from "@/admin/types";

export function GuestDetailModal({
  record,
  onClose,
}: {
  record: AdminRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/52 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[rgba(200,182,153,0.3)] bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
              Guest Detail
            </p>
            <h3 className="mt-2 font-serif text-3xl leading-none text-charcoal">{record.fullName}</h3>
            <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-taupe">
              Guest Code {record.guestCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[rgba(200,182,153,0.28)] px-3 py-1.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-charcoal transition-colors hover:bg-cream"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[18px] border border-[rgba(200,182,153,0.24)] bg-[linear-gradient(180deg,#fffdfa_0%,#f8f1e7_100%)] p-4 text-center">
            {record.qrCodeDataUrl ? (
              <img
                src={record.qrCodeDataUrl}
                alt={`Guest QR for ${record.fullName}`}
                className="mx-auto max-w-[220px] rounded-[14px] border border-[rgba(200,182,153,0.24)] bg-white p-2.5"
              />
            ) : (
              <div className="rounded-[14px] border border-[rgba(200,182,153,0.24)] bg-white px-5 py-8 text-[12px] text-muted-foreground">
                QR unavailable
              </div>
            )}
            {record.passUrl && (
              <a
                href={record.passUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-[12px] text-charcoal transition-colors hover:text-champagne"
              >
                Open guest pass
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          <div className="space-y-3">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={record.email} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={record.phone || "-"} />
            <DetailRow
              icon={<Ticket className="h-4 w-4" />}
              label="Attendance"
              value={`${record.attendingLabel} · ${record.guestsLabel}`}
            />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Events" value={record.eventsLabel} />
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Holy Matrimony Check-In"
              value={`${record.holyMatrimonyCheckedInLabel}${record.holyMatrimonyCheckedInBy ? ` · ${record.holyMatrimonyCheckedInBy}` : ""}`}
            />
            <DetailRow
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Syukuran Check-In"
              value={`${record.syukuranCheckedInLabel}${record.syukuranCheckedInBy ? ` · ${record.syukuranCheckedInBy}` : ""}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
