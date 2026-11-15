import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@toyshop/shared";
import type { ThemeColor } from "@/components/ui/colors";
import { isThemeColor } from "@/components/ui/colors";
import { productImageUrl } from "@/lib/catalog";
import { CATALOG_TAG, publicClient } from "@/lib/shop";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Everything the owner sets in Owner area → Settings that customers see:
// shop name, logo, contact details, banner, holiday mode, GST mode…

export type GstMode = "none" | "regular" | "composition";

// Texts the owner can also write in Tamil and Hindi.
export const SHOP_TEXT_KEYS = ["tagline", "announcement", "pausedMessage", "whatsappMessage"] as const;
export type ShopTextKey = (typeof SHOP_TEXT_KEYS)[number];
export type ShopTexts = Record<ShopTextKey, string>;
export type ShopTranslations = Partial<Record<"ta" | "hi", Partial<ShopTexts>>>;

// One row of the shop_settings table. Columns added by later database updates
// may be missing until the owner runs them, so everything is optional.
export type ShopSettingsRow = Partial<{
  delivery_fee_paise: number;
  free_delivery_above_paise: number;
  cod_enabled: boolean;
  cod_max_paise: number;
  business_name: string;
  business_address: string;
  business_state: string;
  business_phone: string;
  business_email: string;
  gstin: string;
  default_hsn: string;
  return_days: number;
  legal_name: string;
  tagline: string;
  logo_path: string;
  logo_emoji: string;
  show_name_with_logo: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  grievance_officer: string;
  announcement_enabled: boolean;
  announcement_text: string;
  announcement_link: string;
  announcement_color: string;
  ordering_paused: boolean;
  paused_message: string;
  gst_mode: string;
  invoice_prefix: string;
  invoice_fy: boolean;
  invoice_notes: string;
  signature_path: string;
  signatory_name: string;
  translations: ShopTranslations | null;
}>;

export type ShopProfile = {
  name: string;
  // Name on invoices (the registered business name, if different).
  legalName: string;
  // Empty when the owner hasn't written one: the shop then uses its built-in line.
  tagline: string;
  logoUrl: string | null;
  logoEmoji: string;
  showNameWithLogo: boolean;
  phone: string;
  email: string;
  address: string;
  state: string;
  whatsapp: { number: string; message: string } | null;
  social: { label: string; icon: string; url: string }[];
  grievanceOfficer: string;
  announcement: { text: string; link: string; color: ThemeColor } | null;
  // Set when the owner has paused new orders ("holiday mode").
  paused: { message: string } | null;
  gstMode: GstMode;
  gstin: string;
  returnDays: number;
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
};

export function shopImageUrl(path: string | undefined | null): string | null {
  return path ? productImageUrl(path) : null;
}

export function gstModeOf(row: ShopSettingsRow): GstMode {
  const mode = row.gst_mode;
  if (mode === "regular" || mode === "composition" || mode === "none") return mode;
  // Before 0008_shop_identity.sql: a GSTIN meant GST tax invoices.
  return row.gstin ? "regular" : "none";
}

export function localizedShopText(row: ShopSettingsRow, key: ShopTextKey, locale: Locale): string {
  const column = { tagline: "tagline", announcement: "announcement_text", pausedMessage: "paused_message", whatsappMessage: "whatsapp_message" } as const;
  const english = (row[column[key]] ?? "").trim();
  if (locale === "en") return english;
  return (row.translations?.[locale]?.[key] ?? "").trim() || english;
}

export function toShopProfile(row: ShopSettingsRow, locale: Locale): ShopProfile {
  const name = row.business_name?.trim() || "Toy Shop";
  const whatsappNumber = (row.whatsapp_number ?? "").trim();
  const announcementText = localizedShopText(row, "announcement", locale);
  const social = [
    { label: "Instagram", icon: "📸", url: row.instagram_url ?? "" },
    { label: "Facebook", icon: "👍", url: row.facebook_url ?? "" },
    { label: "YouTube", icon: "▶️", url: row.youtube_url ?? "" },
  ].filter((item) => item.url);
  return {
    name,
    legalName: row.legal_name?.trim() || name,
    tagline: localizedShopText(row, "tagline", locale),
    logoUrl: shopImageUrl(row.logo_path),
    logoEmoji: row.logo_emoji?.trim() || "🧸",
    showNameWithLogo: row.show_name_with_logo ?? true,
    phone: row.business_phone?.trim() ?? "",
    email: row.business_email?.trim() ?? "",
    address: row.business_address?.trim() ?? "",
    state: row.business_state?.trim() ?? "",
    whatsapp:
      row.whatsapp_enabled && whatsappNumber
        ? { number: whatsappNumber, message: localizedShopText(row, "whatsappMessage", locale) }
        : null,
    social,
    grievanceOfficer: row.grievance_officer?.trim() ?? "",
    announcement:
      row.announcement_enabled && announcementText
        ? {
            text: announcementText,
            link: row.announcement_link?.trim() ?? "",
            color: isThemeColor(row.announcement_color ?? "") ? (row.announcement_color as ThemeColor) : "sunshine",
          }
        : null,
    paused: row.ordering_paused ? { message: localizedShopText(row, "pausedMessage", locale) } : null,
    gstMode: gstModeOf(row),
    gstin: row.gstin?.trim() ?? "",
    returnDays: row.return_days ?? 7,
    deliveryFeePaise: row.delivery_fee_paise ?? 4900,
    freeDeliveryAbovePaise: row.free_delivery_above_paise ?? 49900,
  };
}

// For the owner area and invoices: always fresh.
export async function readShopSettings(supabase: SupabaseClient): Promise<ShopSettingsRow> {
  const { data } = await supabase.from("shop_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? {}) as ShopSettingsRow;
}

// For shop pages: cached like the toy list, refreshed whenever the owner saves.
const loadShopSettings = unstable_cache(
  async (): Promise<ShopSettingsRow> => {
    if (!isSupabaseConfigured()) return {};
    const { data, error } = await publicClient().from("shop_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(`Couldn't load the shop settings: ${error.message}`);
    return (data ?? {}) as ShopSettingsRow;
  },
  ["shop-settings"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export async function getShopProfile(locale: Locale = "en"): Promise<ShopProfile> {
  return toShopProfile(await loadShopSettings(), locale);
}
