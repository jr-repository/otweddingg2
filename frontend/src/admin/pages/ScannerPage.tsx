import { Suspense, lazy, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCcw, Search, ShieldCheck, XCircle } from "lucide-react";

import { EventToggle } from "@/admin/components/AdminUi";
import type { AdminRecord, EventKey, ScanFeedback } from "@/admin/types";
import { buildCheckInFeedback, getEventLabel, recordBelongsToEvent } from "@/admin/utils";
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
  const [manualPendingId, setManualPendingId] = useState<number | null>(null);
  const [photoboothSession, setPhotoboothSession] = useState<{
    guest: PhotoboothSessionGuest;
    eventKey: EventKey;
    eventLabel: string;
  } | null>(null);
  const scannerRef = useRef<ScannerInstance | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const busyRef = useRef(false);
  const trimmedSearch = search.trim();
  const selectedEventLabel = getEventLabel(selectedEvent);
  const eventRecords = useMemo(
    () => records.filter((record) => recordBelongsToEvent(record, selectedEvent)),
    [records, selectedEvent],
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
      window.setTimeout(resolve, delay);
    });

  const waitForPaint = () =>
    new Promise<void>((resolve) => {
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
    const startScanner = async () => {
      const target = document.getElementById("wedding-checkin-scanner");
      if (!target || scannerRef.current) return;

      const module = await import("html5-qrcode");
      const scanner = new module.Html5Qrcode("wedding-checkin-scanner");
      scannerRef.current = scanner;

      try {
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
          const video = target.querySelector("video");
          if (video instanceof HTMLVideoElement) {
            video.style.transform = "scaleX(-1)";
            video.style.webkitTransform = "scaleX(-1)";
          }
        }, 120);
      } catch (caughtError) {
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
    selectedEvent,
    token,
    onRecordUpdated,
    openPhotoboothSession,
    runCheckInFlow,
    selectedEventLabel,
  ]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const openFullscreen = async () => {
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
      className="rounded-[20px] border border-[rgba(200,182,153,0.3)] bg-[linear-gradient(180deg,#171311_0%,#251d18_100%)] p-3 text-ivory shadow-[0_20px_50px_-36px_rgba(63,47,37,0.2)] sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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
          className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-white/10"
        >
          <Camera className="h-3.5 w-3.5" />
          {isFullscreen ? "Scanner Open" : "Open Full Screen"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[3fr_1fr]">
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
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
                className="aspect-[4/3] min-h-[360px] w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover xl:min-h-[600px]"
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

          <div className="mt-3 flex items-start gap-2 rounded-[14px] border border-white/10 bg-white/6 px-3 py-3 text-[12px] text-ivory/82">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-champagne" />
            <p>
              Each QR is accepted once per selected event. After check-in succeeds, a photobooth
              session starts automatically and the scanner returns after the session ends.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/6 p-4">
          <p className="text-[0.58rem] font-medium uppercase tracking-[0.28em] text-ivory/62">
            Forgot QR?
          </p>
          <h4 className="mt-2 font-serif text-xl text-ivory">Find guest by name or WhatsApp</h4>
          <p className="mt-2 text-[12px] leading-relaxed text-ivory/66">
            Search first to show matching guests registered for {selectedEventLabel}.
          </p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ivory/52" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search guest name, phone, email, guest code"
              className="block h-10 w-full rounded-[12px] border border-white/10 bg-white/8 px-10 text-[12px] text-ivory outline-none placeholder:text-ivory/42 focus:border-champagne/60"
            />
          </div>

          <div className="mt-4 space-y-2.5">
            {!trimmedSearch && (
              <div className="rounded-[14px] border border-dashed border-white/10 bg-black/10 px-3 py-4 text-[12px] leading-relaxed text-ivory/58">
                No guest list is shown by default. Type a guest name, WhatsApp number, email, or
                guest code to find RSVP records for {selectedEventLabel}.
              </div>
            )}

            {trimmedSearch && searchResults.length === 0 && (
              <div className="rounded-[14px] border border-dashed border-white/10 bg-black/10 px-3 py-4 text-[12px] leading-relaxed text-ivory/58">
                No matching guest was found for {selectedEventLabel}.
              </div>
            )}

            {trimmedSearch &&
              searchResults.map((record) => (
                <div
                  key={record.id}
                  className="rounded-[14px] border border-white/10 bg-black/10 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-medium text-ivory">{record.fullName}</p>
                      <p className="mt-1 text-[11px] text-ivory/64">{record.guestCode}</p>
                      <p className="mt-1.5 text-[11px] text-ivory/64">
                        {selectedEventLabel} · {record.attendingLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleManualCheckIn(record)}
                      disabled={busyRef.current || manualPendingId === record.id}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[0.58rem] font-medium uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45"
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

      {feedback && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-charcoal/28 px-4">
          <div
            className={`w-full max-w-sm rounded-[18px] border px-5 py-5 text-center shadow-2xl ${
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
