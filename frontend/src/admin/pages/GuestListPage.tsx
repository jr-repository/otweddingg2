import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";

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
    <section className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
              { label: "Syukuran", value: "syukuran" },
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

      <div className="mt-4 overflow-hidden rounded-[16px] border border-[rgba(200,182,153,0.22)]">
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
                  <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-muted-foreground">
                    Loading guest list…
                  </td>
                </tr>
              )}

              {!loading && paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-muted-foreground">
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
                      <button type="button" onClick={() => onSelectGuest(record)} className="text-left">
                        <span className="block text-[12px] font-medium text-charcoal">{record.fullName}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          Submitted {record.submittedAtLabel}
                        </span>
                      </button>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[11px] uppercase tracking-[0.16em] text-taupe">
                      {record.guestCode}
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      <div>{record.email}</div>
                      <div className="mt-1">{record.phone || "-"}</div>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-charcoal">
                      <div>{record.attendingLabel}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{record.guestsLabel}</div>
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      {record.eventsLabel}
                    </td>
                    <td className="border-t border-[rgba(200,182,153,0.16)] px-3 py-3 text-[12px] text-muted-foreground">
                      <div>M: {record.holyMatrimonyCheckedInLabel}</div>
                      <div className="mt-1">S: {record.syukuranCheckedInLabel}</div>
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
    </section>
  );
}
