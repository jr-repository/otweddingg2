import { useEffect, useMemo, useState, type FormEvent } from "react";
import { RefreshCcw, Search } from "lucide-react";

import { PaginationControls, SelectField, adminInputCls } from "@/admin/components/AdminUi";
import type { AdminRecord } from "@/admin/types";

const PAGE_SIZE = 10;

export function GuestListPage({
  loading,
  records,
  search,
  attendingFilter,
  eventFilter,
  onSearchChange,
  onAttendingFilterChange,
  onEventFilterChange,
  onSubmitFilters,
  onSelectGuest,
  onGenerateGuestCode,
  generatingGuestId,
}: {
  loading: boolean;
  records: AdminRecord[];
  search: string;
  attendingFilter: string;
  eventFilter: string;
  onSearchChange: (value: string) => void;
  onAttendingFilterChange: (value: string) => void;
  onEventFilterChange: (value: string) => void;
  onSubmitFilters: (event: FormEvent) => void;
  onSelectGuest: (record: AdminRecord) => void;
  onGenerateGuestCode: (record: AdminRecord) => void;
  generatingGuestId: number | null;
}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [records.length, search, attendingFilter, eventFilter]);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return records.slice(startIndex, startIndex + PAGE_SIZE);
  }, [records, safePage]);
  const rowStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rowEnd = records.length === 0 ? 0 : Math.min(safePage * PAGE_SIZE, records.length);

  return (
    <section className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-[26px] max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,245,239,0.94))] max-[450px]:p-3.5 max-[450px]:shadow-[0_24px_48px_-34px_rgba(63,47,37,0.22)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
            Guest Records
          </p>
          <h3 className="mt-2 font-serif text-2xl text-charcoal">RSVP Guest List</h3>
          <p className="mt-2 hidden text-[12px] text-muted-foreground max-[450px]:block">
            Cari tamu, cek status, lalu buka detail atau generate guest code langsung dari sini.
          </p>
        </div>

        <form
          onSubmit={onSubmitFilters}
          className="grid gap-2 sm:grid-cols-3 lg:w-[640px] max-[450px]:rounded-[22px] max-[450px]:border max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-[#fcfaf7] max-[450px]:p-3"
        >
          <label className="sm:col-span-3 max-[450px]:sm:col-span-1">
            <span className="mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Name, email, phone, guest code"
                className={`${adminInputCls()} pl-10`}
              />
            </div>
          </label>

          <SelectField
            label="Attendance"
            value={attendingFilter}
            onChange={onAttendingFilterChange}
            options={[
              { label: "All attendance", value: "all" },
              { label: "Attending", value: "yes" },
              { label: "Unable to attend", value: "no" },
            ]}
          />
          <SelectField
            label="Event"
            value={eventFilter}
            onChange={onEventFilterChange}
            options={[
              { label: "All events", value: "all" },
              { label: "Holy Matrimony", value: "holy_matrimony" },
              { label: "Lunch Celebration", value: "syukuran" },
            ]}
          />
          <button
            type="submit"
            className="mt-[1.45rem] inline-flex h-10 items-center justify-center rounded-[12px] bg-charcoal px-4 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal/92 max-[450px]:mt-0 max-[450px]:h-11 max-[450px]:rounded-[16px]"
          >
            Apply Filters
          </button>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-[16px] border border-[rgba(200,182,153,0.22)] max-[450px]:hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-charcoal text-left text-[0.58rem] uppercase tracking-[0.2em] text-ivory">
                {["No", "Guest", "Guest Code", "Contact", "Attendance", "Events", "Check-In"].map(
                  (label) => (
                    <th key={label} className="px-3 py-2.5 font-medium">
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                  >
                    Loading guest list…
                  </td>
                </tr>
              )}

              {!loading && paginatedRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-[12px] text-muted-foreground"
                  >
                    No guests found for this view.
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedRecords.map((record, index) => (
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
                          Submitted {record.submittedAtLabel}
                        </span>
                      </button>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[11px] uppercase tracking-[0.16em] text-taupe">
                      {record.guestCode ? (
                        record.guestCode
                      ) : (
                        <button
                          type="button"
                          onClick={() => onGenerateGuestCode(record)}
                          disabled={generatingGuestId === record.id}
                          className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,182,153,0.34)] bg-cream/60 px-3 py-2 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-charcoal transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {generatingGuestId === record.id ? (
                            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {generatingGuestId === record.id ? "Generating..." : "Generate Code"}
                        </button>
                      )}
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      <div>{record.email}</div>
                      <div className="mt-1">{record.phone || "-"}</div>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-charcoal">
                      <div>{record.attendingLabel}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {record.guestsLabel}
                      </div>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      {record.eventsLabel}
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      <div>M: {record.holyMatrimonyCheckedInLabel}</div>
                      <div className="mt-1">L: {record.syukuranCheckedInLabel}</div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

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

      <div className="hidden max-[450px]:mt-4 max-[450px]:block">
        <div className="mb-3 flex items-center justify-between rounded-[18px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7] px-3.5 py-3 text-[12px] text-muted-foreground">
          <span>
            Showing {rowStart}-{rowEnd}
          </span>
          <span>{records.length} guests</span>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="rounded-[20px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7] px-4 py-8 text-center text-[12px] text-muted-foreground">
              Loading guest list...
            </div>
          )}

          {!loading && paginatedRecords.length === 0 && (
            <div className="rounded-[20px] border border-[rgba(200,182,153,0.18)] bg-[#fcfaf7] px-4 py-8 text-center text-[12px] text-muted-foreground">
              No guests found for this view.
            </div>
          )}

          {!loading &&
            paginatedRecords.map((record, index) => (
              <article
                key={record.id}
                className="rounded-[22px] border border-[rgba(200,182,153,0.2)] bg-[#fcfaf7] p-4 shadow-[0_18px_36px_-28px_rgba(63,47,37,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onSelectGuest(record)} className="text-left">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-taupe">
                      Guest {rowStart + index}
                    </p>
                    <h4 className="mt-2 text-[16px] font-medium leading-snug text-charcoal">
                      {record.fullName}
                    </h4>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Submitted {record.submittedAtLabel}
                    </p>
                  </button>

                  <span className="rounded-full bg-cream px-3 py-1 text-[0.58rem] uppercase tracking-[0.2em] text-charcoal">
                    {record.attendingLabel}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                  <div>
                    <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">
                      Guest Code
                    </p>
                    <p className="mt-1 break-all text-charcoal">
                      {record.guestCode || "Not generated yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">Seats</p>
                    <p className="mt-1 text-charcoal">{record.guestsLabel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">Contact</p>
                    <p className="mt-1 break-all text-charcoal">{record.email || "-"}</p>
                    <p className="mt-1 text-charcoal">{record.phone || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">Events</p>
                    <p className="mt-1 text-charcoal">{record.eventsLabel}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[0.56rem] uppercase tracking-[0.22em] text-taupe">
                      Check-In
                    </p>
                    <p className="mt-1 text-charcoal">M: {record.holyMatrimonyCheckedInLabel}</p>
                    <p className="mt-1 text-charcoal">L: {record.syukuranCheckedInLabel}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectGuest(record)}
                    className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[rgba(200,182,153,0.24)] bg-white px-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-charcoal"
                  >
                    View Detail
                  </button>

                  {record.guestCode ? (
                    <div className="inline-flex h-11 items-center justify-center rounded-[16px] bg-charcoal px-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ivory">
                      Code Ready
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onGenerateGuestCode(record)}
                      disabled={generatingGuestId === record.id}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[16px] bg-charcoal px-4 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ivory disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {generatingGuestId === record.id ? (
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {generatingGuestId === record.id ? "Generating..." : "Generate Code"}
                    </button>
                  )}
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
    </section>
  );
}
