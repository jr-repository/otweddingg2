import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ExternalLink, MapPin, Ticket } from "lucide-react";

import { API_BASE_URL } from "@/lib/config";

type GuestPassPayload = {
  guestCode: string;
  fullName: string;
  firstName: string;
  attending: "yes" | "no";
  attendingLabel: string;
  guestsLabel: string;
  events: string[];
  eventsLabel: string;
  dateLabel: string;
  locationLabel: string;
  passUrl: string;
  qrPayload: string;
  qrCodeDataUrl: string;
};

export function GuestPassPage({ guestCode }: { guestCode: string }) {
  const [payload, setPayload] = useState<GuestPassPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/guest-pass/${encodeURIComponent(guestCode)}?token=${encodeURIComponent(token)}`,
        );
        const data = (await response.json().catch(() => ({}))) as GuestPassPayload & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "Guest pass not found.");
        }

        if (!cancelled) {
          setPayload(data);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Guest pass not found.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (guestCode && token) {
      void load();
    } else {
      setLoading(false);
      setError("Guest pass link is incomplete.");
    }

    return () => {
      cancelled = true;
    };
  }, [guestCode, token]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9f4ed_0%,#fdfbf8_100%)] px-4 py-8 text-charcoal sm:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[30px] border border-[rgba(200,182,153,0.5)] bg-white shadow-[0_28px_80px_-36px_rgba(63,47,37,0.28)]">
          <div className="border-b border-[rgba(200,182,153,0.32)] bg-[linear-gradient(135deg,rgba(35,28,24,0.96),rgba(110,82,55,0.78))] px-6 py-12 text-center text-ivory sm:px-10">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.38em] text-ivory/72">
              Guest Pass
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-none sm:text-5xl">
              Luis Meraz <span className="italic text-champagne">&amp;</span> Angel Mayjesty
            </h1>
            <p className="mt-4 text-sm uppercase tracking-[0.34em] text-ivory/78">
              Save this QR for venue check-in
            </p>
          </div>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            {loading && <p className="text-sm text-muted-foreground">Loading guest pass…</p>}
            {error && !loading && (
              <div className="rounded-[18px] border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && payload && (
              <div className="space-y-8">
                <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div>
                    <p className="text-[0.68rem] font-medium uppercase tracking-[0.34em] text-taupe">
                      Registered Guest
                    </p>
                    <h2 className="mt-3 font-serif text-4xl leading-tight text-charcoal">
                      {payload.fullName}
                    </h2>
                    <p className="mt-3 text-sm uppercase tracking-[0.25em] text-taupe">
                      Guest Code {payload.guestCode}
                    </p>

                    <div className="mt-6 space-y-4">
                      <InfoRow
                        icon={<Ticket className="h-4 w-4" />}
                        label="Attendance"
                        value={payload.attendingLabel}
                      />
                      <InfoRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Date"
                        value={payload.dateLabel}
                      />
                      <InfoRow
                        icon={<MapPin className="h-4 w-4" />}
                        label="Location"
                        value={payload.locationLabel}
                      />
                    </div>

                    <div className="mt-8 rounded-[18px] border border-[rgba(200,182,153,0.36)] bg-cream/45 p-5">
                      <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-taupe">
                        RSVP Details
                      </p>
                      <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
                        <p>Guests: {payload.guestsLabel}</p>
                        <p>Selected event(s): {payload.eventsLabel}</p>
                        <p>Please present this QR code during venue check-in.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[rgba(200,182,153,0.36)] bg-[linear-gradient(180deg,#fffdfa_0%,#f7f0e6_100%)] p-5 text-center shadow-[0_18px_48px_-34px_rgba(63,47,37,0.28)]">
                    <img
                      src={payload.qrCodeDataUrl}
                      alt={`QR code for ${payload.fullName}`}
                      className="mx-auto w-full max-w-[280px] rounded-[18px] border border-[rgba(200,182,153,0.25)] bg-white p-3"
                    />
                    <p className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-taupe">
                      Self Check-In QR
                    </p>
                    <a
                      href={payload.passUrl}
                      className="mt-5 inline-flex items-center gap-2 text-sm text-charcoal transition-colors hover:text-champagne"
                    >
                      Open this guest pass link
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[16px] border border-[rgba(200,182,153,0.28)] bg-white px-4 py-3">
      <span className="mt-0.5 text-champagne">{icon}</span>
      <div>
        <p className="text-[0.63rem] font-medium uppercase tracking-[0.24em] text-taupe">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal">{value}</p>
      </div>
    </div>
  );
}
