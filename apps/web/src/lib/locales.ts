// Language helpers that are safe everywhere (middleware, browser and server):
// no message lists, no server-only code.
import type { Locale } from "@toyshop/shared";

// English lives at "/", Tamil under "/ta" and Hindi under "/hi".
export const LOCALES: readonly Locale[] = ["en", "ta", "hi"];
export const DEFAULT_LOCALE: Locale = "en";

// Remembers the shopper's choice so "/" opens in their language next time.
export const LOCALE_COOKIE = "toyshop-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Areas with no language in their address (owner area, invoices, APIs).
const PLAIN_PREFIXES = ["/admin", "/api", "/invoice", "/style-guide", "/account/callback"];

export function isPlainPath(pathname: string): boolean {
  return PLAIN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// "/ta/toys" → { locale: "ta", path: "/toys" }; "/toys" → { locale: null, path: "/toys" }
export function stripLocale(pathname: string): { locale: Locale | null; path: string } {
  const match = pathname.match(/^\/([a-z]{2})(?=\/|$)/);
  if (match && isLocale(match[1])) {
    return { locale: match[1], path: pathname.slice(match[0].length) || "/" };
  }
  return { locale: null, path: pathname };
}

// Puts the language into a shop link: localePath("ta", "/toys?age=3-5") → "/ta/toys?age=3-5".
// English links, outside links and plain areas are returned unchanged.
export function localePath(locale: Locale, href: string): string {
  if (locale === DEFAULT_LOCALE || !href.startsWith("/") || href.startsWith("//")) return href;
  const pathname = href.split(/[?#]/)[0];
  if (isPlainPath(pathname) || stripLocale(pathname).locale) return href;
  const prefix = `/${locale}`;
  if (href === "/") return prefix;
  if (href.startsWith("/?") || href.startsWith("/#")) return prefix + href.slice(1);
  return prefix + href;
}

// The login page in the shopper's language, coming back to `next` afterwards.
export function loginPath(locale: Locale, next: string): string {
  return `${localePath(locale, "/account/login")}?next=${encodeURIComponent(localePath(locale, next))}`;
}
