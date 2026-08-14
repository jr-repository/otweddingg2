export type PhotoboothFilterId =
  | "original"
  | "warm"
  | "cool"
  | "vintage"
  | "retro"
  | "kodak"
  | "fuji"
  | "disposable"
  | "blackwhite"
  | "sepia"
  | "soft"
  | "dreamy"
  | "high-contrast"
  | "pastel"
  | "cinematic"
  | "tokyo"
  | "seoul"
  | "summer"
  | "winter"
  | "film-grain";

export type PhotoboothEffectId =
  | "none"
  | "cat-ears"
  | "bunny-ears"
  | "dog-ears"
  | "crown"
  | "retro-sunglasses"
  | "heart-glasses"
  | "flower-crown"
  | "sparkle"
  | "love-hearts"
  | "angel-halo"
  | "devil-horn"
  | "cute-blush"
  | "freckles"
  | "face-tattoo"
  | "funny-mustache"
  | "clown-nose"
  | "butterfly"
  | "stars"
  | "neon-face"
  | "party-confetti";

export type PhotoboothFrameId =
  | "none"
  | "white"
  | "black"
  | "minimal"
  | "pink"
  | "blue"
  | "retro"
  | "film"
  | "polaroid"
  | "event";

export type PhotoboothPanel = "filter" | "effect" | "frame" | "beauty";
export type PhotoboothLayoutCount = 1 | 2 | 3 | 4;

export type NormalizedPoint = {
  x: number;
  y: number;
  z?: number;
};

export type PhotoboothFilterConfig = {
  id: PhotoboothFilterId;
  name: string;
  swatch: string;
  cssFilter: string;
  canvasFilter: string;
  tintColor?: string;
  tintStrength?: number;
  grainStrength?: number;
  vignetteStrength?: number;
  glowStrength?: number;
};

export type PhotoboothEffectConfig = {
  id: PhotoboothEffectId;
  name: string;
  emoji: string;
  description: string;
};

export type PhotoboothFrameConfig = {
  id: PhotoboothFrameId;
  name: string;
  borderColor: string;
  accentColor: string;
  backgroundColor: string;
  footerBackground: string;
  footerText: string;
};

export type PhotoboothSessionGuest = {
  id: number;
  fullName: string;
  guestCode: string;
};

export type PhotoboothSavedCapture = {
  id: number;
  guestId: number;
  guestCode: string;
  guestName: string;
  eventKey: string;
  layoutMode: string;
  shotCount: number;
  filterId: string;
  effectId: string;
  frameId: string;
  beautyLevel: number;
  capturedAt: string;
  finalImageUrl: string;
  shotUrls: string[];
};
