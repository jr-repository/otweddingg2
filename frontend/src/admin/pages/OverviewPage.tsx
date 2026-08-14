import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { MetricCard, PaginationControls } from "@/admin/components/AdminUi";
import type { AdminRecord, AdminSummary } from "@/admin/types";

const PAGE_SIZE = 6;

export function OverviewPage({
  loading,
  records,
  summary,
  onSelectGuest,
}: {
  loading: boolean;
  records: AdminRecord[];
  summary: AdminSummary | null;
  onSelectGuest: (record: AdminRecord) => void;
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
  const rowStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rowEnd = records.length === 0 ? 0 : Math.min(safePage * PAGE_SIZE, records.length);

  return (
    <div className="space-y-4">
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
            Each guest QR can be used once per selected event, then the camera automatically returns
            for the next scan.
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
  );
}
