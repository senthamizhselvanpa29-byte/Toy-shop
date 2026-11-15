import type { Metadata } from "next";
import type { Locale } from "@toyshop/shared";
import { LOCALES, localePath } from "./locales";

// Tells search engines that "/toys", "/ta/toys" and "/hi/toys" are the same
// page in three languages (the root layout's metadataBase makes them absolute).
export function alternatesFor(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((item) => [item, localePath(item, path)])),
      "x-default": path,
    },
  };
}
