import { Baloo_2, Baloo_Thambi_2 } from "next/font/google";
import type { Locale } from "@toyshop/shared";

// Playful heading letters for Tamil and Hindi (Fredoka only covers English).
// Not preloaded: the browser fetches one only when a page really shows
// Tamil or Hindi headings, so English pages stay light.
const tamil = Baloo_Thambi_2({
  subsets: ["tamil"],
  variable: "--font-indic",
  display: "swap",
  preload: false,
});

const hindi = Baloo_2({
  subsets: ["devanagari"],
  variable: "--font-indic",
  display: "swap",
  preload: false,
});

// Classes for the page wrapper (see .indic-headings in globals.css).
export function indicFontClass(locale: Locale): string {
  if (locale === "ta") return `${tamil.variable} indic-headings`;
  if (locale === "hi") return `${hindi.variable} indic-headings`;
  return "";
}
