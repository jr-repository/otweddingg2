import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Images, LayoutDashboard, LogOut, Menu, RefreshCcw, ScanLine, Users } from "lucide-react";

import { AuthField, SidebarAction, SidebarButton, adminInputCls } from "@/admin/components/AdminUi";
import { GuestDetailModal } from "@/admin/components/GuestDetailModal";
import { GuestListPage } from "@/admin/pages/GuestListPage";
import { OverviewPage } from "@/admin/pages/OverviewPage";
import { PhotoboothPage } from "@/admin/pages/PhotoboothPage";
import type {
  AdminRecord,
  AdminUser,
  AdminView,
  DashboardPayload,
  PhotoboothRecord,
} from "@/admin/types";
import { EMPTY_SUMMARY, normalizeAdminRecord, normalizeAdminRecords } from "@/admin/utils";
import { ADMIN_TOKEN_STORAGE_KEY, API_BASE_URL } from "@/lib/config";

const ScannerPage = lazy(async () =>
  import("@/admin/pages/ScannerPage").then((module) => ({ default: module.ScannerPage })),
);

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "LNA2027Admin!";

class AdminViewErrorBoundary extends Component<
  {
    children: ReactNode;
    title?: string;
  },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Admin view render error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-[20px] border border-destructive/20 bg-white px-5 py-6 text-charcoal shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)]">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-taupe">
            Frontend Guard
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-tight">
            {this.props.title ?? "This admin section could not be rendered"}
          </h3>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            {this.state.error.message || "Unexpected frontend render error."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center rounded-full bg-charcoal px-4 py-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory"
          >
            Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
                Manage RSVP guests, view QR guest passes, and run venue check-in from one admin
                area.
              </p>
            </div>

            <div className="space-y-3">
              {["Protected admin access", "Unique QR guest passes", "Live venue check-in flow"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-[14px] border border-white/12 bg-white/6 px-4 py-3 text-[12px] text-ivory/82"
                  >
                    {item}
                  </div>
                ),
              )}
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
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [attendingFilter, setAttendingFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [photoboothRecords, setPhotoboothRecords] = useState<PhotoboothRecord[]>([]);
  const [photoboothLoading, setPhotoboothLoading] = useState(false);
  const [photoboothSearch, setPhotoboothSearch] = useState("");
  const [photoboothEventFilter, setPhotoboothEventFilter] = useState("all");
  const [selectedGuest, setSelectedGuest] = useState<AdminRecord | null>(null);
  const [exporting, setExporting] = useState<"" | "excel" | "pdf">("");
  const [generatingGuestId, setGeneratingGuestId] = useState<number | null>(null);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const navItems: Array<{
    view: AdminView;
    label: string;
    shortLabel: string;
    icon: ReactNode;
  }> = [
    {
      view: "overview",
      label: "Overview",
      shortLabel: "Home",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      view: "guests",
      label: "Guest List",
      shortLabel: "Guests",
      icon: <Users className="h-4 w-4" />,
    },
    {
      view: "scanner",
      label: "Venue Scanner",
      shortLabel: "Scan",
      icon: <ScanLine className="h-4 w-4" />,
    },
    {
      view: "photobooth",
      label: "Photobooth",
      shortLabel: "Booth",
      icon: <Images className="h-4 w-4" />,
    },
  ];

  const loadDashboard = useCallback(
    async (filters?: { search?: string; attending?: string; event?: string }) => {
      try {
        setLoading(true);
        setError("");
        setNotice("");

        const params = new URLSearchParams();
        if (filters?.search) params.set("search", filters.search);
        if (filters?.attending && filters.attending !== "all")
          params.set("attending", filters.attending);
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
          records: normalizeAdminRecords(data.records),
        });
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  const loadPhotobooth = useCallback(
    async (filters?: { search?: string; event?: string }) => {
      try {
        setPhotoboothLoading(true);
        setError("");
        setNotice("");

        const params = new URLSearchParams();
        if (filters?.search) params.set("search", filters.search);
        if (filters?.event && filters.event !== "all") params.set("event", filters.event);

        const response = await fetch(
          `${API_BASE_URL}/api/admin/photobooth/captures?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          records?: PhotoboothRecord[];
        };

        if (!response.ok) {
          throw new Error(data.message ?? "Unable to load photobooth results.");
        }

        setPhotoboothRecords(Array.isArray(data.records) ? data.records : []);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Unable to load photobooth results.",
        );
      } finally {
        setPhotoboothLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeView !== "photobooth") {
      return;
    }

    void loadPhotobooth({
      search: photoboothSearch,
      event: photoboothEventFilter,
    });
  }, [activeView, loadPhotobooth, photoboothEventFilter, photoboothSearch]);

  const filteredRecords = useMemo(() => {
    if (!dashboard) return [];
    return Array.isArray(dashboard.records) ? dashboard.records : [];
  }, [dashboard]);

  const pageMeta = useMemo(() => {
    if (activeView === "guests") {
      return {
        badge: "Guest Management",
        title: "Compact RSVP records",
        description:
          "Search, filter, paginate, and open each guest QR detail without changing RSVP logic.",
      };
    }

    if (activeView === "scanner") {
      return {
        badge: "Venue Scanner",
        title: "Self check-in console",
        description:
          "Run QR scanning and fallback manual search in one compact venue-ready screen.",
      };
    }

    if (activeView === "photobooth") {
      return {
        badge: "Photobooth Gallery",
        title: "Saved guest captures",
        description:
          "Review every final photobooth result that has already been saved by the scanner flow.",
      };
    }

    return {
      badge: "Wedding Operations",
      title: "Invitation control center",
      description:
        "Monitor RSVP totals, recent activity, and scanner readiness from a smaller, easier-to-read admin view.",
    };
  }, [activeView]);

  const handleRefresh = () => {
    if (activeView === "photobooth") {
      void loadPhotobooth({
        search: photoboothSearch,
        event: photoboothEventFilter,
      });
      return;
    }

    void loadDashboard({
      search,
      attending: attendingFilter,
      event: eventFilter,
    });
  };

  const handleFilterSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (activeView === "photobooth") {
      void loadPhotobooth({
        search: photoboothSearch,
        event: photoboothEventFilter,
      });
      return;
    }

    void loadDashboard({
      search,
      attending: attendingFilter,
      event: eventFilter,
    });
  };

  const handleExport = async (kind: "excel" | "pdf") => {
    try {
      setExporting(kind);
      setNotice("");
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
      const nextRecord = normalizeAdminRecord(updatedRecord);

      setDashboard((current) =>
        current
          ? {
              ...current,
              records: current.records.map((record) =>
                record.id === nextRecord.id ? nextRecord : record,
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

  const handleGenerateGuestCode = useCallback(
    async (record: AdminRecord) => {
      if (record.guestCode || generatingGuestId !== null) {
        return;
      }

      try {
        setGeneratingGuestId(record.id);
        setError("");
        setNotice("");

        const response = await fetch(
          `${API_BASE_URL}/api/admin/guests/${record.id}/generate-pass`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          record?: AdminRecord;
        };

        if (!response.ok || !data.record) {
          throw new Error(data.message ?? "Guest code could not be generated.");
        }

        handleRecordUpdated(data.record);
        setNotice(data.message ?? `Guest code for ${data.record.fullName} was generated.`);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Guest code could not be generated.",
        );
      } finally {
        setGeneratingGuestId(null);
      }
    },
    [generatingGuestId, handleRecordUpdated, token],
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f1e7_0%,#fdfbf9_100%)] text-charcoal max-[450px]:bg-[linear-gradient(180deg,#f4ede4_0%,#fbf7f2_28%,#f7f1e8_100%)]">
      <div className="flex min-h-screen flex-col lg:flex-row max-[450px]:min-h-[100dvh]">
        <aside
          className={`flex w-full flex-col border-b border-[rgba(200,182,153,0.28)] bg-[linear-gradient(180deg,rgba(33,27,24,0.98),rgba(58,44,34,0.96))] px-4 py-4 text-ivory transition-all duration-300 max-[450px]:hidden lg:min-h-screen lg:border-b-0 lg:border-r ${
            sidebarCompact ? "lg:w-[88px]" : "lg:w-[250px]"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className={sidebarCompact ? "lg:hidden" : ""}>
              <p className="text-[0.62rem] font-medium uppercase tracking-[0.34em] text-ivory/66">
                L &amp; A Admin
              </p>
              {!sidebarCompact && (
                <h1 className="mt-2 font-serif text-2xl leading-none">Dashboard</h1>
              )}
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
            {navItems.map((item) => (
              <SidebarButton
                key={item.view}
                active={activeView === item.view}
                compact={sidebarCompact}
                icon={item.icon}
                label={item.label}
                onClick={() => onViewChange(item.view)}
              />
            ))}
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

        <main className="flex-1 px-3 py-4 sm:px-4 lg:px-5 lg:py-5 max-[450px]:px-0 max-[450px]:py-0">
          <div className="mx-auto max-w-[1500px] max-[450px]:max-w-none max-[450px]:pb-[calc(96px+env(safe-area-inset-bottom))]">
            <div className="hidden max-[450px]:block">
              <div className="sticky top-0 z-30 border-b border-[rgba(200,182,153,0.18)] bg-[rgba(247,241,232,0.92)] px-4 pb-4 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.58rem] font-medium uppercase tracking-[0.32em] text-taupe">
                      L &amp; A Admin
                    </p>
                    <h2 className="mt-2 font-serif text-[1.9rem] leading-none text-charcoal">
                      {pageMeta.title}
                    </h2>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                      {pageMeta.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(200,182,153,0.28)] bg-white/84 text-charcoal shadow-[0_16px_32px_-22px_rgba(63,47,37,0.22)]"
                      title="Refresh"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(200,182,153,0.28)] bg-charcoal text-ivory shadow-[0_16px_32px_-22px_rgba(63,47,37,0.32)]"
                      title="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExport("excel")}
                    className="inline-flex h-11 items-center justify-center rounded-[16px] border border-[rgba(200,182,153,0.28)] bg-white/86 px-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-charcoal shadow-[0_14px_26px_-20px_rgba(63,47,37,0.18)]"
                  >
                    {exporting === "excel" ? "Preparing..." : "Export Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExport("pdf")}
                    className="inline-flex h-11 items-center justify-center rounded-[16px] bg-charcoal px-4 text-[0.62rem] font-medium uppercase tracking-[0.2em] text-ivory shadow-[0_14px_26px_-20px_rgba(63,47,37,0.24)]"
                  >
                    {exporting === "pdf" ? "Preparing..." : "Export PDF"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[18px] border border-[rgba(200,182,153,0.28)] bg-white/88 px-4 py-4 shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)] sm:flex-row sm:items-end sm:justify-between max-[450px]:hidden">
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
              <div className="mt-4 rounded-[14px] border border-destructive/25 bg-destructive/5 px-4 py-3 text-[12px] text-destructive max-[450px]:mx-4 max-[450px]:rounded-[18px] max-[450px]:bg-white/90">
                {error}
              </div>
            )}

            {notice && (
              <div className="mt-4 rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-700 max-[450px]:mx-4 max-[450px]:rounded-[18px]">
                {notice}
              </div>
            )}

            <div className="mt-4 max-[450px]:mt-0 max-[450px]:px-4 max-[450px]:pb-4">
              <AdminViewErrorBoundary
                key={activeView}
                title="This admin panel section could not be rendered"
              >
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
                    onGenerateGuestCode={handleGenerateGuestCode}
                    generatingGuestId={generatingGuestId}
                  />
                )}

                {activeView === "scanner" && dashboard && (
                  <Suspense
                    fallback={
                      <div className="rounded-[20px] border border-[rgba(200,182,153,0.28)] bg-white/92 px-4 py-8 text-center text-[12px] text-muted-foreground shadow-[0_20px_50px_-36px_rgba(63,47,37,0.16)]">
                        Loading venue scanner...
                      </div>
                    }
                  >
                    <ScannerPage
                      token={token}
                      records={dashboard.records}
                      onRecordUpdated={handleRecordUpdated}
                    />
                  </Suspense>
                )}

                {activeView === "photobooth" && (
                  <PhotoboothPage
                    loading={photoboothLoading}
                    records={photoboothRecords}
                    search={photoboothSearch}
                    eventFilter={photoboothEventFilter}
                    onSearchChange={setPhotoboothSearch}
                    onEventFilterChange={setPhotoboothEventFilter}
                    onSubmitFilters={handleFilterSubmit}
                  />
                )}
              </AdminViewErrorBoundary>
            </div>
          </div>
        </main>
      </div>

      {selectedGuest && (
        <GuestDetailModal record={selectedGuest} onClose={() => setSelectedGuest(null)} />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-[rgba(200,182,153,0.18)] bg-[rgba(255,251,247,0.92)] px-3 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl max-[450px]:block">
        <div className="grid grid-cols-4 gap-2 rounded-[22px] bg-white/72 p-2 shadow-[0_22px_40px_-30px_rgba(63,47,37,0.3)]">
          {navItems.map((item) => {
            const active = activeView === item.view;

            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onViewChange(item.view)}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-center transition-colors ${
                  active
                    ? "bg-charcoal text-ivory shadow-[0_14px_28px_-18px_rgba(36,29,25,0.56)]"
                    : "text-taupe"
                }`}
              >
                {item.icon}
                <span className="text-[0.58rem] font-medium uppercase tracking-[0.18em]">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
