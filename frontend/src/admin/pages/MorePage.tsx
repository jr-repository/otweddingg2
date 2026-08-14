import { Download, LogOut, User2 } from "lucide-react";

import type { AdminUser } from "@/admin/types";

export function MorePage({
  user,
  exporting,
  onExport,
  onLogout,
}: {
  user: AdminUser;
  exporting: "" | "excel" | "pdf";
  onExport: (kind: "excel" | "pdf") => void;
  onLogout: () => void;
}) {
  return (
    <section className="space-y-4 max-[450px]:space-y-3">
      <div className="hidden rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 p-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] max-[450px]:block max-[450px]:rounded-[14px] max-[450px]:border-[rgba(200,182,153,0.22)] max-[450px]:bg-white/80 max-[450px]:p-0 max-[450px]:shadow-none">
        <div className="flex items-center gap-3 px-3.5 py-3.5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(145deg,#aa8455,#725638)] text-sm font-medium text-white">
            L
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[0.95rem] leading-none text-charcoal">
              L &amp; A Admin
            </h3>
            <p className="mt-1 truncate text-[0.44rem] uppercase tracking-[0.22em] text-taupe">
              Signed in as {user.username}
            </p>
          </div>
          <span className="text-sm text-taupe">›</span>
        </div>
      </div>

      <div className="hidden max-[450px]:block">
        <div className="mb-2 px-1">
          <p className="text-[0.44rem] font-medium uppercase tracking-[0.24em] text-taupe">
            Quick Exports
          </p>
        </div>

        <div className="overflow-hidden rounded-[14px] border border-[rgba(200,182,153,0.22)] bg-white/82 shadow-[0_8px_22px_-18px_rgba(63,47,37,0.18)]">
          <button
            type="button"
            onClick={() => onExport("excel")}
            className="flex w-full items-center gap-3 border-b border-[rgba(200,182,153,0.18)] px-3.5 py-3 text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-cream text-charcoal">
              <Download className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                {exporting === "excel" ? "Preparing Excel" : "Export Excel"}
              </strong>
              <span className="mt-1 block text-[0.42rem] uppercase tracking-[0.16em] text-taupe">
                Download RSVP guest data
              </span>
            </span>
            <span className="text-sm text-taupe">›</span>
          </button>

          <button
            type="button"
            onClick={() => onExport("pdf")}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-cream text-charcoal">
              <Download className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                {exporting === "pdf" ? "Preparing PDF" : "Export PDF"}
              </strong>
              <span className="mt-1 block text-[0.42rem] uppercase tracking-[0.16em] text-taupe">
                Generate compact RSVP report
              </span>
            </span>
            <span className="text-sm text-taupe">›</span>
          </button>
        </div>
      </div>

      <div className="hidden max-[450px]:block">
        <div className="overflow-hidden rounded-[14px] border border-[rgba(200,182,153,0.22)] bg-white/82 shadow-[0_8px_22px_-18px_rgba(63,47,37,0.18)]">
          <button type="button" className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-cream text-charcoal">
              <User2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                Admin Profile
              </strong>
              <span className="mt-1 block text-[0.42rem] uppercase tracking-[0.16em] text-taupe">
                {user.displayName || user.username}
              </span>
            </span>
            <span className="text-sm text-taupe">›</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 border-t border-[rgba(200,182,153,0.18)] px-3.5 py-3 text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#f5e8e3] text-[#8d4d3e]">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] text-charcoal">
                Logout
              </strong>
              <span className="mt-1 block text-[0.42rem] uppercase tracking-[0.16em] text-taupe">
                End this admin session
              </span>
            </span>
            <span className="text-sm text-taupe">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
