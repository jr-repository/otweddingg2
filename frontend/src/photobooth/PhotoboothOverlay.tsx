import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, RefreshCcw, Wand2, X } from "lucide-react";

import { API_BASE_URL } from "@/lib/config";
import { PHOTO_EFFECTS } from "@/photobooth/config/effects";
import { PHOTO_FILTERS } from "@/photobooth/config/filters";
import { PHOTO_FRAMES } from "@/photobooth/config/frames";
import { useFaceLandmarker } from "@/photobooth/hooks/useFaceLandmarker";
import { usePhotoboothCamera } from "@/photobooth/hooks/usePhotoboothCamera";
import {
  capturePhotoboothShot,
  composePhotoboothStrip,
  drawProcessedFrame,
  getFramePreviewStyle,
} from "@/photobooth/lib/compositor";
import type {
  NormalizedPoint,
  PhotoboothEffectId,
  PhotoboothFilterId,
  PhotoboothFrameId,
  PhotoboothLayoutCount,
  PhotoboothPanel,
  PhotoboothSavedCapture,
  PhotoboothSessionGuest,
} from "@/photobooth/types";

const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 1125;
const WEDDING_LABEL = "Luis Meraz & Angel Mayjesty";

type OverlayProps = {
  token: string;
  guest: PhotoboothSessionGuest;
  eventKey: "holy_matrimony" | "syukuran";
  eventLabel: string;
  onClose: () => void;
  onSaved: (capture: PhotoboothSavedCapture) => void;
};

export function PhotoboothOverlay({
  token,
  guest,
  eventKey,
  eventLabel,
  onClose,
  onSaved,
}: OverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderStateRef = useRef<{
    filterId: PhotoboothFilterId;
    effectId: PhotoboothEffectId;
    frameId: PhotoboothFrameId;
    beautyLevel: number;
    landmarks: NormalizedPoint[] | null;
  }>({
    filterId: "original",
    effectId: "none",
    frameId: "polaroid",
    beautyLevel: 32,
    landmarks: null,
  });

  const [activePanel, setActivePanel] = useState<PhotoboothPanel>("filter");
  const [filterId, setFilterId] = useState<PhotoboothFilterId>("original");
  const [effectId, setEffectId] = useState<PhotoboothEffectId>("none");
  const [frameId, setFrameId] = useState<PhotoboothFrameId>("polaroid");
  const [beautyLevel, setBeautyLevel] = useState(32);
  const [layoutCount, setLayoutCount] = useState<PhotoboothLayoutCount>(3);
  const [landmarks, setLandmarks] = useState<NormalizedPoint[] | null>(null);
  const [trackerStatus, setTrackerStatus] = useState({ loading: false, error: "" });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [finalImageDataUrl, setFinalImageDataUrl] = useState<string | null>(null);

  const { devices, selectedDeviceId, setSelectedDeviceId, loading, error, isReady } =
    usePhotoboothCamera(videoRef, true);

  useFaceLandmarker({
    video: videoRef.current,
    enabled: isReady,
    onLandmarks: setLandmarks,
    onStatusChange: setTrackerStatus,
  });

  useEffect(() => {
    renderStateRef.current = {
      filterId,
      effectId,
      frameId,
      beautyLevel,
      landmarks,
    };
  }, [beautyLevel, effectId, filterId, frameId, landmarks]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isReady) {
      return;
    }

    canvas.width = PREVIEW_WIDTH;
    canvas.height = PREVIEW_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let frame = 0;
    const render = () => {
      const currentVideo = videoRef.current;
      if (currentVideo?.readyState && currentVideo.readyState >= 2) {
        const current = renderStateRef.current;
        drawProcessedFrame(ctx, {
          video: currentVideo,
          width: PREVIEW_WIDTH,
          height: PREVIEW_HEIGHT,
          filterId: current.filterId,
          effectId: current.effectId,
          frameId: current.frameId,
          beautyLevel: current.beautyLevel,
          landmarks: current.landmarks,
          timestamp: performance.now(),
        });
      } else {
        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
      }

      frame = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isReady]);

  useEffect(() => {
    if (shots.length === 0) {
      setFinalImageDataUrl(null);
      return;
    }

    if (shots.length !== layoutCount) {
      return;
    }

    let cancelled = false;

    const compose = async () => {
      try {
        const result = await composePhotoboothStrip({
          shots,
          layoutCount,
          frameId,
          guestLabel: guest.fullName,
          weddingLabel: WEDDING_LABEL,
          eventLabel,
        });

        if (!cancelled) {
          setFinalImageDataUrl(result);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setLocalError(
            caughtError instanceof Error
              ? caughtError.message
              : "Final photobooth result could not be prepared.",
          );
        }
      }
    };

    void compose();

    return () => {
      cancelled = true;
    };
  }, [eventLabel, frameId, guest.fullName, layoutCount, shots]);

  useEffect(() => {
    if (countdown === null) {
      return;
    }

    if (countdown > 0) {
      const timer = window.setTimeout(() => {
        setCountdown((current) => (typeof current === "number" ? current - 1 : null));
      }, 1000);

      return () => {
        window.clearTimeout(timer);
      };
    }

    let cancelled = false;

    const capture = async () => {
      const video = videoRef.current;
      if (!video) {
        setLocalError("Photobooth camera is not ready.");
        setCountdown(null);
        return;
      }

      try {
        setIsCapturing(true);
        setLocalError("");

        const shot = await capturePhotoboothShot({
          video,
          filterId,
          effectId,
          frameId,
          beautyLevel,
          landmarks,
          timestamp: performance.now(),
        });

        if (!cancelled) {
          setShots((current) => [...current, shot].slice(0, layoutCount));
        }
      } catch (caughtError) {
        if (!cancelled) {
          setLocalError(
            caughtError instanceof Error ? caughtError.message : "Shot capture failed.",
          );
        }
      } finally {
        if (!cancelled) {
          setCountdown(null);
          setIsCapturing(false);
        }
      }
    };

    void capture();

    return () => {
      cancelled = true;
    };
  }, [beautyLevel, countdown, effectId, filterId, frameId, landmarks, layoutCount]);

  const hasResult = finalImageDataUrl !== null && shots.length === layoutCount;
  const isBusy = loading || isCapturing || isSaving;
  const shotProgress = Math.min(shots.length + (isCapturing ? 1 : 0), layoutCount);
  const previewFrameStyle = getFramePreviewStyle(frameId);
  const selectedPanelItems = useMemo(() => {
    if (activePanel === "filter") {
      return PHOTO_FILTERS.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.id === filterId,
        badge: (
          <span
            className="h-7 w-7 rounded-full border border-black/6"
            style={{ background: item.swatch }}
          />
        ),
        onClick: () => setFilterId(item.id),
        caption: "Live tone",
      }));
    }

    if (activePanel === "effect") {
      return PHOTO_EFFECTS.map((item) => ({
        id: item.id,
        name: item.name,
        active: item.id === effectId,
        badge: <span className="text-lg leading-none">{item.emoji}</span>,
        onClick: () => setEffectId(item.id),
        caption: item.description,
      }));
    }

    return PHOTO_FRAMES.map((item) => ({
      id: item.id,
      name: item.name,
      active: item.id === frameId,
      badge: (
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[9px] border"
          style={{
            background: item.backgroundColor,
            borderColor: item.borderColor,
            color: item.accentColor,
          }}
        >
          ▣
        </span>
      ),
      onClick: () => setFrameId(item.id),
      caption: "Frame",
    }));
  }, [activePanel, effectId, filterId, frameId]);

  const startCountdown = () => {
    if (!isReady || isBusy || shots.length >= layoutCount || hasResult) {
      return;
    }

    setLocalError("");
    setCountdown(3);
  };

  const handleResetSession = () => {
    setCountdown(null);
    setShots([]);
    setFinalImageDataUrl(null);
    setLocalError("");
  };

  const handleDownload = () => {
    if (!finalImageDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = finalImageDataUrl;
    link.download = `photobooth-${guest.guestCode}.jpg`;
    link.click();
  };

  const handleSave = async () => {
    if (!finalImageDataUrl || shots.length === 0 || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setLocalError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/photobooth/captures`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guestId: guest.id,
          eventKey,
          filterId,
          effectId,
          frameId,
          beautyLevel,
          layoutMode: `strip-${layoutCount}`,
          weddingLabel: WEDDING_LABEL,
          guestLabel: guest.fullName,
          shots: shots.map((dataUrl, index) => ({
            index: index + 1,
            dataUrl,
          })),
          finalImageDataUrl,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        capture?: PhotoboothSavedCapture;
      };

      if (!response.ok || !data.capture) {
        throw new Error(data.message ?? "Photobooth result could not be saved.");
      }

      onSaved(data.capture);
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Photobooth result could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] h-[100dvh] overflow-hidden bg-[rgba(14,10,8,0.94)] p-2.5 text-ivory backdrop-blur-sm sm:p-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-2.5 overflow-hidden rounded-[28px] border border-[rgba(243,232,212,0.16)] bg-[linear-gradient(180deg,rgba(32,24,20,0.98),rgba(20,15,12,0.98))] p-3 shadow-[0_30px_100px_-42px_rgba(0,0,0,0.85)] sm:p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 pb-2.5">
          <div>
            <p className="text-[0.58rem] uppercase tracking-[0.28em] text-ivory/58">
              Photobooth Session
            </p>
            <h3 className="mt-1 font-serif text-[1.8rem] leading-none text-ivory sm:text-[2rem]">
              {guest.fullName}
            </h3>
            <p className="mt-1 text-[11px] text-ivory/62">
              {guest.guestCode} · {eventLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ivory transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
            Close Session
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)] xl:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.86fr)]">
          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5 rounded-[24px] border border-white/8 bg-black/18 p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ivory/54">
                  Live Preview
                </p>
                <p className="mt-1 text-[11px] text-ivory/58">
                  Klik tombol shutter di frame untuk mulai timer 3 detik.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-ivory/66">
                Shot {shotProgress} / {layoutCount}
              </div>
            </div>

            <div className="min-h-0 rounded-[22px] border border-white/10 bg-[#110d0b] p-2">
              <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black px-2.5 pb-16 pt-2.5">
                <video ref={videoRef} playsInline muted className="hidden" />
                <canvas
                  ref={previewCanvasRef}
                  className="block h-full max-h-full w-auto max-w-full rounded-[22px] bg-[#0f0b09]"
                />

                <div
                  className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-3 rounded-full border px-3 py-1.5 text-[10px]"
                  style={{
                    borderColor: `${previewFrameStyle.accentColor}66`,
                    background: "rgba(11,8,7,0.54)",
                    color: previewFrameStyle.footerText,
                  }}
                >
                  <span className="truncate">{guest.fullName}</span>
                  <span>{eventLabel}</span>
                </div>

                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetSession}
                    disabled={shots.length === 0 && !finalImageDataUrl}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-[rgba(11,8,7,0.72)] px-3.5 text-[0.58rem] font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Retake
                  </button>

                  <button
                    type="button"
                    onClick={startCountdown}
                    disabled={!isReady || isBusy || shots.length >= layoutCount || hasResult}
                    className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/18 bg-[rgba(11,8,7,0.74)] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.75)] transition hover:scale-[1.02] hover:bg-[rgba(26,18,14,0.88)] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label={
                      shots.length === 0 ? "Start timer and take photo" : "Take next photo"
                    }
                  >
                    <span className="absolute inset-2 rounded-full border border-white/18 bg-[#f7f1e8]" />
                    <span className="absolute inset-[15px] rounded-full bg-charcoal" />
                  </button>

                  <div className="rounded-full border border-white/10 bg-[rgba(11,8,7,0.72)] px-3.5 py-2.5 text-[0.54rem] uppercase tracking-[0.2em] text-ivory/72">
                    {hasResult
                      ? "Ready to save"
                      : shots.length === 0
                        ? "Session ready"
                        : "Next shot"}
                  </div>
                </div>

                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/28">
                    <div className="rounded-full border border-white/16 bg-black/34 px-8 py-5 font-serif text-6xl text-white shadow-2xl">
                      {countdown === 0 ? "Now" : countdown}
                    </div>
                  </div>
                )}

                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#120f0d]/90 px-6">
                    <div className="text-center">
                      <Camera className="mx-auto h-8 w-8 text-champagne" />
                      <p className="mt-3 text-sm text-ivory/74">
                        {loading ? "Preparing camera..." : "Waiting for camera access"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: layoutCount }).map((_, index) => {
                const shot = shots[index];

                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-[14px] border border-white/10 bg-black/28"
                  >
                    <div className="aspect-[4/5] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]">
                      {shot ? (
                        <img
                          src={shot}
                          alt={`Photobooth shot ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ivory/30">
                          Shot {index + 1}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-2.5 overflow-hidden">
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["filter", "Filter"],
                    ["effect", "Effect"],
                    ["frame", "Frame"],
                    ["beauty", "Beauty"],
                  ] as const
                ).map(([panelKey, label]) => (
                  <button
                    key={panelKey}
                    type="button"
                    onClick={() => setActivePanel(panelKey)}
                    className={`rounded-full px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] transition ${
                      activePanel === panelKey
                        ? "bg-champagne text-charcoal"
                        : "border border-white/10 bg-white/6 text-ivory/74 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activePanel === "beauty" ? (
                <div className="mt-3 rounded-[18px] border border-white/10 bg-black/18 p-3.5">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ivory/54">
                          Beauty Filter
                        </p>
                        <p className="mt-1 text-[12px] text-ivory/58">
                          Smoothing halus tanpa merusak detail.
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-ivory/74">
                        {beautyLevel}%
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={beautyLevel}
                      onChange={(event) => setBeautyLevel(Number(event.target.value))}
                      className="mt-3 h-2 w-full cursor-pointer accent-champagne"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid max-h-[18dvh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                  {selectedPanelItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className={`rounded-[18px] border px-3 py-2.5 text-left transition ${
                        item.active
                          ? "border-champagne bg-[#f3e8d4] text-charcoal"
                          : "border-white/10 bg-black/18 text-ivory/76 hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {item.badge}
                        {item.active && <Check className="h-4 w-4" />}
                      </div>
                      <p className="mt-3 text-[12px] font-medium">{item.name}</p>
                      <p
                        className={`mt-1 text-[10px] ${item.active ? "text-charcoal/72" : "text-ivory/42"}`}
                      >
                        {item.caption}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ivory/54">Layout</p>
                  <p className="mt-1 text-[12px] text-ivory/58">Pilih jumlah foto per sesi.</p>
                </div>
                <Wand2 className="h-4 w-4 text-champagne" />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {([1, 2, 3, 4] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    disabled={shots.length > 0 || !!finalImageDataUrl}
                    onClick={() => setLayoutCount(count)}
                    className={`rounded-[16px] border px-3 py-2 text-center text-[0.62rem] font-medium uppercase tracking-[0.22em] transition ${
                      layoutCount === count
                        ? "border-champagne bg-champagne text-charcoal"
                        : "border-white/10 bg-black/18 text-ivory/74 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
                    }`}
                  >
                    {count} Shot
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2.5 sm:grid-cols-[1fr_auto]">
                <div className="rounded-[16px] border border-white/10 bg-black/18 px-3 py-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ivory/54">
                    Camera Source
                  </p>
                  <select
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                    className="mt-2 h-10 w-full rounded-[12px] border border-white/10 bg-white/8 px-3 text-[12px] text-ivory outline-none"
                  >
                    {devices.length === 0 && <option value="">Auto Camera</option>}
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[16px] border border-white/10 bg-black/18 px-3 py-3 text-[11px] text-ivory/60 sm:min-w-[118px]">
                  <p>{trackerStatus.loading ? "AR loading..." : "AR ready"}</p>
                  <p className="mt-1">{trackerStatus.error || error || "Camera active"}</p>
                </div>
              </div>
            </div>

            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto_auto] gap-2.5 rounded-[24px] border border-white/8 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.24em] text-ivory/54">
                    Final Result
                  </p>
                  <p className="mt-1 text-[12px] text-ivory/58">
                    Download dulu atau langsung save ke sistem.
                  </p>
                </div>
                <Download className="h-4 w-4 text-champagne" />
              </div>

              <div className="min-h-0 overflow-hidden rounded-[18px] border border-white/10 bg-black/22">
                {finalImageDataUrl ? (
                  <img
                    src={finalImageDataUrl}
                    alt={`Final photobooth result for ${guest.fullName}`}
                    className="h-full max-h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full min-h-[120px] items-center justify-center px-6 text-center text-[12px] leading-relaxed text-ivory/40">
                    Final polaroid akan muncul otomatis setelah semua shot selesai.
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!finalImageDataUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>

                <button
                  type="button"
                  onClick={handleResetSession}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-ivory transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retake
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!hasResult || isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-champagne px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.22em] text-charcoal transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Check className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save & Continue"}
                </button>
              </div>

              {localError && (
                <div className="rounded-[16px] border border-destructive/25 bg-destructive/10 px-3 py-3 text-[12px] text-[#ffd1d1]">
                  {localError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
