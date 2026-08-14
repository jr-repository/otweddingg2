import type { FormEvent } from "react";
import { Download, ExternalLink, Images, Search } from "lucide-react";

import { SelectField, adminInputCls } from "@/admin/components/AdminUi";
import type { PhotoboothRecord } from "@/admin/types";

export function PhotoboothPage({
  loading,
  records,
  search,
  eventFilter,
  onSearchChange,
  onEventFilterChange,
  onSubmitFilters,
}: {
  loading: boolean;
  records: PhotoboothRecord[];
  search: string;
  eventFilter: string;
  onSearchChange: (value: string) => void;
  onEventFilterChange: (value: string) => void;
  onSubmitFilters: (event: FormEvent) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
              Photobooth Results
            </p>
            <h3 className="mt-2 font-serif text-2xl text-charcoal">Saved Guest Captures</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Semua hasil final photobooth yang sudah tersimpan akan tampil di sini.
            </p>
          </div>

          <form onSubmit={onSubmitFilters} className="grid gap-2 sm:grid-cols-3 lg:w-[640px]">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[0.58rem] font-medium uppercase tracking-[0.22em] text-taupe">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe" />
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Guest name or guest code"
                  className={`${adminInputCls()} pl-10`}
                />
              </div>
            </label>

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
          </form>
        </div>
      </div>

      <div className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-card px-4 py-4">
          <p className="text-[8px] font-bold uppercase tracking-[0.26em] text-[#8f8379]">
            Photobooth gallery
          </p>
          <h2 className="wa-admin-mobile-title mt-2 text-[22px] leading-[1.04]">
            Saved guest captures
          </h2>
          <p className="mt-2 text-[10px] leading-[1.55] text-[#8f8379]">
            Semua hasil final photobooth yang sudah tersimpan akan tampil di sini.
          </p>

          <form onSubmit={onSubmitFilters} className="mt-4 space-y-3">
            <div className="rounded-[18px] border border-[rgba(92,72,57,0.12)] bg-white/90 px-3">
              <div className="flex h-11 items-center gap-2">
                <Search className="h-4 w-4 text-[#9a8d83]" />
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search guest or guest code"
                  className="h-full w-full border-0 bg-transparent text-[11px] text-charcoal outline-none placeholder:text-[#aa9d93]"
                />
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_116px] gap-2">
              <select
                value={eventFilter}
                onChange={(event) => onEventFilterChange(event.target.value)}
                className="h-11 rounded-[16px] border border-[rgba(92,72,57,0.12)] bg-white/90 px-3 text-[10px] text-[#52463e] outline-none"
              >
                <option value="all">All Events</option>
                <option value="holy_matrimony">Holy Matrimony</option>
                <option value="syukuran">Lunch Celebration</option>
              </select>

              <button
                type="submit"
                className="wa-admin-mobile-primary-btn inline-flex h-11 items-center justify-center rounded-[16px] text-[10px] font-extrabold uppercase tracking-[0.2em]"
              >
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading && (
        <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 px-4 py-8 text-center text-[12px] text-muted-foreground shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-[24px] max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-white/86">
          Loading photobooth results...
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 px-4 py-10 text-center shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-[24px] max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-white/86">
          <Images className="mx-auto h-8 w-8 text-taupe/70" />
          <p className="mt-3 text-[12px] uppercase tracking-[0.24em] text-taupe">
            No photobooth results yet
          </p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 max-[450px]:gap-3">
          {records.map((record) => (
            <article
              key={record.id}
              className="overflow-hidden rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:rounded-[24px] max-[450px]:border-[rgba(200,182,153,0.2)] max-[450px]:bg-white/86"
            >
              <div className="aspect-[4/5] overflow-hidden bg-cream/50 max-[450px]:aspect-[5/6]">
                {record.finalImageUrl ? (
                  <img
                    src={record.finalImageUrl}
                    alt={`Photobooth result for ${record.guestName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
                    Preview unavailable
                  </div>
                )}
              </div>

              <div className="space-y-3 px-4 py-4 max-[450px]:space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-charcoal max-[450px]:text-[15px]">
                      {record.guestName}
                    </p>
                    <p className="mt-1 truncate text-[11px] uppercase tracking-[0.16em] text-taupe">
                      {record.guestCode}
                    </p>
                  </div>
                  <span className="rounded-full bg-cream px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-charcoal">
                    {record.eventLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    <p className="uppercase tracking-[0.18em] text-taupe">Captured</p>
                    <p className="mt-1">{record.capturedAtLabel}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.18em] text-taupe">Layout</p>
                    <p className="mt-1">{record.layoutMode}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.18em] text-taupe">Shots</p>
                    <p className="mt-1">{record.shotCount}</p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.18em] text-taupe">Saved By</p>
                    <p className="mt-1">{record.createdBy || "-"}</p>
                  </div>
                </div>

                <div className="flex gap-2 max-[450px]:grid max-[450px]:grid-cols-2">
                  <a
                    href={record.finalImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[rgba(200,182,153,0.34)] bg-cream/50 px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-cream"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                  <a
                    href={record.finalImageUrl}
                    download={`photobooth-${record.guestCode}.jpg`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal/92"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
