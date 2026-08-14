import { getPhotoFilter } from "@/photobooth/config/filters";
import { getPhotoFrame } from "@/photobooth/config/frames";
import { clamp, drawContainImageFrame, drawCoverVideoFrame } from "@/photobooth/lib/geometry";
import { renderPhotoEffect } from "@/photobooth/lib/effectRenderer";
import type {
  NormalizedPoint,
  PhotoboothEffectId,
  PhotoboothFilterId,
  PhotoboothFrameId,
  PhotoboothLayoutCount,
} from "@/photobooth/types";

const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 1125;

export function getLivePreviewFilter(filterId: PhotoboothFilterId, beautyLevel: number) {
  const filter = getPhotoFilter(filterId);
  const beautyBrightness = 1 + beautyLevel * 0.0012;
  const beautySaturation = 1 + beautyLevel * 0.0015;
  const beautyContrast = 1 - beautyLevel * 0.00025;

  return [
    filter.cssFilter !== "none" ? filter.cssFilter : "",
    `brightness(${beautyBrightness.toFixed(3)})`,
    `saturate(${beautySaturation.toFixed(3)})`,
    `contrast(${beautyContrast.toFixed(3)})`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function capturePhotoboothShot(params: {
  video: HTMLVideoElement;
  filterId: PhotoboothFilterId;
  effectId: PhotoboothEffectId;
  frameId: PhotoboothFrameId;
  beautyLevel: number;
  landmarks: NormalizedPoint[] | null;
  timestamp?: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = PREVIEW_WIDTH;
  canvas.height = PREVIEW_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create photobooth capture canvas.");
  }

  drawProcessedFrame(ctx, {
    video: params.video,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    filterId: params.filterId,
    effectId: params.effectId,
    frameId: params.frameId,
    beautyLevel: params.beautyLevel,
    landmarks: params.landmarks,
    timestamp: params.timestamp,
    includeFrame: false,
  });

  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function composePhotoboothStrip(params: {
  shots: string[];
  layoutCount: PhotoboothLayoutCount;
  frameId: PhotoboothFrameId;
  guestLabel: string;
  weddingLabel: string;
  eventLabel: string;
}) {
  const loaded = await Promise.all(params.shots.map(loadImage));
  const width = params.layoutCount <= 2 ? 820 : 640;
  const footerHeight = 210;
  const outerPadding = 28;
  const gap = params.layoutCount >= 4 ? 18 : 22;
  const shotInset = 20;
  const shotWidth = width - outerPadding * 2;
  const shotHeight = Math.round(shotWidth * 1.25);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height =
    outerPadding * 2 +
    shotHeight * params.layoutCount +
    gap * (params.layoutCount - 1) +
    footerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create final photobooth strip.");
  }

  const frame = getPhotoFrame(params.frameId);

  ctx.fillStyle = frame.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const innerX = outerPadding;
  const innerWidth = width - innerX * 2;
  let y = outerPadding;

  for (const image of loaded.slice(0, params.layoutCount)) {
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(innerX, y, innerWidth, shotHeight);

    drawContainImageFrame(
      ctx,
      image,
      image.width,
      image.height,
      innerX + shotInset,
      y + shotInset,
      innerWidth - shotInset * 2,
      shotHeight - shotInset * 2,
    );

    ctx.strokeStyle = frame.borderColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(innerX, y, innerWidth, shotHeight);

    ctx.strokeStyle = hexToRgba(frame.accentColor, 0.28);
    ctx.lineWidth = 2;
    ctx.strokeRect(
      innerX + shotInset * 0.5,
      y + shotInset * 0.5,
      innerWidth - shotInset,
      shotHeight - shotInset,
    );

    y += shotHeight + gap;
  }

  const footerY = canvas.height - footerHeight;
  ctx.fillStyle = frame.footerBackground;
  ctx.fillRect(innerX, footerY, innerWidth, footerHeight - outerPadding);

  ctx.strokeStyle = frame.accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, footerY, innerWidth, footerHeight - outerPadding);

  ctx.fillStyle = frame.footerText;
  ctx.textAlign = "center";
  ctx.font = "600 42px Georgia";
  ctx.fillText(params.guestLabel, canvas.width / 2, footerY + 72);
  ctx.font = "500 24px Arial";
  ctx.fillText(params.weddingLabel, canvas.width / 2, footerY + 114);
  ctx.font = "500 18px Arial";
  ctx.fillText(params.eventLabel, canvas.width / 2, footerY + 148);

  return canvas.toDataURL("image/jpeg", 0.94);
}

export function drawProcessedFrame(
  ctx: CanvasRenderingContext2D,
  params: {
    video: HTMLVideoElement;
    width: number;
    height: number;
    filterId: PhotoboothFilterId;
    effectId: PhotoboothEffectId;
    frameId: PhotoboothFrameId;
    beautyLevel: number;
    landmarks: NormalizedPoint[] | null;
    timestamp?: number;
    includeFrame?: boolean;
  },
) {
  const { video, width, height, filterId, effectId, frameId, beautyLevel, landmarks } = params;
  const filter = getPhotoFilter(filterId);

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.filter = buildCanvasFilter(filter.canvasFilter, beautyLevel);
  drawCoverVideoFrame(
    ctx,
    video,
    video.videoWidth || width,
    video.videoHeight || height,
    width,
    height,
    true,
  );
  ctx.restore();

  applyBeautyOverlay(ctx, video, width, height, beautyLevel);
  applyFilterDecorations(ctx, width, height, filter, beautyLevel);
  renderPhotoEffect({
    ctx,
    effectId,
    landmarks,
    sourceWidth: video.videoWidth || width,
    sourceHeight: video.videoHeight || height,
    targetWidth: width,
    targetHeight: height,
    mirror: true,
    timestamp: params.timestamp,
  });

  if (params.includeFrame ?? true) {
    drawFrameOverlay(ctx, width, height, frameId);
  }
}

export function getFramePreviewStyle(frameId: PhotoboothFrameId) {
  const frame = getPhotoFrame(frameId);

  return {
    borderColor: frame.borderColor,
    accentColor: frame.accentColor,
    footerBackground: frame.footerBackground,
    footerText: frame.footerText,
  };
}

function buildCanvasFilter(filterString: string, beautyLevel: number) {
  const brightness = 1 + beautyLevel * 0.0012;
  const saturation = 1 + beautyLevel * 0.0014;
  const contrast = 1 - beautyLevel * 0.0002;

  return [
    filterString !== "none" ? filterString : "",
    `brightness(${brightness.toFixed(3)})`,
    `saturate(${saturation.toFixed(3)})`,
    `contrast(${contrast.toFixed(3)})`,
  ]
    .filter(Boolean)
    .join(" ");
}

function applyBeautyOverlay(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  beautyLevel: number,
) {
  if (beautyLevel <= 0) {
    return;
  }

  const intensity = clamp(beautyLevel / 100, 0, 1);
  ctx.save();
  ctx.globalAlpha = 0.08 + intensity * 0.12;
  ctx.filter = `blur(${(1 + intensity * 2.4).toFixed(2)}px) brightness(${(1 + intensity * 0.05).toFixed(3)}) saturate(${(1 + intensity * 0.06).toFixed(3)})`;
  drawCoverVideoFrame(
    ctx,
    video,
    video.videoWidth || width,
    video.videoHeight || height,
    width,
    height,
    true,
  );
  ctx.restore();
}

function applyFilterDecorations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: ReturnType<typeof getPhotoFilter>,
  beautyLevel: number,
) {
  if (filter.tintColor && filter.tintStrength) {
    ctx.save();
    ctx.fillStyle = hexToRgba(filter.tintColor, filter.tintStrength);
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  if (filter.glowStrength) {
    const glow = ctx.createRadialGradient(
      width / 2,
      height * 0.22,
      width * 0.06,
      width / 2,
      height * 0.24,
      width * 0.72,
    );
    glow.addColorStop(0, `rgba(255,255,255,${(filter.glowStrength * 0.24).toFixed(3)})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  if (filter.vignetteStrength) {
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.28,
      width / 2,
      height / 2,
      width * 0.76,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(22,15,10,${(filter.vignetteStrength * 0.75).toFixed(3)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  const grainStrength = (filter.grainStrength ?? 0) + beautyLevel * 0.0003;
  if (grainStrength > 0) {
    drawFilmGrain(ctx, width, height, grainStrength);
  }
}

function drawFrameOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameId: PhotoboothFrameId,
) {
  const frame = getPhotoFrame(frameId);
  if (frameId === "none") {
    return;
  }

  const border = frameId === "polaroid" ? 22 : frameId === "film" ? 18 : 14;
  ctx.save();
  ctx.lineWidth = border;
  ctx.strokeStyle = frame.borderColor;
  ctx.strokeRect(border / 2, border / 2, width - border, height - border);

  if (frameId === "polaroid" || frameId === "event") {
    const footerHeight = frameId === "polaroid" ? 112 : 94;
    ctx.fillStyle = frame.footerBackground;
    ctx.fillRect(border, height - footerHeight, width - border * 2, footerHeight - border);
  }

  if (frameId === "film") {
    ctx.fillStyle = frame.borderColor;
    ctx.fillRect(0, 0, width, border + 10);
    ctx.fillRect(0, height - (border + 10), width, border + 10);
    for (let index = 0; index < 10; index++) {
      const holeWidth = width / 11;
      ctx.clearRect(holeWidth * index + 12, 6, holeWidth * 0.42, 10);
      ctx.clearRect(holeWidth * index + 12, height - 16, holeWidth * 0.42, 10);
    }
  }

  if (frameId !== "none") {
    ctx.strokeStyle = hexToRgba(frame.accentColor, 0.45);
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, width - 36, height - 36);
  }

  ctx.restore();
}

function drawFilmGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number,
) {
  ctx.save();
  const alpha = clamp(strength, 0.02, 0.2);
  for (let index = 0; index < 1400; index++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha * (Math.random() * 0.6)})`;
    ctx.fillRect(x, y, 1.1, 1.1);
  }
  ctx.restore();
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load captured photobooth shot."));
    image.src = src;
  });
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => value + value)
          .join("")
      : normalized;
  const int = Number.parseInt(safeHex, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
