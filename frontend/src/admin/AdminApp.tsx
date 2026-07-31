import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCcw,
  ScanLine,
  Users,
} from "lucide-react";

import { AuthField, SidebarAction, SidebarButton, adminInputCls } from "@/admin/components/AdminUi";
import { GuestDetailModal } from "@/admin/components/GuestDetailModal";
import { GuestListPage } from "@/admin/pages/GuestListPage";
import { OverviewPage } from "@/admin/pages/OverviewPage";
import { ScannerPage } from "@/admin/pages/ScannerPage";
import type {
  AdminRecord,
  AdminUser,
  AdminView,
  DashboardPayload,
} from "@/admin/types";
import { EMPTY_SUMMARY } from "@/admin/utils";
import { ADMIN_TOKEN_STORAGE_KEY, API_BASE_URL } from "@/lib/config";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "LNA2027Admin!";

function readStoredAdminToken() {
  if (typeof window === "undefined") return "";

  try {
    return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredAdminToken(token: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  } catch {}
}

function clearStoredAdminToken() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch {}
}

export function AdminApp() {
  const [token, setToken] = useState<string>(() => readStoredAdminToken());
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>("overview");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!token) {
        setLoadingSession(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => ({}))) as { user?: AdminUser };

        if (!response.ok || !data.user) {
          throw new Error("Session expired.");
        }

        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          clearStoredAdminToken();
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingSession(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLoggedIn = (nextToken: string, nextUser: AdminUser) => {
    writeStoredAdminToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setActiveView("overview");
  };

  const handleLogout = () => {
    clearStoredAdminToken();
    setToken("");
    setUser(null);
  };

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f1e7_0%,#fdfbf8_100%)]">
        <div className="rounded-[18px] border border-[rgba(200,182,153,0.3)] bg-white px-6 py-4 text-[12px] text-muted-foreground shadow-[0_20px_50px_-36px_rgba(63,47,37,0.2)]">
          Loading admin panel…
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <AdminLogin onLoggedIn={handleLoggedIn} />;
  }

  return (
    <AdminWorkspace
      token={token}
      user={user}
      activeView={activeView}
      onViewChange={setActiveView}
      onLogout={handleLogout}
    />
  );
}

function AdminLogin({ onLoggedIn }: { onLoggedIn: (token: string, user: AdminUser) => void }) {
  const [username, setUsername] = useState(DEFAULT_ADMIN_USERNAME);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        token?: string;
        user?: AdminUser;
      };

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.message ?? "Login failed.");
      }

      onLoggedIn(data.token, data.user);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6efe6_0%,#fdfbf9_100%)] px-4 py-6 text-charcoal sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl overflow-hidden rounded-[24px] border border-[rgba(200,182,153,0.34)] bg-white shadow-[0_28px_80px_-44px_rgba(63,47,37,0.24)] lg:grid-cols-[1fr_0.92fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(135deg,rgba(33,27,24,0.96),rgba(96,70,48,0.82))] p-8 text-ivory lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,190,152,0.32),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_24%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em] text-ivory/70">
                L &amp; A Admin
              </p>
              <h1 className="mt-5 max-w-md font-serif text-5xl leading-none">
                Compact wedding operations dashboard.
              </h1>
              <p className="mt-5 max-w-lg text-[13px] leading-relaxed text-ivory/74">
                Manage RSVP guests, view QR guest passes, and run venue check-in from one admin area.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "Protected admin access",
                "Unique QR guest passes",
                "Live venue check-in flow",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-[12px] text-ivory/82"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center px-5 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em] text-taupe">
              Admin Login
            </p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
              Sign in to manage the celebration.
            </h2>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              Default access is ready and can be changed later through backend environment settings.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <AuthField label="Username">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={adminInputCls()}
                />
              </AuthField>
              <AuthField label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={adminInputCls()}
                />
              </AuthField>

              {error && (
                <div className="rounded-[12px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-charcoal px-5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-charcoal/92 disabled:opacity-60"
              >
                {submitting ? "Signing In…" : "Enter Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminWorkspace({
  token,
  user,
  activeView,
  onViewChange,
  onLogout,
}: {
  token: string;
  user: AdminUser;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => void;
}) {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [attendingFilter, setAttendingFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState<AdminRecord | null>(null);
  const [exporting, setExporting] = useState<"" | "excel" | "pdf">("");
  const [sidebarCompact, setSidebarCompact] = useState(false);

  const loadDashboard = useCallback(
    async (filters?: {
      search?: string;
      attending?: string;
      event?: string;
    }) => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (filters?.search) params.set("search", filters.search);
        if (filters?.attending && filters.attending !== "all") params.set("attending", filters.attending);
        if (filters?.event && filters.event !== "all") params.set("event", filters.event);

        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => ({}))) as DashboardPayload & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "Unable to load dashboard.");
        }

        setDashboard({
          summary: data.summary ?? EMPTY_SUMMARY,
          records: Array.isArray(data.records) ? data.records : [],
        });
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filteredRecords = useMemo(() => {
    if (!dashboard) return [];
    return Array.isArray(dashboard.records) ? dashboard.records : [];
  }, [dashboard]);

  const pageMeta = useMemo(() => {
    if (activeView === "guests") {
      return {
        badge: "Guest Management",
        title: "Compact RSVP records",
        description: "Search, filter, paginate, and open each guest QR detail without changing RSVP logic.",
      };
    }

    if (activeView === "scanner") {
      return {
        badge: "Venue Scanner",
        title: "Self check-in console",
        description: "Run QR scanning and fallback manual search in one compact venue-ready screen.",
      };
    }

    return {
      badge: "Wedding Operations",
      title: "Invitation control center",
      description: "Monitor RSVP totals, recent activity, and scanner readiness from a smaller, easier-to-read admin view.",
    };
  }, [activeView]);

  const handleRefresh = () => {
    void loadDashboard({
      search,
      attending: attendingFilter,
      event: eventFilter,
    });
  };

  const handleFilterSubmit = (event: FormEvent) => {
    event.preventDefault();
    void loadDashboard({
      search,
      attending: attendingFilter,
      event: eventFilter,
    });
  };

  const handleExport = async (kind: "excel" | "pdf") => {
    try {
      setExporting(kind);
      const response = await fetch(`${API_BASE_URL}/reports/rsvp/${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Unable to export report.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = kind === "excel" ? "WeddingRsvpReport.xlsx" : "WeddingRsvpReport.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to export report.");
    } finally {
      setExporting("");
    }
  };

  const handleRecordUpdated = useCallback(
    (updatedRecord: AdminRecord) => {
      setDashboard((current) =>
        current
          ? {
              ...current,
              records: current.records.map((record) =>
                record.id === updatedRecord.id ? updatedRecord : record,
              ),
            }
          : current,
      );

      void loadDashboard({
        search,
        attending: attendingFilter,
        event: eventFilter,
      });
    },
    [attendingFilter, eventFilter, loadDashboard, search],
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1e7_0%,#fdfbf9_100%)] text-charcoal">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className={`flex w-full flex-col border-b border-[rgba(200,182,153,0.28)] bg-[linear-gradient(180deg,rgba(33,27,24,0.98),rgba(58,44,34,0.96))] px-4 py-4 text-ivory transition-all duration-300 lg:min-h-screen lg:border-b-0 lg:border-r ${
            sidebarCompact ? "lg:w-[88px]" : "lg:w-[250px]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className={sidebarCompact ? "lg:hidden" : ""}>
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em] text-ivory/66">
                L &amp; A Admin
              </p>
              {!sidebarCompact && <h1 className="mt-2 font-serif text-2xl leading-none">Dashboard</h1>}
            </div>

            <button
              type="button"
              onClick={() => setSidebarCompact((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-ivory/84 transition-colors hover:bg-white/10"
              title={sidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`mt-5 rounded-[16px] border border-white/10 bg-white/6 px-4 py-3 text-[12px] text-ivory/78 ${
              sidebarCompact ? "hidden lg:hidden" : ""
            }`}
          >
            Signed in as <span className="font-medium text-ivory">{user.username}</span>
          </div>

          <nav className="mt-5 space-y-1.5">
            <SidebarButton
              active={activeView === "overview"}
              compact={sidebarCompact}
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Overview"
              onClick={() => onViewChange("overview")}
            />
            <SidebarButton
              active={activeView === "guests"}
              compact={sidebarCompact}
              icon={<Users className="h-4 w-4" />}
              label="Guest List"
              onClick={() => onViewChange("guests")}
            />
            <SidebarButton
              active={activeView === "scanner"}
              compact={sidebarCompact}
              icon={<ScanLine className="h-4 w-4" />}
              label="Venue Scanner"
              onClick={() => onViewChange("scanner")}
            />
          </nav>

          <div className="mt-5 rounded-[16px] border border-white/10 bg-white/6 p-3">
            {!sidebarCompact && (
              <p className="mb-3 text-[0.56rem] font-medium uppercase tracking-[0.24em] text-ivory/64">
                Quick Exports
              </p>
            )}
            <div className="space-y-2">
              <SidebarAction
                compact={sidebarCompact}
                label={exporting === "excel" ? "Preparing Excel…" : "Export Excel"}
                onClick={() => void handleExport("excel")}
              />
              <SidebarAction
                compact={sidebarCompact}
                label={exporting === "pdf" ? "Preparing PDF…" : "Export PDF"}
                onClick={() => void handleExport("pdf")}
              />
            </div>
          </div>

          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={onLogout}
              className={`inline-flex w-full items-center rounded-[14px] border border-white/10 px-3 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory/84 transition-colors hover:bg-white/8 ${
                sidebarCompact ? "justify-center" : "gap-2"
              }`}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCompact && "Logout"}
            </button>
          </div>
        </aside>

        <main className="flex-1 px-3 py-4 sm:px-4 lg:px-5 lg:py-5">
          <div className="mx-auto max-w-[1500px]">
            <div className="flex flex-col gap-3 rounded-[18px] border border-[rgba(200,182,153,0.28)] bg-white/88 px-4 py-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
                  {pageMeta.badge}
                </p>
                <h2 className="mt-2 font-serif text-2xl leading-none text-charcoal sm:text-3xl">
                  {pageMeta.title}
                </h2>
                <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-muted-foreground">
                  {pageMeta.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-[rgba(200,182,153,0.34)] bg-cream/50 px-4 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-cream"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-[14px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
                {error}
              </div>
            )}

            <div className="mt-4">
              {activeView === "overview" && (
                <OverviewPage
                  loading={loading}
                  records={filteredRecords}
                  summary={dashboard?.summary ?? null}
                  onSelectGuest={setSelectedGuest}
                />
              )}

              {activeView === "guests" && (
                <GuestListPage
                  loading={loading}
                  records={filteredRecords}
                  search={search}
                  attendingFilter={attendingFilter}
                  eventFilter={eventFilter}
                  onSearchChange={setSearch}
                  onAttendingFilterChange={setAttendingFilter}
                  onEventFilterChange={setEventFilter}
                  onSubmitFilters={handleFilterSubmit}
                  onSelectGuest={setSelectedGuest}
                />
              )}

              {activeView === "scanner" && dashboard && (
                <ScannerPage
                  token={token}
                  records={dashboard.records}
                  onRecordUpdated={handleRecordUpdated}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedGuest && <GuestDetailModal record={selectedGuest} onClose={() => setSelectedGuest(null)} />}
    </div>
  );
}
