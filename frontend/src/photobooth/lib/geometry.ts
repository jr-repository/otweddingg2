import type { NormalizedPoint } from "@/photobooth/types";

export type CoverPlacement = {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
};

export type ContainPlacement = {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
};

export function getCoverPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): CoverPlacement {
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  return {
    drawWidth,
    drawHeight,
    offsetX: (targetWidth - drawWidth) / 2,
    offsetY: (targetHeight - drawHeight) / 2,
  };
}

export function getContainPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ContainPlacement {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;

  return {
    drawWidth,
    drawHeight,
    offsetX: (targetWidth - drawWidth) / 2,
    offsetY: (targetHeight - drawHeight) / 2,
  };
}

export function drawCoverVideoFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mirror = true,
) {
  const placement = getCoverPlacement(sourceWidth, sourceHeight, targetWidth, targetHeight);

  ctx.save();
  if (mirror) {
    ctx.translate(targetWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    source,
    placement.offsetX,
    placement.offsetY,
    placement.drawWidth,
    placement.drawHeight,
  );
  ctx.restore();
}

export function drawContainImageFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
) {
  const placement = getContainPlacement(sourceWidth, sourceHeight, targetWidth, targetHeight);
  ctx.drawImage(
    source,
    targetX + placement.offsetX,
    targetY + placement.offsetY,
    placement.drawWidth,
    placement.drawHeight,
  );
}

export function mapNormalizedPointToCover(
  point: NormalizedPoint,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mirror = true,
) {
  const placement = getCoverPlacement(sourceWidth, sourceHeight, targetWidth, targetHeight);
  let x = point.x * placement.drawWidth + placement.offsetX;
  const y = point.y * placement.drawHeight + placement.offsetY;

  if (mirror) {
    x = targetWidth - x;
  }

  return { x, y };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
