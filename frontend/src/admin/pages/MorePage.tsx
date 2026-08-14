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
      <div className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-card px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="wa-admin-mobile-abstract !mx-0 !h-12 !w-12 text-[16px] font-semibold">
              L
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-bold uppercase tracking-[0.26em] text-[#8f8379]">
                Admin profile
              </p>
              <h2 className="wa-admin-mobile-title mt-1 text-[20px] leading-none">
                L &amp; A Admin
              </h2>
              <p className="mt-1 truncate text-[10px] text-[#8f8379]">
                Signed in as {user.displayName || user.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-section-head px-1">
          <h2>Quick Actions</h2>
          <button type="button">Admin tools</button>
        </div>

        <div className="wa-admin-mobile-list">
          <button
            type="button"
            onClick={() => onExport("excel")}
            className="wa-admin-mobile-row w-full text-left"
          >
            <div className="wa-admin-mobile-avatar">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[9px] font-semibold text-charcoal">
                {exporting === "excel" ? "Preparing Excel" : "Export Excel"}
              </div>
              <div className="mt-[3px] text-[7px] text-[#8f8379]">Download RSVP guest data</div>
            </div>
            <span className="wa-admin-mobile-status">File</span>
            <span className="text-[14px] text-[#a69990]">›</span>
          </button>

          <button
            type="button"
            onClick={() => onExport("pdf")}
            className="wa-admin-mobile-row w-full text-left"
          >
            <div className="wa-admin-mobile-avatar">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[9px] font-semibold text-charcoal">
                {exporting === "pdf" ? "Preparing PDF" : "Export PDF"}
              </div>
              <div className="mt-[3px] text-[7px] text-[#8f8379]">Generate compact RSVP report</div>
            </div>
            <span className="wa-admin-mobile-status">Report</span>
            <span className="text-[14px] text-[#a69990]">›</span>
          </button>

          <button type="button" className="wa-admin-mobile-row w-full text-left">
            <div className="wa-admin-mobile-avatar">
              <User2 className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[9px] font-semibold text-charcoal">Admin Profile</div>
              <div className="mt-[3px] text-[7px] text-[#8f8379]">
                {user.displayName || user.username}
              </div>
            </div>
            <span className="wa-admin-mobile-status">Account</span>
            <span className="text-[14px] text-[#a69990]">›</span>
          </button>

          <button type="button" onClick={onLogout} className="wa-admin-mobile-row w-full text-left">
            <div className="wa-admin-mobile-avatar bg-[#f5e8e3] text-[#8d4d3e]">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[9px] font-semibold text-charcoal">Logout</div>
              <div className="mt-[3px] text-[7px] text-[#8f8379]">End this admin session</div>
            </div>
            <span className="wa-admin-mobile-status">Exit</span>
            <span className="text-[14px] text-[#a69990]">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
