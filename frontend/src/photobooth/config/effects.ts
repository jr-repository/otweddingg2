import type { PhotoboothEffectConfig } from "@/photobooth/types";

export const PHOTO_EFFECTS: PhotoboothEffectConfig[] = [
  { id: "none", name: "None", emoji: "◎", description: "No AR overlay" },
  { id: "cat-ears", name: "Cat Ears", emoji: "🐱", description: "Playful cat ears" },
  { id: "bunny-ears", name: "Bunny Ears", emoji: "🐰", description: "Tall soft bunny ears" },
  { id: "dog-ears", name: "Dog Ears", emoji: "🐶", description: "Droopy puppy ears" },
  { id: "crown", name: "Crown", emoji: "👑", description: "Golden ceremony crown" },
  {
    id: "retro-sunglasses",
    name: "Retro Sunglasses",
    emoji: "🕶️",
    description: "Bold retro shades",
  },
  { id: "heart-glasses", name: "Heart Glasses", emoji: "💗", description: "Cute heart eyewear" },
  { id: "flower-crown", name: "Flower Crown", emoji: "🌸", description: "Soft floral crown" },
  { id: "sparkle", name: "Sparkle", emoji: "✨", description: "Animated sparkles" },
  { id: "love-hearts", name: "Love Hearts", emoji: "💕", description: "Floating love hearts" },
  { id: "angel-halo", name: "Angel Halo", emoji: "😇", description: "Bright halo ring" },
  { id: "devil-horn", name: "Devil Horn", emoji: "😈", description: "Mini devil horns" },
  { id: "cute-blush", name: "Cute Blush", emoji: "😊", description: "Natural blush cheeks" },
  { id: "freckles", name: "Freckles", emoji: "🟤", description: "Soft freckle dots" },
  { id: "face-tattoo", name: "Face Tattoo", emoji: "⚡", description: "Small cheek tattoo" },
  { id: "funny-mustache", name: "Funny Mustache", emoji: "👨", description: "Classic mustache" },
  { id: "clown-nose", name: "Clown Nose", emoji: "🤡", description: "Bright red nose" },
  { id: "butterfly", name: "Butterfly", emoji: "🦋", description: "Butterflies around the face" },
  { id: "stars", name: "Stars", emoji: "⭐", description: "Twinkling stars" },
  { id: "neon-face", name: "Neon Face", emoji: "🔮", description: "Neon contour face lines" },
  {
    id: "party-confetti",
    name: "Party Confetti",
    emoji: "🎉",
    description: "Party confetti burst",
  },
];

export function getPhotoEffect(id: PhotoboothEffectConfig["id"]) {
  return PHOTO_EFFECTS.find((effect) => effect.id === id) ?? PHOTO_EFFECTS[0];
}
