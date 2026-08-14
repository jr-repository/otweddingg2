import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
        <div className="rounded-[12px] border border-[rgba(238,229,219,1)] bg-white px-[10px]">
          <div className="flex h-[38px] items-center gap-[7px]">
            <Search className="h-[14px] w-[14px] text-[#9a8d83]" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search guest or code..."
              className="h-full w-full border-0 bg-transparent text-[8.5px] text-charcoal outline-none placeholder:text-[#aa9d93]"
            />
          </div>
        </div>

        <form onSubmit={onSubmitFilters} className="mt-[7px] grid grid-cols-2 gap-[6px]">
          <select
            value={attendingFilter}
            onChange={(event) => onAttendingFilterChange(event.target.value)}
            className="h-[33px] rounded-[10px] border border-[rgba(238,229,219,1)] bg-white px-[9px] text-[7.8px] text-[#52463e] outline-none"
          >
            <option value="all">All Attendance</option>
            <option value="yes">Attending</option>
            <option value="no">Unable to attend</option>
          </select>

          <select
            value={eventFilter}
            onChange={(event) => onEventFilterChange(event.target.value)}
            className="h-[33px] rounded-[10px] border border-[rgba(238,229,219,1)] bg-white px-[9px] text-[7.8px] text-[#52463e] outline-none"
          >
            <option value="all">All Events</option>
            <option value="holy_matrimony">Holy Matrimony</option>
            <option value="syukuran">Lunch Celebration</option>
          </select>
        </form>

        <div className="mb-[6px] mt-3 flex items-center justify-between px-0.5 text-[8px]">
          <strong className="font-medium text-charcoal">{records.length} Guests</strong>
          <span className="text-[#91857c]">Newest ↓</span>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-[rgba(238,229,219,1)] bg-white">
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
            paginatedRecords.map((record, index) => (
              <button
                key={record.id}
                type="button"
                onClick={() => onSelectGuest(record)}
                className={`grid w-full grid-cols-[31px_minmax(0,1fr)_auto_12px] items-center gap-2 px-[9px] py-[9px] text-left ${
                  index > 0 ? "border-t border-[rgba(238,229,219,1)]" : ""
                }`}
              >
                <div className="grid h-[31px] w-[31px] place-items-center rounded-full bg-[#f4eee6] font-serif text-[10px] text-[#705b43]">
                  {record.fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>

                <div className="min-w-0">
                  <div className="mb-[2px] text-[8.8px] font-semibold text-charcoal">
                    {record.fullName}
                  </div>
                  <div className="text-[6.9px] font-semibold leading-[1.4] text-[#608056]">
                    {record.attendingLabel}
                  </div>
                  <div className="truncate text-[6.9px] leading-[1.4] text-[#8e8178]">
                    {record.eventsLabel}
                  </div>
                  <div className="truncate text-[6.9px] leading-[1.4] text-[#8e8178]">
                    {record.email || record.phone || record.guestCode || "-"}
                  </div>
                </div>

                <span className="rounded-full bg-[#edf4e9] px-[6px] py-1 text-[6.8px] text-[#627d5a]">
                  {record.guestCode ? "Ready" : "Pending"}
                </span>
                <span className="text-[14px] text-[#a69990]">›</span>

                {!record.guestCode && (
                  <span className="col-span-4 mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onGenerateGuestCode(record);
                      }}
                      disabled={generatingGuestId === record.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(200,182,153,0.3)] bg-[#f8f2ea] px-2.5 py-1.5 text-[6.8px] font-semibold uppercase tracking-[0.14em] text-charcoal disabled:opacity-45"
                    >
                      {generatingGuestId === record.id ? (
                        <RefreshCcw className="h-3 w-3 animate-spin" />
                      ) : null}
                      {generatingGuestId === record.id ? "Generating..." : "Generate Code"}
                    </button>
                  </span>
                )}
              </button>
            ))}
        </div>

        {!loading && records.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-[13px] border border-[rgba(238,229,219,1)] bg-white">
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
