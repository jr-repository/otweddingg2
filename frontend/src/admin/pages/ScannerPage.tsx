import { Suspense, lazy, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCcw, Search, ShieldCheck, XCircle } from "lucide-react";

import { EventToggle } from "@/admin/components/AdminUi";
import type { AdminRecord, EventKey, ScanFeedback } from "@/admin/types";
import {
  buildCheckInFeedback,
  getEventLabel,
  normalizeAdminRecords,
  recordBelongsToEvent,
} from "@/admin/utils";
import { API_BASE_URL } from "@/lib/config";
import type { PhotoboothSavedCapture, PhotoboothSessionGuest } from "@/photobooth/types";
import checkInErrorSoundSrc from "../../../../sound-checkin/error.mp3";
import checkInSuccessSoundSrc from "../../../../sound-checkin/beep.mp3";

const PhotoboothOverlay = lazy(async () =>
  import("@/photobooth/PhotoboothOverlay").then((module) => ({
    default: module.PhotoboothOverlay,
  })),
);

type ScannerInstance = {
  start: (
    cameraConfig: { facingMode: "environment" } | string,
    config: {
      fps: number;
      qrbox: { width: number; height: number };
      disableFlip: boolean;
    },
    onSuccess: (decodedText: string) => void | Promise<void>,
  ) => Promise<unknown>;
  stop: () => Promise<unknown>;
  clear: () => Promise<unknown>;
  pause: (shouldPauseVideo?: boolean) => void;
  resume: () => Promise<unknown>;
};

type CheckInResponse = {
  message?: string;
  record?: AdminRecord;
  previewOnly?: boolean;
};

export function ScannerPage({
  token,
  records,
  onRecordUpdated,
}: {
  token: string;
  records: AdminRecord[];
  onRecordUpdated: (record: AdminRecord) => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState<EventKey>("holy_matrimony");
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [search, setSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [manualPendingId, setManualPendingId] = useState<number | null>(null);
  const [photoboothSession, setPhotoboothSession] = useState<{
    guest: PhotoboothSessionGuest;
    eventKey: EventKey;
    eventLabel: string;
  } | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const scannerMountIdRef = useRef(0);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const busyRef = useRef(false);
  const trimmedSearch = search.trim();
  const selectedEventLabel = getEventLabel(selectedEvent);
  const safeRecords = useMemo(() => normalizeAdminRecords(records), [records]);
  const eventRecords = useMemo(
    () => safeRecords.filter((record) => recordBelongsToEvent(record, selectedEvent)),
    [safeRecords, selectedEvent],
  );
  const searchResults = useMemo(() => {
    const needle = trimmedSearch.toLowerCase();
    if (!needle) return [];

    return eventRecords
      .filter((record) =>
        [record.fullName, record.phone, record.email, record.guestCode]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
      .slice(0, 8);
  }, [eventRecords, trimmedSearch]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setIsMobileDevice(window.innerWidth <= 450);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    const successAudio = new Audio(checkInSuccessSoundSrc);
    successAudio.preload = "auto";
    successAudioRef.current = successAudio;

    const errorAudio = new Audio(checkInErrorSoundSrc);
    errorAudio.preload = "auto";
    errorAudioRef.current = errorAudio;

    return () => {
      successAudio.pause();
      successAudio.currentTime = 0;
      errorAudio.pause();
      errorAudio.currentTime = 0;
      successAudioRef.current = null;
      errorAudioRef.current = null;
    };
  }, []);

  const playAudio = (kind: "success" | "error") => {
    const audio = kind === "success" ? successAudioRef.current : errorAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  const resumeScanner = (delay = 0) => {
    if (typeof window === "undefined") {
      busyRef.current = false;
      return;
    }

    window.setTimeout(() => {
      busyRef.current = false;
      void scannerRef.current?.resume().catch(() => undefined);
    }, delay);
  };

  const pauseScanner = () => {
    scannerRef.current?.pause(true);
  };

  const wait = (delay: number) =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      window.setTimeout(resolve, delay);
    });

  const waitForPaint = () =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      window.requestAnimationFrame(() => resolve());
    });

  const showLoadingFeedback = (title: string, body: string) => {
    setFeedback({
      kind: "loading",
      title,
      body,
    });
  };

  const openPhotoboothSession = useEffectEvent((record: AdminRecord, eventKey: EventKey) => {
    const eventLabel = getEventLabel(eventKey);
    pauseScanner();
    busyRef.current = true;
    setFeedback(null);
    setSearch("");
    setPhotoboothSession({
      guest: {
        id: record.id,
        fullName: record.fullName,
        guestCode: record.guestCode,
      },
      eventKey,
      eventLabel,
    });
  });

  const postCheckIn = async (
    endpoint: "scan" | "manual",
    payload: Record<string, unknown>,
  ): Promise<{ ok: boolean; status: number; data: CheckInResponse }> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/check-in/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as CheckInResponse;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  };

  const handleCheckInFailure = (eventKey: EventKey, message: string) => {
    setFeedback(buildCheckInFeedback(eventKey, "error", message));
    playAudio("error");
    window.setTimeout(() => setFeedback(null), 2200);
    resumeScanner(2200);
  };

  const runCheckInFlow = useEffectEvent(
    async (
      endpoint: "scan" | "manual",
      requestPayload: Record<string, unknown>,
      pendingMessages: {
        initialTitle: string;
        initialBody: string;
        commitTitle: string;
        commitBody: string;
      },
    ) => {
      busyRef.current = true;
      pauseScanner();

      try {
        showLoadingFeedback(pendingMessages.initialTitle, pendingMessages.initialBody);
        const preview = await postCheckIn(endpoint, {
          ...requestPayload,
          previewOnly: true,
        });

        if (!preview.ok || !preview.data.record) {
          throw new Error(preview.data.message ?? "Check-in validation failed.");
        }

        showLoadingFeedback(pendingMessages.commitTitle, pendingMessages.commitBody);
        await waitForPaint();
        await wait(180);

        const commit = await postCheckIn(endpoint, {
          ...requestPayload,
          previewOnly: false,
        });

        if (!commit.ok || !commit.data.record) {
          throw new Error(commit.data.message ?? "Check-in could not be completed.");
        }

        onRecordUpdated(commit.data.record);
        setFeedback(
          buildCheckInFeedback(
            selectedEvent,
            "success",
            commit.data.message ?? `${commit.data.record.fullName} has been checked in.`,
          ),
        );
        playAudio("success");
        await waitForPaint();
        await wait(900);
        openPhotoboothSession(commit.data.record, selectedEvent);
      } catch (caughtError) {
        handleCheckInFailure(
          selectedEvent,
          caughtError instanceof Error ? caughtError.message : "Check-in failed.",
        );
      } finally {
        setManualPendingId(null);
      }
    },
  );

  useEffect(() => {
    let cancelled = false;
    const mountId = scannerMountIdRef.current + 1;
    scannerMountIdRef.current = mountId;

    const startScanner = async () => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }

      if (isMobileDevice) {
        return;
      }

      const target = document.getElementById("wedding-checkin-scanner");
      if (!target || scannerRef.current) return;

      try {
        const module = await import("html5-qrcode");
        if (cancelled || scannerMountIdRef.current !== mountId) {
          return;
        }

        const scanner = new module.Html5Qrcode("wedding-checkin-scanner");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 320, height: 320 }, disableFlip: true },
          async (decodedText) => {
            if (busyRef.current) return;
            await runCheckInFlow(
              "scan",
              {
                scannedValue: decodedText,
                eventKey: selectedEvent,
              },
              {
                initialTitle: "QR detected",
                initialBody: `Validating guest data for ${selectedEventLabel}. No check-in is being saved yet.`,
                commitTitle: "Guest verified",
                commitBody: `Information is visible. Saving ${selectedEventLabel} check-in now...`,
              },
            );
          },
        );

        window.setTimeout(() => {
          const currentTarget = document.getElementById("wedding-checkin-scanner");
          const video = currentTarget?.querySelector("video");
          if (video instanceof HTMLVideoElement) {
            video.style.transform = "scaleX(-1)";
            video.style.webkitTransform = "scaleX(-1)";
          }
        }, 120);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        scannerRef.current = null;
        setFeedback({
          kind: "error",
          title: "Camera unavailable",
          body:
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to start the venue scanner camera.",
        });
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        void scanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            void scanner.clear().catch(() => undefined);
          });
      }
    };
  }, [
    isMobileDevice,
    selectedEvent,
    token,
    onRecordUpdated,
    openPhotoboothSession,
    runCheckInFlow,
    selectedEventLabel,
  ]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const showHelp = () => {
      setFeedback({
        kind: "loading",
        title: "Scanner tips",
        body: "Center the QR code inside the frame and keep lighting stable for the fastest scan.",
      });
      window.setTimeout(() => {
        setFeedback((current) => (current?.title === "Scanner tips" ? null : current));
      }, 1600);
    };

    window.addEventListener("admin-mobile-scanner-help", showHelp);
    return () => window.removeEventListener("admin-mobile-scanner-help", showHelp);
  }, []);

  const openFullscreen = async () => {
    if (typeof document === "undefined") {
      return;
    }

    const target = document.getElementById("scanner-fullscreen-shell");
    if (!target?.requestFullscreen) return;
    await target.requestFullscreen().catch(() => undefined);
  };

  const handleManualCheckIn = async (record: AdminRecord) => {
    if (busyRef.current) {
      return;
    }

    setManualPendingId(record.id);
    await runCheckInFlow(
      "manual",
      {
        id: record.id,
        eventKey: selectedEvent,
      },
      {
        initialTitle: "Validating guest",
        initialBody: `${record.fullName} is being checked for ${selectedEventLabel}. No check-in is being saved yet.`,
        commitTitle: "Guest verified",
        commitBody: `Information is visible. Saving ${selectedEventLabel} check-in now...`,
      },
    );
  };

  return (
    <section
      id="scanner-fullscreen-shell"
      className="rounded-[20px] border border-[rgba(200,182,153,0.3)] bg-[linear-gradient(180deg,#171311_0%,#251d18_100%)] p-3 text-ivory shadow-[0_20px_50px_-36px_rgba(63,47,37,0.2)] sm:p-4 max-[450px]:rounded-none max-[450px]:border-0 max-[450px]:bg-transparent max-[450px]:p-0 max-[450px]:shadow-none"
    >
      <div className="hidden max-[450px]:block">
        <div className="wa-admin-mobile-card mb-3 px-4 py-4 text-charcoal">
          <p className="text-[8px] font-bold uppercase tracking-[0.26em] text-[#8f8379]">
            Venue scanner
          </p>
          <h2 className="wa-admin-mobile-title mt-2 text-[22px] leading-[1.04]">
            Scanner available on larger screens
          </h2>
          <p className="mt-2 text-[10px] leading-[1.55] text-[#8f8379]">
            The live QR scanner is available on tablet and desktop devices. Please open this page on
            a larger screen to run venue check-in.
          </p>
        </div>
      </div>

      {isMobileDevice ? null : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between max-[450px]:hidden">
            <div>
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-ivory/62">
                Venue Check-In
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-ivory sm:text-3xl">
                Full-screen QR scanner for guest self check-in
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void openFullscreen()}
              className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-white/10 max-[450px]:h-11 max-[450px]:w-full max-[450px]:justify-center max-[450px]:rounded-[16px]"
            >
              <Camera className="h-3.5 w-3.5" />
              {isFullscreen ? "Scanner Open" : "Open Full Screen"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[3fr_1fr] max-[450px]:mt-0">
            <div className="rounded-[18px] border border-white/10 bg-white/5 p-3 max-[450px]:rounded-[24px] max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-[linear-gradient(180deg,#231b17_0%,#312620_100%)]">
              <div className="flex flex-wrap gap-2.5">
                <EventToggle
                  active={selectedEvent === "holy_matrimony"}
                  label="Holy Matrimony"
                  onClick={() => setSelectedEvent("holy_matrimony")}
                />
                <EventToggle
                  active={selectedEvent === "syukuran"}
                  label="Lunch Celebration"
                  onClick={() => setSelectedEvent("syukuran")}
                />
              </div>

              <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-black/35">
                <div className="relative">
                  <div
                    id="wedding-checkin-scanner"
                    className="aspect-[4/3] min-h-[360px] w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover xl:min-h-[600px] max-[450px]:min-h-[280px]"
                  />
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
                    <div className="rounded-full border border-white/10 bg-[rgba(14,10,8,0.64)] px-4 py-2 text-[0.62rem] uppercase tracking-[0.22em] text-ivory/82 shadow-lg backdrop-blur-sm">
                      {feedback?.kind === "loading"
                        ? "Processing check-in..."
                        : `Align ${selectedEventLabel} QR inside the frame`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-white/10 bg-white/6 px-3 py-3 text-[12px] text-ivory/82 max-[450px]:hidden">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-champagne" />
                <p>
                  Each QR is accepted once per selected event. After check-in succeeds, a photobooth
                  session starts automatically and the scanner returns after the session ends.
                </p>
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-white/6 p-4 max-[450px]:rounded-[24px] max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-white/86 max-[450px]:text-charcoal">
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-ivory/62 max-[450px]:text-[#8f8379]">
                Forgot QR?
              </p>
              <h4 className="mt-2 font-serif text-xl text-ivory max-[450px]:text-charcoal">
                Find guest by name or WhatsApp
              </h4>
              <p className="mt-2 text-[12px] leading-relaxed text-ivory/66 max-[450px]:text-[#8f8379]">
                Search first to show matching guests registered for {selectedEventLabel}.
              </p>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ivory/52 max-[450px]:text-[#9a8d83]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search guest name, phone, email, guest code"
                  className="block h-10 w-full rounded-[12px] border border-white/10 bg-white/8 px-10 text-[12px] text-ivory outline-none placeholder:text-ivory/42 focus:border-champagne/60 max-[450px]:h-11 max-[450px]:rounded-[16px] max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-white max-[450px]:text-charcoal max-[450px]:placeholder:text-[#aa9d93]"
                />
              </div>

              <div className="mt-4 space-y-2.5 max-[450px]:max-h-[40dvh] max-[450px]:overflow-y-auto max-[450px]:pr-1">
                {!trimmedSearch && (
                  <div className="rounded-[14px] border border-dashed border-white/10 bg-black/10 px-3 py-4 text-[12px] leading-relaxed text-ivory/58 max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-[#f7f1ea] max-[450px]:text-[#8f8379]">
                    No guest list is shown by default. Type a guest name, WhatsApp number, email, or
                    guest code to find RSVP records for {selectedEventLabel}.
                  </div>
                )}

                {trimmedSearch && searchResults.length === 0 && (
                  <div className="rounded-[14px] border border-dashed border-white/10 bg-black/10 px-3 py-4 text-[12px] leading-relaxed text-ivory/58 max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-[#f7f1ea] max-[450px]:text-[#8f8379]">
                    No matching guest was found for {selectedEventLabel}.
                  </div>
                )}

                {trimmedSearch &&
                  searchResults.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-[14px] border border-white/10 bg-black/10 px-3 py-3 max-[450px]:rounded-[18px] max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-[#fdfaf6]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[12px] font-medium text-ivory max-[450px]:text-charcoal">
                            {record.fullName}
                          </p>
                          <p className="mt-1 text-[11px] text-ivory/64 max-[450px]:text-[#8f8379]">
                            {record.guestCode}
                          </p>
                          <p className="mt-1.5 text-[11px] text-ivory/64 max-[450px]:text-[#8f8379]">
                            {selectedEventLabel} · {record.attendingLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleManualCheckIn(record)}
                          disabled={busyRef.current || manualPendingId === record.id}
                          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45 max-[450px]:border-[rgba(92,72,57,0.12)] max-[450px]:bg-[#f4eadb] max-[450px]:text-charcoal"
                        >
                          {manualPendingId === record.id ? (
                            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {manualPendingId === record.id ? "Checking..." : "Check In"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      )}

      {feedback && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-charcoal/28 px-4">
          <div
            className={`w-full max-w-sm rounded-[18px] border px-5 py-5 text-center shadow-2xl max-[450px]:rounded-[24px] max-[450px]:px-4 ${
              feedback.kind === "success"
                ? "border-emerald-200 bg-white text-charcoal"
                : feedback.kind === "loading"
                  ? "border-champagne/30 bg-white text-charcoal"
                  : "border-destructive/20 bg-white text-charcoal"
            }`}
          >
            <div className="flex justify-center">
              {feedback.kind === "success" ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              ) : feedback.kind === "loading" ? (
                <RefreshCcw className="h-10 w-10 animate-spin text-champagne" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h5 className="mt-3 font-serif text-2xl text-charcoal">{feedback.title}</h5>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              {feedback.body}
            </p>
          </div>
        </div>
      )}

      {photoboothSession && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(14,10,8,0.92)] px-4 text-center text-ivory">
              <div className="rounded-[24px] border border-white/10 bg-white/8 px-6 py-5 text-[12px] uppercase tracking-[0.24em] text-ivory/78">
                Loading photobooth...
              </div>
            </div>
          }
        >
          <PhotoboothOverlay
            token={token}
            guest={photoboothSession.guest}
            eventKey={photoboothSession.eventKey}
            eventLabel={photoboothSession.eventLabel}
            onClose={() => {
              setPhotoboothSession(null);
              setFeedback(null);
              resumeScanner(250);
            }}
            onSaved={(capture: PhotoboothSavedCapture) => {
              setPhotoboothSession(null);
              setFeedback({
                kind: "success",
                title: "Photobooth saved",
                body: `${capture.guestName} is finished. Scanner is ready for the next guest.`,
              });
              playAudio("success");
              resumeScanner(300);
              window.setTimeout(() => setFeedback(null), 1800);
            }}
          />
        </Suspense>
      )}
    </section>
  );
}
