import "server-only";
import { unstable_cache } from "next/cache";
import { formatIndianMobile, formatPaise, type Locale } from "@toyshop/shared";
import { CATALOG_TAG, publicClient } from "@/lib/shop";
import { fillPlaceholders, PAGE_DRAFTS, type PageSlug, type PlaceholderKey } from "@/lib/policyDrafts";
import type { ShopProfile } from "@/lib/shopProfile";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type ShopPageRow = {
  slug: PageSlug;
  title: string;
  body: string;
  translations: Partial<Record<"ta" | "hi", { title?: string; body?: string }>> | null;
  updated_at: string;
};

// The data API's answers when the shop_pages table doesn't exist yet
// (before 0008_shop_identity.sql has been run).
export function isMissingTable(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "PGRST202";
}

const loadPageRows = unstable_cache(
  async (): Promise<ShopPageRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await publicClient().from("shop_pages").select("*");
    if (isMissingTable(error)) return [];
    if (error) throw new Error(`Couldn't load the shop pages: ${error.message}`);
    return (data ?? []) as ShopPageRow[];
  },
  ["shop-pages"],
  { tags: [CATALOG_TAG], revalidate: 3600 },
);

export function placeholderValues(profile: ShopProfile): Record<PlaceholderKey, string> {
  return {
    shop_name: profile.name,
    legal_name: profile.legalName,
    phone: profile.phone,
    email: profile.email,
    whatsapp: profile.whatsapp ? formatIndianMobile(profile.whatsapp.number) : profile.phone,
    address: profile.address.replace(/\s*\n\s*/g, ", "),
    state: profile.state,
    grievance_officer: profile.grievanceOfficer || profile.legalName,
    return_days: String(profile.returnDays),
    delivery_fee: profile.deliveryFeePaise > 0 ? formatPaise(profile.deliveryFeePaise) : formatPaise(0),
    free_delivery_above: formatPaise(profile.freeDeliveryAbovePaise),
  };
}

export type ShopPage = {
  title: string;
  body: string;
  // The language the text is actually in (English when no translation exists).
  lang: Locale;
  updatedAt: string | null;
};

export async function getShopPage(slug: PageSlug, locale: Locale, profile: ShopProfile): Promise<ShopPage> {
  const row = (await loadPageRows()).find((item) => item.slug === slug);
  const english = { title: row?.title?.trim() || PAGE_DRAFTS[slug].title, body: row?.body?.trim() || PAGE_DRAFTS[slug].body };
  const translated = locale === "en" ? null : row?.translations?.[locale];
  const useTranslation = Boolean(translated?.body?.trim());
  const values = placeholderValues(profile);
  return {
    title: useTranslation ? translated?.title?.trim() || english.title : english.title,
    body: fillPlaceholders(useTranslation ? translated!.body!.trim() : english.body, values),
    lang: useTranslation ? locale : "en",
    updatedAt: row?.updated_at ?? null,
  };
}
