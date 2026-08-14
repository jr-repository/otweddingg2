import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ScanLine, ShieldCheck } from "lucide-react";

import { MetricCard, PaginationControls } from "@/admin/components/AdminUi";
import type { AdminRecord, AdminSummary } from "@/admin/types";
import heroPhoto from "@/assets/photos/gallery-photo-06.jpeg";

const PAGE_SIZE = 6;

function guestInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function OverviewPage({
  loading,
  records,
  summary,
  onSelectGuest,
  onOpenGuests,
  onOpenScanner,
  onExport,
  exporting,
}: {
  loading: boolean;
  records: AdminRecord[];
  summary: AdminSummary | null;
  onSelectGuest: (record: AdminRecord) => void;
  onOpenGuests: () => void;
  onOpenScanner: () => void;
  onExport: (kind: "excel" | "pdf") => void;
  exporting: "" | "excel" | "pdf";
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [records.length]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRecords = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return records.slice(startIndex, startIndex + PAGE_SIZE);
  }, [records, safePage]);
  const latestActivity = records.slice(0, 4);
  const rowStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rowEnd = records.length === 0 ? 0 : Math.min(safePage * PAGE_SIZE, records.length);

  return (
    <div className="space-y-4">
      <section className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-card px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#85786f]">
                Wedding operations
              </p>
              <h1 className="wa-admin-mobile-title mt-2 text-[26px] leading-[0.96]">
                Invitation
                <br />
                control center
              </h1>
              <p className="mt-3 max-w-[170px] text-[10px] leading-[1.55] text-[#8f8379]">
                Pantau RSVP, buka scanner venue, dan cek aktivitas tamu dari satu tampilan mobile.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onExport("excel")}
                  className="wa-admin-mobile-pill-btn w-full"
                >
                  {exporting === "excel" ? "Preparing Excel" : "Export Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => onExport("pdf")}
                  className="wa-admin-mobile-pill-btn w-full"
                >
                  {exporting === "pdf" ? "Preparing PDF" : "Export PDF"}
                </button>
              </div>
            </div>

            <div className="relative shrink-0">
              <img
                src={heroPhoto}
                alt="Wedding reception"
                className="h-[148px] w-[110px] rounded-[42px_18px_18px_18px] object-cover shadow-[0_18px_36px_rgba(63,47,37,0.14)]"
              />
              <div className="absolute bottom-3 left-[-10px] grid h-10 w-10 place-items-center rounded-[16px] border border-white/80 bg-white/92 shadow-[0_12px_24px_rgba(63,47,37,0.12)]">
                <CalendarDays className="h-4 w-4 text-charcoal" />
              </div>
            </div>
          </div>
        </div>

        {summary && (
          <div className="wa-admin-mobile-section">
            <div className="wa-admin-mobile-section-head">
              <h2>Today Overview</h2>
              <button type="button">Live summary</button>
            </div>

            <div className="wa-admin-mobile-summary-scroll">
              {[
                ["Total Responses", summary.totalResponses],
                ["Attending", summary.attendingYes],
                ["Confirmed Seats", summary.confirmedSeats],
                ["Pending Check-In", summary.pendingCheckIns],
                ["Checked-In Guests", summary.checkedInGuests],
                ["Unable to Attend", summary.attendingNo],
              ].map(([label, value]) => (
                <article key={String(label)} className="wa-admin-mobile-card w-full px-4 py-4">
                  <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-[#8f8379]">
                    {label}
                  </p>
                  <p className="mt-4 font-serif text-[36px] leading-none text-charcoal">{value}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        <div className="wa-admin-mobile-section">
          <div className="wa-admin-mobile-card is-dark overflow-hidden px-4 py-4 text-white">
            <p className="text-[8px] font-bold uppercase tracking-[0.26em] text-white/62">
              Venue readiness
            </p>
            <h2 className="mt-2 font-serif text-[22px] leading-[1.08] text-white">
              Scanner is ready for the next guest.
            </h2>
            <p className="mt-3 text-[10px] leading-[1.6] text-white/72">
              Each QR can only be used once per event and photobooth starts automatically after
              check-in is confirmed.
            </p>

            <div className="mt-4 space-y-2">
              {[
                "Holy Matrimony and Lunch Celebration are processed separately.",
                "Duplicate scans are blocked automatically.",
                "Manual fallback stays available via name or WhatsApp.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-[16px] border border-white/10 bg-white/8 px-3 py-3 text-[9px] leading-[1.5] text-white/82"
                >
                  <ShieldCheck className="mt-[1px] h-3.5 w-3.5 shrink-0 text-[#d6be98]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenScanner}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-[16px] bg-white px-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#2f241e]"
            >
              <ScanLine className="h-4 w-4" />
              Open Scanner
            </button>
          </div>
        </div>

        <div className="wa-admin-mobile-section">
          <div className="wa-admin-mobile-section-head">
            <h2>Latest RSVP Activity</h2>
            <button type="button" onClick={onOpenGuests}>
              View all
            </button>
          </div>

          <div className="wa-admin-mobile-list">
            {loading && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                Loading latest responses...
              </div>
            )}

            {!loading && latestActivity.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                No guest activity yet.
              </div>
            )}

            {!loading &&
              latestActivity.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onSelectGuest(record)}
                  className="wa-admin-mobile-row w-full text-left"
                >
                  <div className="wa-admin-mobile-avatar">{guestInitials(record.fullName)}</div>
                  <div className="min-w-0 pr-1">
                    <div className="truncate text-[9px] font-semibold text-charcoal">
                      {record.fullName}
                    </div>
                    <div className="mt-[3px] truncate text-[7px] text-[#8f8379]">
                      {record.eventsLabel}
                    </div>
                    <div className="mt-[3px] text-[7px] text-[#8f8379]">
                      {record.submittedAtLabel}
                    </div>
                  </div>
                  <span className="wa-admin-mobile-status">{record.attendingLabel}</span>
                  <span className="text-[14px] text-[#a69990]">›</span>
                </button>
              ))}
          </div>
        </div>
      </section>

      <div className="max-[450px]:hidden">
        {summary && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 max-[450px]:grid-cols-2 max-[450px]:gap-2.5">
            <MetricCard label="Total Responses" value={summary.totalResponses} />
            <MetricCard label="Attending" value={summary.attendingYes} />
            <MetricCard label="Confirmed Seats" value={summary.confirmedSeats} />
            <MetricCard label="Pending Check-In" value={summary.pendingCheckIns} />
            <MetricCard label="Checked In - Matrimony" value={summary.checkedInHolyMatrimony} />
            <MetricCard label="Checked In - Lunch Celebration" value={summary.checkedInSyukuran} />
            <MetricCard label="Unable to Attend" value={summary.attendingNo} />
            <MetricCard label="Checked-In Guests" value={summary.checkedInGuests} />
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-[26px] max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,245,239,0.94))] max-[450px]:p-3.5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
                  Latest Guests
                </p>
                <h3 className="mt-2 font-serif text-2xl text-charcoal">Recent RSVP Activity</h3>
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-taupe">
                {records.length} records
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-[16px] border border-[rgba(200,182,153,0.22)] max-[450px]:hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-cream/70 text-left text-[0.58rem] uppercase tracking-[0.22em] text-taupe">
                    <th className="px-3 py-2.5 font-medium">No</th>
                    <th className="px-3 py-2.5 font-medium">Guest</th>
                    <th className="px-3 py-2.5 font-medium">Response</th>
                    <th className="px-3 py-2.5 font-medium">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                      >
                        Loading latest responses…
                      </td>
                    </tr>
                  )}

                  {!loading && visibleRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                      >
                        No guest activity yet.
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    visibleRecords.map((record, index) => (
                      <tr key={record.id} className={index % 2 === 0 ? "bg-white" : "bg-cream/30"}>
                        <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-taupe">
                          {rowStart + index}
                        </td>
                        <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectGuest(record)}
                            className="text-left"
                          >
                            <span className="block text-[12px] font-medium text-charcoal">
                              {record.fullName}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {record.submittedAtLabel}
                            </span>
                          </button>
                        </td>
                        <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                          {record.attendingLabel} · {record.eventsLabel}
                        </td>
                        <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-taupe">
                          {record.guestCode}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {!loading && records.length > 0 && (
                <PaginationControls
                  page={safePage}
                  totalPages={totalPages}
                  start={rowStart}
                  end={rowEnd}
                  total={records.length}
                  onPageChange={setPage}
                />
              )}
            </div>

            <div className="hidden max-[450px]:block">
              <div className="space-y-3">
                {loading && (
                  <div className="rounded-[20px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7] px-4 py-8 text-center text-[12px] text-muted-foreground">
                    Loading latest responses...
                  </div>
                )}

                {!loading && visibleRecords.length === 0 && (
                  <div className="rounded-[20px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7] px-4 py-8 text-center text-[12px] text-muted-foreground">
                    No guest activity yet.
                  </div>
                )}

                {!loading &&
                  visibleRecords.map((record, index) => (
                    <article
                      key={record.id}
                      className="rounded-[20px] border border-[rgba(200,182,153,0.2)] bg-[#fcfaf7] p-4 shadow-[0_16px_32px_-26px_rgba(63,47,37,0.16)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => onSelectGuest(record)}
                          className="text-left"
                        >
                          <p className="text-[0.56rem] uppercase tracking-[0.24em] text-taupe">
                            Recent Guest {rowStart + index}
                          </p>
                          <h4 className="mt-2 text-[16px] font-medium leading-snug text-charcoal">
                            {record.fullName}
                          </h4>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {record.submittedAtLabel}
                          </p>
                        </button>
                        <span className="rounded-full bg-cream px-3 py-1 text-[0.58rem] uppercase tracking-[0.2em] text-charcoal">
                          {record.attendingLabel}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-[12px] text-muted-foreground">
                        <div>
                          <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">
                            Events
                          </p>
                          <p className="mt-1 text-charcoal">{record.eventsLabel}</p>
                        </div>
                        <div>
                          <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">
                            Guest Code
                          </p>
                          <p className="mt-1 break-all text-charcoal">{record.guestCode || "-"}</p>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>

              {!loading && records.length > 0 && (
                <div className="mt-3 overflow-hidden rounded-[18px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7]">
                  <PaginationControls
                    page={safePage}
                    totalPages={totalPages}
                    start={rowStart}
                    end={rowEnd}
                    total={records.length}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-[linear-gradient(180deg,rgba(35,28,24,0.96),rgba(76,57,42,0.94))] p-4 text-ivory shadow-[0_20px_50px_-36px_rgba(63,47,37,0.18)] max-[450px]:rounded-[26px] max-[450px]:p-5">
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-ivory/66">
              Venue Readiness
            </p>
            <h3 className="mt-2 font-serif text-2xl leading-tight text-ivory">
              Scanner is ready for guest arrival.
            </h3>
            <p className="mt-3 text-[12px] leading-relaxed text-ivory/72">
              Each guest QR can be used once per selected event, then the camera automatically
              returns for the next scan.
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                "Holy Matrimony and Lunch Celebration are checked separately.",
                "Duplicate scans are blocked automatically.",
                "Manual fallback search is available by guest name or WhatsApp.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-[14px] border border-white/10 bg-white/6 px-3 py-3 text-[12px] text-ivory/82"
                >
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-champagne" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
