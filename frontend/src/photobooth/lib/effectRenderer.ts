import type { NormalizedPoint, PhotoboothEffectId } from "@/photobooth/types";
import { clamp, distance, mapNormalizedPointToCover, midpoint } from "@/photobooth/lib/geometry";

type RenderOptions = {
  ctx: CanvasRenderingContext2D;
  effectId: PhotoboothEffectId;
  landmarks: NormalizedPoint[] | null;
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  mirror?: boolean;
  timestamp?: number;
};

type FaceGeometry = {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  eyeCenter: { x: number; y: number };
  browLeft: { x: number; y: number };
  browRight: { x: number; y: number };
  nose: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  mouthLeft: { x: number; y: number };
  mouthRight: { x: number; y: number };
  forehead: { x: number; y: number };
  chin: { x: number; y: number };
  cheekLeft: { x: number; y: number };
  cheekRight: { x: number; y: number };
  jawLeft: { x: number; y: number };
  jawRight: { x: number; y: number };
  faceCenter: { x: number; y: number };
  faceWidth: number;
  faceHeight: number;
};

const LANDMARK_INDEX = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  leftEyeInner: 133,
  rightEyeInner: 362,
  browLeft: 70,
  browRight: 300,
  nose: 1,
  mouthTop: 13,
  mouthBottom: 14,
  mouthLeft: 61,
  mouthRight: 291,
  forehead: 10,
  chin: 152,
  cheekLeft: 205,
  cheekRight: 425,
  jawLeft: 234,
  jawRight: 454,
};

export function renderPhotoEffect({
  ctx,
  effectId,
  landmarks,
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  mirror = true,
  timestamp = 0,
}: RenderOptions) {
  if (effectId === "none") {
    return;
  }

  const face = buildFaceGeometry(
    landmarks,
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    mirror,
  );
  const t = timestamp / 1000;

  ctx.save();

  switch (effectId) {
    case "cat-ears":
      if (face) {
        drawTriangleEar(
          ctx,
          face.faceCenter.x - face.faceWidth * 0.22,
          face.forehead.y - face.faceHeight * 0.22,
          face.faceWidth * 0.16,
          "#2d1e1a",
          "#f9c9d0",
        );
        drawTriangleEar(
          ctx,
          face.faceCenter.x + face.faceWidth * 0.22,
          face.forehead.y - face.faceHeight * 0.22,
          face.faceWidth * 0.16,
          "#2d1e1a",
          "#f9c9d0",
        );
      }
      break;
    case "bunny-ears":
      if (face) {
        drawRoundedEar(
          ctx,
          face.faceCenter.x - face.faceWidth * 0.18,
          face.forehead.y - face.faceHeight * 0.34,
          face.faceWidth * 0.12,
          face.faceHeight * 0.44,
          "#fff7fb",
          "#f4a9bf",
        );
        drawRoundedEar(
          ctx,
          face.faceCenter.x + face.faceWidth * 0.18,
          face.forehead.y - face.faceHeight * 0.34,
          face.faceWidth * 0.12,
          face.faceHeight * 0.44,
          "#fff7fb",
          "#f4a9bf",
        );
      }
      break;
    case "dog-ears":
      if (face) {
        drawDroopyEar(
          ctx,
          face.faceCenter.x - face.faceWidth * 0.38,
          face.forehead.y - face.faceHeight * 0.06,
          face.faceWidth * 0.22,
          face.faceHeight * 0.48,
        );
        drawDroopyEar(
          ctx,
          face.faceCenter.x + face.faceWidth * 0.38,
          face.forehead.y - face.faceHeight * 0.06,
          face.faceWidth * 0.22,
          face.faceHeight * 0.48,
        );
      }
      break;
    case "crown":
      if (face) {
        drawCrown(
          ctx,
          face.faceCenter.x,
          face.forehead.y - face.faceHeight * 0.18,
          face.faceWidth * 0.66,
        );
      }
      break;
    case "retro-sunglasses":
      if (face) {
        drawGlasses(ctx, face.leftEye, face.rightEye, face.faceWidth * 0.18, "#201916", "#8b5cf6");
      }
      break;
    case "heart-glasses":
      if (face) {
        drawHeartGlasses(ctx, face.leftEye, face.rightEye, face.faceWidth * 0.11);
      }
      break;
    case "flower-crown":
      if (face) {
        drawFlowerCrown(
          ctx,
          face.faceCenter.x,
          face.forehead.y - face.faceHeight * 0.1,
          face.faceWidth * 0.78,
        );
      }
      break;
    case "sparkle":
      drawSparkles(
        ctx,
        face?.faceCenter ?? { x: targetWidth / 2, y: targetHeight / 2 },
        face?.faceWidth ?? targetWidth * 0.3,
        t,
      );
      break;
    case "love-hearts":
      drawFloatingHearts(
        ctx,
        face?.faceCenter ?? { x: targetWidth / 2, y: targetHeight / 2 },
        face?.faceWidth ?? targetWidth * 0.3,
        t,
      );
      break;
    case "angel-halo":
      if (face) {
        drawHalo(
          ctx,
          face.faceCenter.x,
          face.forehead.y - face.faceHeight * 0.24,
          face.faceWidth * 0.32,
        );
      }
      break;
    case "devil-horn":
      if (face) {
        drawHorn(
          ctx,
          face.faceCenter.x - face.faceWidth * 0.2,
          face.forehead.y - face.faceHeight * 0.17,
          face.faceWidth * 0.13,
        );
        drawHorn(
          ctx,
          face.faceCenter.x + face.faceWidth * 0.2,
          face.forehead.y - face.faceHeight * 0.17,
          face.faceWidth * 0.13,
        );
      }
      break;
    case "cute-blush":
      if (face) {
        drawBlush(ctx, face.cheekLeft, face.cheekRight, face.faceWidth * 0.09);
      }
      break;
    case "freckles":
      if (face) {
        drawFreckles(ctx, face);
      }
      break;
    case "face-tattoo":
      if (face) {
        drawTattoo(ctx, face.cheekRight, face.faceWidth * 0.08);
      }
      break;
    case "funny-mustache":
      if (face) {
        drawMustache(ctx, face.mouthCenter, face.faceWidth * 0.24);
      }
      break;
    case "clown-nose":
      if (face) {
        drawClownNose(ctx, face.nose, face.faceWidth * 0.06);
      }
      break;
    case "butterfly":
      if (face) {
        drawButterflies(ctx, face.faceCenter, face.faceWidth * 0.48, t);
      }
      break;
    case "stars":
      drawStars(
        ctx,
        face?.faceCenter ?? { x: targetWidth / 2, y: targetHeight / 2 },
        face?.faceWidth ?? targetWidth * 0.34,
        t,
      );
      break;
    case "neon-face":
      if (face) {
        drawNeonFace(ctx, face);
      }
      break;
    case "party-confetti":
      drawConfetti(ctx, { width: targetWidth, height: targetHeight }, t);
      break;
  }

  ctx.restore();
}

function buildFaceGeometry(
  landmarks: NormalizedPoint[] | null,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  mirror: boolean,
): FaceGeometry | null {
  if (!landmarks || landmarks.length <= LANDMARK_INDEX.jawRight) {
    return null;
  }

  const point = (index: number) =>
    mapNormalizedPointToCover(
      landmarks[index],
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight,
      mirror,
    );

  const leftEye = midpoint(point(LANDMARK_INDEX.leftEyeOuter), point(LANDMARK_INDEX.leftEyeInner));
  const rightEye = midpoint(
    point(LANDMARK_INDEX.rightEyeOuter),
    point(LANDMARK_INDEX.rightEyeInner),
  );
  const browLeft = point(LANDMARK_INDEX.browLeft);
  const browRight = point(LANDMARK_INDEX.browRight);
  const nose = point(LANDMARK_INDEX.nose);
  const mouthCenter = midpoint(point(LANDMARK_INDEX.mouthTop), point(LANDMARK_INDEX.mouthBottom));
  const mouthLeft = point(LANDMARK_INDEX.mouthLeft);
  const mouthRight = point(LANDMARK_INDEX.mouthRight);
  const forehead = point(LANDMARK_INDEX.forehead);
  const chin = point(LANDMARK_INDEX.chin);
  const cheekLeft = point(LANDMARK_INDEX.cheekLeft);
  const cheekRight = point(LANDMARK_INDEX.cheekRight);
  const jawLeft = point(LANDMARK_INDEX.jawLeft);
  const jawRight = point(LANDMARK_INDEX.jawRight);
  const eyeCenter = midpoint(leftEye, rightEye);
  const faceCenter = midpoint(forehead, chin);

  return {
    leftEye,
    rightEye,
    eyeCenter,
    browLeft,
    browRight,
    nose,
    mouthCenter,
    mouthLeft,
    mouthRight,
    forehead,
    chin,
    cheekLeft,
    cheekRight,
    jawLeft,
    jawRight,
    faceCenter,
    faceWidth: Math.max(distance(jawLeft, jawRight), distance(cheekLeft, cheekRight)),
    faceHeight: distance(forehead, chin),
  };
}

function drawTriangleEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  outerColor: string,
  innerColor: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 1.2);
  ctx.lineTo(x - size, y + size * 0.4);
  ctx.lineTo(x + size, y + size * 0.4);
  ctx.closePath();
  ctx.fillStyle = outerColor;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.72);
  ctx.lineTo(x - size * 0.48, y + size * 0.12);
  ctx.lineTo(x + size * 0.48, y + size * 0.12);
  ctx.closePath();
  ctx.fillStyle = innerColor;
  ctx.fill();
  ctx.restore();
}

function drawRoundedEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  outerColor: string,
  innerColor: string,
) {
  ctx.save();
  ctx.fillStyle = outerColor;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.ellipse(x, y, width * 0.45, height * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDroopyEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.save();
  ctx.fillStyle = "#8f6240";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(
    x - width * 0.3,
    y + height * 0.15,
    x - width * 0.4,
    y + height * 0.82,
    x,
    y + height,
  );
  ctx.bezierCurveTo(x + width * 0.38, y + height * 0.82, x + width * 0.3, y + height * 0.15, x, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d9b58f";
  ctx.beginPath();
  ctx.ellipse(x, y + height * 0.55, width * 0.34, height * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D, centerX: number, topY: number, width: number) {
  ctx.save();
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  ctx.fillStyle = "#f2c94c";
  ctx.strokeStyle = "#9a6d0a";
  ctx.lineWidth = Math.max(2, width * 0.02);
  ctx.beginPath();
  ctx.moveTo(left, topY + width * 0.18);
  ctx.lineTo(centerX - width * 0.28, topY + width * 0.02);
  ctx.lineTo(centerX - width * 0.08, topY - width * 0.12);
  ctx.lineTo(centerX, topY + width * 0.01);
  ctx.lineTo(centerX + width * 0.08, topY - width * 0.12);
  ctx.lineTo(centerX + width * 0.28, topY + width * 0.02);
  ctx.lineTo(right, topY + width * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  lensRadius: number,
  frameColor: string,
  lensColor: string,
) {
  ctx.save();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = Math.max(4, lensRadius * 0.18);
  ctx.fillStyle = `${lensColor}55`;
  for (const eye of [leftEye, rightEye]) {
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y, lensRadius, lensRadius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(leftEye.x + lensRadius * 0.8, leftEye.y);
  ctx.lineTo(rightEye.x - lensRadius * 0.8, rightEye.y);
  ctx.stroke();
  ctx.restore();
}

function drawHeartGlasses(
  ctx: CanvasRenderingContext2D,
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  size: number,
) {
  ctx.save();
  ctx.strokeStyle = "#d54279";
  ctx.fillStyle = "rgba(255,125,171,0.24)";
  ctx.lineWidth = Math.max(3, size * 0.15);
  drawHeart(ctx, leftEye.x, leftEye.y, size);
  drawHeart(ctx, rightEye.x, rightEye.y, size);
  ctx.beginPath();
  ctx.moveTo(leftEye.x + size * 0.72, leftEye.y);
  ctx.lineTo(rightEye.x - size * 0.72, rightEye.y);
  ctx.stroke();
  ctx.restore();
}

function drawFlowerCrown(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.save();
  const petals = 7;
  for (let index = 0; index < petals; index++) {
    const offset = (index / (petals - 1) - 0.5) * width;
    drawFlower(
      ctx,
      x + offset,
      y + Math.abs(offset) * 0.08,
      width * 0.05,
      index % 2 === 0 ? "#ffd8ec" : "#fff2b3",
    );
  }
  ctx.restore();
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  time: number,
) {
  ctx.save();
  for (let index = 0; index < 6; index++) {
    const angle = time * 0.8 + (Math.PI * 2 * index) / 6;
    const x = center.x + Math.cos(angle) * radius * 0.85;
    const y = center.y + Math.sin(angle) * radius * 0.65;
    drawSpark(ctx, x, y, 8 + (index % 3) * 4, "#fff3a1");
  }
  ctx.restore();
}

function drawFloatingHearts(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  time: number,
) {
  ctx.save();
  for (let index = 0; index < 5; index++) {
    const wave = time + index * 0.6;
    const x = center.x + Math.cos(wave) * radius * 0.72;
    const y = center.y - radius * 0.75 - index * 12 - Math.sin(wave * 1.2) * 10;
    drawHeart(ctx, x, y, 12 - index, "#ff6aa8", true);
  }
  ctx.restore();
}

function drawHalo(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.save();
  ctx.strokeStyle = "#f8de63";
  ctx.lineWidth = Math.max(4, radius * 0.18);
  ctx.shadowColor = "rgba(248,222,99,0.6)";
  ctx.shadowBlur = radius * 0.4;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHorn(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#cf2e4b";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * 0.2, y - size * 1.35, x + size * 0.9, y - size * 0.24);
  ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.1, x, y);
  ctx.fill();
  ctx.restore();
}

function drawBlush(
  ctx: CanvasRenderingContext2D,
  left: { x: number; y: number },
  right: { x: number; y: number },
  radius: number,
) {
  ctx.save();
  for (const cheek of [left, right]) {
    const gradient = ctx.createRadialGradient(
      cheek.x,
      cheek.y,
      radius * 0.1,
      cheek.x,
      cheek.y,
      radius,
    );
    gradient.addColorStop(0, "rgba(255,118,150,0.32)");
    gradient.addColorStop(1, "rgba(255,118,150,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cheek.x, cheek.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFreckles(ctx: CanvasRenderingContext2D, face: FaceGeometry) {
  ctx.save();
  ctx.fillStyle = "rgba(123,78,52,0.45)";
  const positions = [
    [face.nose.x - face.faceWidth * 0.06, face.nose.y + face.faceHeight * 0.02],
    [face.nose.x - face.faceWidth * 0.04, face.nose.y + face.faceHeight * 0.04],
    [face.nose.x - face.faceWidth * 0.02, face.nose.y + face.faceHeight * 0.01],
    [face.nose.x + face.faceWidth * 0.03, face.nose.y + face.faceHeight * 0.02],
    [face.nose.x + face.faceWidth * 0.05, face.nose.y + face.faceHeight * 0.045],
    [face.nose.x + face.faceWidth * 0.07, face.nose.y + face.faceHeight * 0.01],
  ];

  for (const [x, y] of positions) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.4, face.faceWidth * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTattoo(ctx: CanvasRenderingContext2D, cheek: { x: number; y: number }, size: number) {
  ctx.save();
  ctx.strokeStyle = "#2d1e7c";
  ctx.lineWidth = Math.max(2, size * 0.18);
  drawStar(ctx, cheek.x + size * 0.2, cheek.y - size * 0.15, size * 0.8, false);
  ctx.stroke();
  ctx.restore();
}

function drawMustache(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  width: number,
) {
  ctx.save();
  ctx.fillStyle = "#2d2018";
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.bezierCurveTo(
    center.x - width * 0.16,
    center.y - width * 0.12,
    center.x - width * 0.48,
    center.y + width * 0.24,
    center.x - width * 0.52,
    center.y,
  );
  ctx.bezierCurveTo(
    center.x - width * 0.42,
    center.y + width * 0.1,
    center.x - width * 0.18,
    center.y + width * 0.08,
    center.x,
    center.y + width * 0.02,
  );
  ctx.bezierCurveTo(
    center.x + width * 0.18,
    center.y + width * 0.08,
    center.x + width * 0.42,
    center.y + width * 0.1,
    center.x + width * 0.52,
    center.y,
  );
  ctx.bezierCurveTo(
    center.x + width * 0.48,
    center.y + width * 0.24,
    center.x + width * 0.16,
    center.y - width * 0.12,
    center.x,
    center.y,
  );
  ctx.fill();
  ctx.restore();
}

function drawClownNose(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
) {
  ctx.save();
  const gradient = ctx.createRadialGradient(
    center.x - radius * 0.2,
    center.y - radius * 0.3,
    radius * 0.2,
    center.x,
    center.y,
    radius,
  );
  gradient.addColorStop(0, "#ffd2d2");
  gradient.addColorStop(1, "#d92f47");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawButterflies(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  time: number,
) {
  ctx.save();
  for (let index = 0; index < 3; index++) {
    const angle = time + index * 1.8;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y - radius * 0.4 + Math.sin(angle * 1.4) * radius * 0.25;
    drawButterfly(ctx, x, y, 22 - index * 3, angle);
  }
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  radius: number,
  time: number,
) {
  ctx.save();
  for (let index = 0; index < 7; index++) {
    const angle = time * 0.4 + (Math.PI * 2 * index) / 7;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius * 0.7;
    drawStar(ctx, x, y, 9 + (index % 2) * 3, true);
  }
  ctx.restore();
}

function drawNeonFace(ctx: CanvasRenderingContext2D, face: FaceGeometry) {
  ctx.save();
  ctx.strokeStyle = "#5cf2ff";
  ctx.lineWidth = Math.max(2, face.faceWidth * 0.015);
  ctx.shadowColor = "rgba(92,242,255,0.7)";
  ctx.shadowBlur = face.faceWidth * 0.08;
  ctx.beginPath();
  ctx.moveTo(face.jawLeft.x, face.jawLeft.y);
  ctx.quadraticCurveTo(
    face.cheekLeft.x,
    face.cheekLeft.y - face.faceHeight * 0.12,
    face.forehead.x,
    face.forehead.y + face.faceHeight * 0.06,
  );
  ctx.quadraticCurveTo(
    face.cheekRight.x,
    face.cheekRight.y - face.faceHeight * 0.12,
    face.jawRight.x,
    face.jawRight.y,
  );
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(face.leftEye.x, face.leftEye.y + face.faceHeight * 0.1);
  ctx.lineTo(face.rightEye.x, face.rightEye.y + face.faceHeight * 0.1);
  ctx.stroke();
  ctx.restore();
}

function drawConfetti(
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  time: number,
) {
  ctx.save();
  const colors = ["#ff8a5b", "#ffd166", "#06d6a0", "#118ab2", "#ef476f"];
  for (let index = 0; index < 24; index++) {
    const column = (index % 6) / 6;
    const row = Math.floor(index / 6) / 4;
    const x = column * size.width + Math.sin(time * 1.7 + index) * 18 + size.width * 0.08;
    const y = row * size.height + ((time * 48 + index * 19) % size.height);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time + index);
    ctx.fillStyle = colors[index % colors.length];
    ctx.fillRect(-4, -9, 8, 18);
    ctx.restore();
  }
  ctx.restore();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = "#ff5c93",
  fill = false,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.25);
  ctx.bezierCurveTo(x - size, y - size * 0.45, x - size * 1.25, y + size * 0.72, x, y + size * 1.1);
  ctx.bezierCurveTo(
    x + size * 1.25,
    y + size * 0.72,
    x + size,
    y - size * 0.45,
    x,
    y + size * 0.25,
  );
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petalColor: string,
) {
  ctx.save();
  for (let index = 0; index < 5; index++) {
    const angle = (Math.PI * 2 * index) / 5;
    ctx.fillStyle = petalColor;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius,
      radius * 0.72,
      radius * 0.48,
      angle,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.fillStyle = "#f5c542";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.18);
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill = true,
) {
  ctx.save();
  ctx.beginPath();
  for (let index = 0; index < 10; index++) {
    const angle = Math.PI / 2 + (Math.PI * index) / 5;
    const r = index % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * r;
    const py = y - Math.sin(angle) * r;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = "#ffe37d";
    ctx.fill();
  }
  ctx.restore();
}

function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation * 0.25);
  ctx.fillStyle = "rgba(165,105,255,0.65)";
  ctx.beginPath();
  ctx.ellipse(-size * 0.34, -size * 0.12, size * 0.42, size * 0.3, Math.PI / 4, 0, Math.PI * 2);
  ctx.ellipse(size * 0.34, -size * 0.12, size * 0.42, size * 0.3, -Math.PI / 4, 0, Math.PI * 2);
  ctx.ellipse(-size * 0.28, size * 0.22, size * 0.36, size * 0.25, -Math.PI / 4, 0, Math.PI * 2);
  ctx.ellipse(size * 0.28, size * 0.22, size * 0.36, size * 0.25, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3b2b57";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.45);
  ctx.lineTo(0, size * 0.5);
  ctx.stroke();
  ctx.restore();
}
