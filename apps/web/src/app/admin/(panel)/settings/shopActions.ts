"use server";

import { revalidatePath } from "next/cache";
import { INDIAN_STATES, normalizeIndianMobile } from "@toyshop/shared";
import { requireOwner } from "@/lib/auth";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/catalog";
import { databaseUpdateMessage, isMissingColumn } from "@/lib/dbUpdates";
import { isPageSlug } from "@/lib/policyDrafts";
import { refreshCatalog } from "@/lib/revalidate";
import { isMissingTable } from "@/lib/shopPages";
import { readShopSettings, type ShopSettingsRow, type ShopTextKey, type ShopTranslations } from "@/lib/shopProfile";

type Result = { errors?: Record<string, string>; ok?: boolean; notice?: string };
type Texts = { en: string; ta: string; hi: string };

const UPDATE_NEEDED = databaseUpdateMessage("0008_shop_identity.sql");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const SHOP_IMAGE = (kind: string) => new RegExp(`^shop/${kind}-[0-9a-f-]{36}\\.(webp|png)$`);
const COLORS = ["sunshine", "sky", "bubblegum", "mint", "orange", "grape"];

const clean = (value: string, max: number) => value.trim().slice(0, max);

// Saves some settings columns; tells the owner when the database needs 0008 first.
async function saveColumns(patch: ShopSettingsRow, removedImages: string[] = []): Promise<Result> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("shop_settings").update(patch).eq("id", 1);
  if (isMissingColumn(error)) return { errors: { form: UPDATE_NEEDED } };
  if (error) return { errors: { form: "Couldn't save. Please try again." } };
  // Pictures that were replaced or removed are deleted from storage.
  const unused = removedImages.filter((path) => path.startsWith("shop/"));
  if (unused.length) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(unused);
  revalidatePath("/admin", "layout");
  refreshCatalog();
  return { ok: true };
}

// Tamil/Hindi versions are kept in one box; only the given texts change.
function mergeTranslations(current: ShopTranslations | null | undefined, texts: Partial<Record<ShopTextKey, Texts>>, max: number) {
  const next: ShopTranslations = { ta: { ...current?.ta }, hi: { ...current?.hi } };
  for (const [key, value] of Object.entries(texts) as [ShopTextKey, Texts][]) {
    next.ta![key] = clean(value.ta, max);
    next.hi![key] = clean(value.hi, max);
  }
  return next;
}

// ---------------------------------------------------------------------------
// Shop & contact
// ---------------------------------------------------------------------------
export type ShopDetailsInput = {
  name: string;
  tagline: Texts;
  logoPath: string;
  logoEmoji: string;
  showNameWithLogo: boolean;
  phone: string;
  email: string;
  address: string;
  state: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: Texts;
  instagram: string;
  facebook: string;
  youtube: string;
  grievanceOfficer: string;
};

function checkLink(value: string, site: string, errors: Record<string, string>, key: string) {
  const url = value.trim();
  if (!url) return "";
  if (!/^https:\/\/[^\s/]+\.[^\s]+$/.test(url) || url.length > 200) {
    errors[key] = `Paste the full link to your ${site} page, starting with https://`;
  }
  return url;
}

export async function saveShopDetails(input: ShopDetailsInput): Promise<Result> {
  const { supabase } = await requireOwner();
  const errors: Record<string, string> = {};
  const name = clean(input.name, 60);
  if (!name) errors.name = "Please enter your shop's name";
  const email = input.email.trim();
  if (email && !EMAIL.test(email)) errors.email = "Enter a valid email, like hello@yourshop.in";
  if (!(INDIAN_STATES as readonly string[]).includes(input.state)) errors.state = "Please pick a state";
  const whatsapp = input.whatsappNumber.trim() ? normalizeIndianMobile(input.whatsappNumber) : "";
  if (whatsapp === null) errors.whatsappNumber = "Enter a 10-digit Indian mobile number";
  if (input.whatsappEnabled && !whatsapp && !errors.whatsappNumber) {
    errors.whatsappNumber = "Enter the WhatsApp number to show the chat button";
  }
  if (input.logoPath && !SHOP_IMAGE("logo").test(input.logoPath)) errors.logoPath = "Please upload the logo again";
  const emoji = input.logoEmoji.trim();
  if ([...emoji].length > 8) errors.logoEmoji = "Use one emoji, like 🧸";
  const social = {
    instagram_url: checkLink(input.instagram, "Instagram", errors, "instagram"),
    facebook_url: checkLink(input.facebook, "Facebook", errors, "facebook"),
    youtube_url: checkLink(input.youtube, "YouTube", errors, "youtube"),
  };
  if (Object.keys(errors).length) return { errors };

  const current = await readShopSettings(supabase);
  return saveColumns(
    {
      business_name: name,
      tagline: clean(input.tagline.en, 140),
      logo_path: input.logoPath,
      logo_emoji: emoji || "🧸",
      show_name_with_logo: input.showNameWithLogo,
      business_phone: clean(input.phone, 30),
      business_email: email.slice(0, 120),
      business_address: clean(input.address, 400),
      business_state: input.state,
      whatsapp_enabled: input.whatsappEnabled,
      whatsapp_number: whatsapp ?? "",
      whatsapp_message: clean(input.whatsappMessage.en, 300),
      ...social,
      grievance_officer: clean(input.grievanceOfficer, 80),
      translations: mergeTranslations(current.translations, { tagline: input.tagline, whatsappMessage: input.whatsappMessage }, 300),
    },
    current.logo_path && current.logo_path !== input.logoPath ? [current.logo_path] : [],
  );
}

// ---------------------------------------------------------------------------
// Banner & holiday mode
// ---------------------------------------------------------------------------
export type BannerInput = {
  announcementEnabled: boolean;
  announcement: Texts;
  announcementLink: string;
  announcementColor: string;
  orderingPaused: boolean;
  pausedMessage: Texts;
};

export async function saveBannerSettings(input: BannerInput): Promise<Result> {
  const { supabase } = await requireOwner();
  const errors: Record<string, string> = {};
  if (input.announcementEnabled && !input.announcement.en.trim()) errors.announcement = "Write the message to show, or switch the banner off";
  const link = input.announcementLink.trim();
  if (link && !(/^\/(?!\/)\S*$/.test(link) || /^https:\/\/\S+$/.test(link))) {
    errors.announcementLink = "Use a page of your shop (starting with /, like /toys?category=puzzles) or a full https:// link";
  }
  if (!COLORS.includes(input.announcementColor)) errors.announcementColor = "Pick a colour";
  if (Object.keys(errors).length) return { errors };

  const current = await readShopSettings(supabase);
  const result = await saveColumns({
    announcement_enabled: input.announcementEnabled,
    announcement_text: clean(input.announcement.en, 160),
    announcement_link: link.slice(0, 300),
    announcement_color: input.announcementColor,
    ordering_paused: input.orderingPaused,
    paused_message: clean(input.pausedMessage.en, 240),
    translations: mergeTranslations(current.translations, { announcement: input.announcement, pausedMessage: input.pausedMessage }, 240),
  });
  if (result.ok && input.orderingPaused) {
    result.notice = "Saved ✓ — new orders are paused. Switch it off here when you're back.";
  }
  return result;
}

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
export type InvoiceSettingsInput = {
  legalName: string;
  gstMode: "none" | "regular" | "composition";
  gstin: string;
  hsn: string;
  prefix: string;
  includeYear: boolean;
  // Blank = keep counting as now.
  nextNumber: string;
  notes: string;
  signaturePath: string;
  signatoryName: string;
};

export async function saveInvoiceSettings(input: InvoiceSettingsInput): Promise<Result> {
  const { supabase } = await requireOwner();
  const errors: Record<string, string> = {};
  if (!["none", "regular", "composition"].includes(input.gstMode)) errors.gstMode = "Please choose one";
  const gstin = input.gstin.trim().toUpperCase();
  if (input.gstMode !== "none" && !gstin) errors.gstin = "Enter your GSTIN (15 characters, like 33ABCDE1234F1Z5)";
  else if (gstin && !GSTIN.test(gstin)) errors.gstin = "A GSTIN has 15 characters, like 33ABCDE1234F1Z5";
  const hsn = input.hsn.trim();
  if (!/^\d{4,8}$/.test(hsn)) errors.hsn = "An HSN code has 4 to 8 digits (toys: 9503)";
  const prefix = input.prefix.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,6}$/.test(prefix)) errors.prefix = "Use 1 to 6 letters or numbers, like INV";
  const next = input.nextNumber.trim();
  if (next && !/^\d{1,6}$/.test(next)) errors.nextNumber = "Enter a whole number, like 1 or 101";
  if (input.signaturePath && !SHOP_IMAGE("signature").test(input.signaturePath)) errors.signaturePath = "Please upload the signature again";
  if (Object.keys(errors).length) return { errors };

  const current = await readShopSettings(supabase);
  const result = await saveColumns(
    {
      legal_name: clean(input.legalName, 100),
      gst_mode: input.gstMode,
      gstin,
      default_hsn: hsn,
      invoice_prefix: prefix,
      invoice_fy: input.includeYear,
      invoice_notes: clean(input.notes, 800),
      signature_path: input.signaturePath,
      signatory_name: clean(input.signatoryName, 60),
    },
    current.signature_path && current.signature_path !== input.signaturePath ? [current.signature_path] : [],
  );
  if (!result.ok || !next) return result;

  const { error } = await supabase.rpc("set_next_invoice_number", { p_next: Number(next) });
  if (error?.code === "23505") {
    return { errors: { nextNumber: "That number has already been used in this series. Choose a bigger one." } };
  }
  if (error) return { errors: { nextNumber: "Couldn't change the numbering. Please try again." } };
  revalidatePath("/admin/settings/invoices");
  return result;
}

// ---------------------------------------------------------------------------
// Policy pages
// ---------------------------------------------------------------------------
export type PageInput = {
  slug: string;
  title: Texts;
  body: Texts;
};

export async function saveShopPage(input: PageInput): Promise<Result> {
  const { supabase } = await requireOwner();
  if (!isPageSlug(input.slug)) return { errors: { form: "Unknown page." } };
  const errors: Record<string, string> = {};
  if (!input.title.en.trim()) errors.title = "Please give the page a title";
  if (!input.body.en.trim()) errors.body = "Please write the page (or use the suggested text)";
  if (Object.keys(errors).length) return { errors };
  const translation = (code: "ta" | "hi") => ({ title: clean(input.title[code], 100), body: clean(input.body[code], 20000) });
  const { error } = await supabase.from("shop_pages").upsert({
    slug: input.slug,
    title: clean(input.title.en, 100),
    body: clean(input.body.en, 20000),
    translations: { ta: translation("ta"), hi: translation("hi") },
  });
  if (isMissingTable(error) || isMissingColumn(error)) return { errors: { form: UPDATE_NEEDED } };
  if (error) return { errors: { form: "Couldn't save. Please try again." } };
  revalidatePath("/admin/settings/pages", "layout");
  refreshCatalog();
  return { ok: true };
}

// Goes back to the website's suggested text for a page.
export async function resetShopPage(slug: string): Promise<Result> {
  const { supabase } = await requireOwner();
  if (!isPageSlug(slug)) return { errors: { form: "Unknown page." } };
  const { error } = await supabase.from("shop_pages").delete().eq("slug", slug);
  if (error && !isMissingTable(error)) return { errors: { form: "Couldn't reset. Please try again." } };
  revalidatePath("/admin/settings/pages", "layout");
  refreshCatalog();
  return { ok: true };
}
