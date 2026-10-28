// Values shared by the web app, the mobile app and the database seed.

export const SHOP_CURRENCY = "INR" as const;

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const AGE_GROUPS = [
  { id: "0-2", label: "0–2 years" },
  { id: "3-5", label: "3–5 years" },
  { id: "6-8", label: "6–8 years" },
  { id: "9-12", label: "9–12 years" },
  { id: "12+", label: "12+ years" },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number]["id"];

export const DEFAULT_CATEGORIES = [
  { slug: "vehicles", name: "Vehicles", icon: "🚗", color: "sky" },
  { slug: "puzzles", name: "Puzzles", icon: "🧩", color: "grape" },
  { slug: "soft-toys", name: "Soft Toys", icon: "🧸", color: "bubblegum" },
  { slug: "art-craft", name: "Art & Craft", icon: "🎨", color: "orange" },
  { slug: "learning", name: "Learning", icon: "📚", color: "mint" },
  { slug: "outdoor", name: "Outdoor", icon: "⚽", color: "sunshine" },
  { slug: "electronic", name: "Electronic", icon: "🎮", color: "sky" },
  { slug: "baby", name: "Baby", icon: "👶", color: "bubblegum" },
] as const;

// GST slabs the owner can pick per product (percent).
export const GST_RATES = [0, 5, 12, 18, 28] as const;

export type GstRate = (typeof GST_RATES)[number];
