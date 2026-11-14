import { en, type MessageKey } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";

export const LOCALES = ["en", "ta", "hi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", ta: "தமிழ்", hi: "हिंदी" };
// For dates and numbers (Intl).
export const LOCALE_TAGS: Record<Locale, string> = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ta, hi };

export type { MessageKey };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// t("cart.left", { count: 3 }) → "Only 3 left". Unknown keys (such as a plain
// English message from the server) are shown as they are.
export function translate(
  messages: Record<string, string>,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template = messages[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// Content saved in several languages: { ta: { name: "…" }, hi: { … } }.
export type ContentTranslations = Partial<Record<Exclude<Locale, "en">, Record<string, string>>>;

export function localized(
  translations: ContentTranslations | null | undefined,
  locale: Locale,
  field: string,
  fallback: string,
): string {
  if (locale === "en") return fallback;
  const value = translations?.[locale]?.[field];
  return value && value.trim() ? value : fallback;
}
