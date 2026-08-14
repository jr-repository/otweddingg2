import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ScanLine, ShieldCheck } from "lucide-react";

import { MetricCard, PaginationControls } from "@/admin/components/AdminUi";
import type { AdminRecord, AdminSummary } from "@/admin/types";
import heroPhoto from "@/assets/photos/gallery-photo-06.jpeg";

const PAGE_SIZE = 6;

export function OverviewPage({
  loading,
  records,
  summary,
  onSelectGuest,
  onOpenGuests,
  onOpenScanner,
}: {
  loading: boolean;
  records: AdminRecord[];
  summary: AdminSummary | null;
  onSelectGuest: (record: AdminRecord) => void;
  onOpenGuests: () => void;
  onOpenScanner: () => void;
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
  const latestActivity = records.slice(0, 3);
  const rowStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rowEnd = records.length === 0 ? 0 : Math.min(safePage * PAGE_SIZE, records.length);

  return (
    <div className="space-y-4">
      <section className="hidden max-[450px]:block">
        <div className="grid grid-cols-[minmax(0,1fr)_116px] items-end gap-[10px]">
          <div className="py-[7px]">
            <p className="font-serif text-[15px] leading-[1.1] text-charcoal">Welcome back,</p>
            <h1 className="mt-0.5 font-serif text-[24px] leading-none tracking-[-0.025em] text-charcoal">
              Admin
            </h1>
            <p className="mt-2 max-w-[150px] text-[8px] leading-[1.55] text-taupe">
              here&apos;s what happening with today&apos;s operations.
            </p>
          </div>

          <div className="relative h-[132px]">
            <img
              src={heroPhoto}
              alt="Wedding reception"
              className="h-[132px] w-[116px] rounded-[58px_15px_15px_15px] object-cover shadow-[0_10px_28px_rgba(73,49,34,0.12)]"
            />
            <div className="absolute bottom-3 left-[-8px] grid h-[38px] w-[38px] place-items-center rounded-full border border-[rgba(238,229,219,1)] bg-white shadow-[0_7px_18px_rgba(40,30,24,0.12)]">
              <CalendarDays className="h-[15px] w-[15px] text-charcoal" />
            </div>
          </div>
        </div>

        {summary && (
          <>
            <p className="mb-1.5 mt-3 text-[7px] font-bold uppercase tracking-[0.23em] text-[#9b8e84]">
              Today Overview
            </p>
            <div className="grid grid-cols-2 gap-[5px]">
              <MetricCard label="Total Responses" value={summary.totalResponses} />
              <MetricCard label="Attending" value={summary.attendingYes} />
              <MetricCard label="Confirmed Seats" value={summary.confirmedSeats} />
              <MetricCard label="Pending Check-In" value={summary.pendingCheckIns} />
              <MetricCard label="Checked-In Guests" value={summary.checkedInGuests} />
              <MetricCard label="Unable to Attend" value={summary.attendingNo} />
            </div>
          </>
        )}

        <div className="mt-[7px] rounded-[15px] bg-[linear-gradient(145deg,#2a201b,#3a2d25)] px-3 py-3 text-white shadow-[0_12px_28px_rgba(45,33,27,0.17)]">
          <h2 className="font-serif text-[14px] leading-[1.18]">
            Scanner is ready for guest arrival
          </h2>
          <p className="mt-[7px] text-[7.5px] leading-[1.45] text-[#d5cbc4]">
            Each guest QR can be used once per event.
          </p>
          <button
            type="button"
            onClick={onOpenScanner}
            className="mt-[10px] inline-flex items-center gap-2 rounded-[8px] bg-white px-3 py-[9px] text-[7.5px] font-bold uppercase tracking-[0.18em] text-[#2c231e]"
          >
            <ScanLine className="h-[13px] w-[13px]" />
            Open Scanner
          </button>
        </div>

        <div className="mb-[7px] mt-[13px] flex items-center justify-between px-0.5">
          <h2 className="font-serif text-[14px] leading-none text-charcoal">
            Latest RSVP Activity
          </h2>
          <button type="button" onClick={onOpenGuests} className="text-[7.5px] text-[#776b62]">
            View all
          </button>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-[rgba(240,232,223,1)] bg-white/74">
          {loading && (
            <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
              Loading latest responses...
            </div>
          )}

          {!loading && latestActivity.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
              No guest activity yet.
            </div>
          )}

          {!loading &&
            latestActivity.map((record, index) => (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelectGuest(record)}
                className={`grid min-h-[48px] w-full grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 px-[9px] py-2 text-left ${
                  index > 0 ? "border-t border-[rgba(240,232,223,1)]" : ""
                }`}
              >
                <div className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[#f4eee6] font-serif text-[10px] text-[#705b43]">
                  {record.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="mb-[3px] text-[8.5px] font-semibold text-charcoal">
                    {record.fullName}
                  </div>
                  <div className="truncate text-[6.8px] text-[#91857c]">
                    {record.attendingLabel} · {record.events[0] ?? record.eventsLabel}
                  </div>
                </div>
                <div className="whitespace-nowrap text-[6.7px] text-[#9c9086]">
                  {record.submittedAtLabel}
                </div>
              </button>
            ))}
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
