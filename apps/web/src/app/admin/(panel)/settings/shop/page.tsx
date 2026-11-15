import { ShopDetailsForm } from "@/components/admin/settings/ShopDetailsForm";
import { NeedsUpdate } from "@/components/admin/settings/NeedsUpdate";
import { readShopSettings } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export default async function ShopSettingsPage() {
  const row = await readShopSettings(await createClient());
  const tr = row.translations ?? {};
  return (
    <>
      <NeedsUpdate row={row} />
      <ShopDetailsForm
        initial={{
          name: row.business_name ?? "Toy Shop",
          tagline: { en: row.tagline ?? "", ta: tr.ta?.tagline ?? "", hi: tr.hi?.tagline ?? "" },
          logoPath: row.logo_path ?? "",
          logoEmoji: row.logo_emoji ?? "🧸",
          showNameWithLogo: row.show_name_with_logo ?? true,
          phone: row.business_phone ?? "",
          email: row.business_email ?? "",
          address: row.business_address ?? "",
          state: row.business_state ?? "Tamil Nadu",
          whatsappEnabled: row.whatsapp_enabled ?? false,
          whatsappNumber: row.whatsapp_number ? row.whatsapp_number.replace(/^\+91/, "") : "",
          whatsappMessage: { en: row.whatsapp_message ?? "", ta: tr.ta?.whatsappMessage ?? "", hi: tr.hi?.whatsappMessage ?? "" },
          instagram: row.instagram_url ?? "",
          facebook: row.facebook_url ?? "",
          youtube: row.youtube_url ?? "",
          grievanceOfficer: row.grievance_officer ?? "",
        }}
      />
    </>
  );
}
