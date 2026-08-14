import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { RefreshCcw, Search } from "lucide-react";

import { PaginationControls, SelectField, adminInputCls } from "@/admin/components/AdminUi";
import type { AdminRecord } from "@/admin/types";

const PAGE_SIZE = 10;

function guestInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [records.length, search, attendingFilter, eventFilter]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const focusSearch = () => {
      searchInputRef.current?.focus();
    };

    window.addEventListener("admin-mobile-focus-guest-search", focusSearch);
    return () => window.removeEventListener("admin-mobile-focus-guest-search", focusSearch);
  }, []);

  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (safePage - 1) * PAGE_SIZE;
    return records.slice(startIndex, startIndex + PAGE_SIZE);
  }, [records, safePage]);
  const rowStart = records.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rowEnd = records.length === 0 ? 0 : Math.min(safePage * PAGE_SIZE, records.length);

  return (
    <section className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-none max-[450px]:border-0 max-[450px]:bg-transparent max-[450px]:p-0 max-[450px]:shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between max-[450px]:hidden">
        <div>
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
            Guest Records
          </p>
          <h3 className="mt-2 font-serif text-2xl text-charcoal">RSVP Guest List</h3>
        </div>

        <form onSubmit={onSubmitFilters} className="grid gap-2 sm:grid-cols-3 lg:w-[640px]">
          <label className="sm:col-span-3">
            <span className="mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" />
              <input
                ref={searchInputRef}
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
            className="mt-[1.45rem] inline-flex h-10 items-center justify-center rounded-[12px] bg-charcoal px-4 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal/92"
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

      <div className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-card px-4 py-4">
          <p className="text-[8px] font-bold uppercase tracking-[0.26em] text-[#8f8379]">
            Guest search
          </p>
          <h2 className="wa-admin-mobile-title mt-2 text-[22px] leading-[1.04]">
            RSVP guest records
          </h2>

          <div className="mt-4 rounded-[18px] border border-[rgba(92,72,57,0.12)] bg-white/90 px-3">
            <div className="flex h-11 items-center gap-2">
              <Search className="h-4 w-4 text-[#9a8d83]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search guest, phone, email, code"
                className="h-full w-full border-0 bg-transparent text-[11px] text-charcoal outline-none placeholder:text-[#aa9d93]"
              />
            </div>
          </div>

          <form onSubmit={onSubmitFilters} className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={attendingFilter}
                onChange={(event) => onAttendingFilterChange(event.target.value)}
                className="h-11 rounded-[16px] border border-[rgba(92,72,57,0.12)] bg-white/90 px-3 text-[10px] text-[#52463e] outline-none"
              >
                <option value="all">All Attendance</option>
                <option value="yes">Attending</option>
                <option value="no">Unable to attend</option>
              </select>

              <select
                value={eventFilter}
                onChange={(event) => onEventFilterChange(event.target.value)}
                className="h-11 rounded-[16px] border border-[rgba(92,72,57,0.12)] bg-white/90 px-3 text-[10px] text-[#52463e] outline-none"
              >
                <option value="all">All Events</option>
                <option value="holy_matrimony">Holy Matrimony</option>
                <option value="syukuran">Lunch Celebration</option>
              </select>
            </div>

            <button
              type="submit"
              className="wa-admin-mobile-primary-btn inline-flex h-11 w-full items-center justify-center rounded-[18px] text-[10px] font-extrabold uppercase tracking-[0.22em]"
            >
              Apply Filters
            </button>
          </form>
        </div>

        <div className="wa-admin-mobile-section">
          <div className="wa-admin-mobile-section-head">
            <h2>{records.length} Guests</h2>
            <button type="button">Newest first</button>
          </div>

          <div className="wa-admin-mobile-list">
            {loading && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                Loading guest list...
              </div>
            )}

            {!loading && paginatedRecords.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                No guests found for this view.
              </div>
            )}

            {!loading &&
              paginatedRecords.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onSelectGuest(record)}
                  className="w-full border-t border-[rgba(240,232,223,1)] px-3 py-3 text-left first:border-t-0"
                >
                  <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-3">
                    <div className="wa-admin-mobile-avatar h-[34px] w-[34px]">
                      {guestInitials(record.fullName)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold text-charcoal">
                        {record.fullName}
                      </div>
                      <div className="mt-1 text-[7.5px] font-semibold uppercase tracking-[0.14em] text-[#6f8f63]">
                        {record.attendingLabel}
                      </div>
                      <div className="mt-1 truncate text-[8px] text-[#8e8178]">
                        {record.eventsLabel}
                      </div>
                      <div className="mt-1 truncate text-[8px] text-[#8e8178]">
                        {record.email || record.phone || "-"}
                      </div>
                      <div className="mt-1 text-[7px] uppercase tracking-[0.14em] text-[#aa9d93]">
                        {record.guestCode || "Guest code empty"}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="wa-admin-mobile-status">
                        {record.guestCode ? "Ready" : "Pending"}
                      </span>
                      <span className="text-[14px] text-[#a69990]">›</span>
                    </div>
                  </div>

                  {!record.guestCode && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onGenerateGuestCode(record);
                        }}
                        disabled={generatingGuestId === record.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(200,182,153,0.3)] bg-[#f8f2ea] px-3 py-2 text-[7px] font-bold uppercase tracking-[0.18em] text-charcoal disabled:opacity-45"
                      >
                        {generatingGuestId === record.id ? (
                          <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : null}
                        {generatingGuestId === record.id ? "Generating..." : "Generate Code"}
                      </button>
                    </div>
                  )}
                </button>
              ))}
          </div>

          {!loading && records.length > 0 && (
            <div className="wa-admin-mobile-soft-card mt-3 overflow-hidden">
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
    </section>
  );
}
