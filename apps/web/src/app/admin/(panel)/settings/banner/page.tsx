import { BannerForm } from "@/components/admin/settings/BannerForm";
import { NeedsUpdate } from "@/components/admin/settings/NeedsUpdate";
import { readShopSettings } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export default async function BannerSettingsPage() {
  const row = await readShopSettings(await createClient());
  const tr = row.translations ?? {};
  return (
    <>
      <NeedsUpdate row={row} />
      <BannerForm
        initial={{
          announcementEnabled: row.announcement_enabled ?? false,
          announcement: { en: row.announcement_text ?? "", ta: tr.ta?.announcement ?? "", hi: tr.hi?.announcement ?? "" },
          announcementLink: row.announcement_link ?? "",
          announcementColor: row.announcement_color ?? "sunshine",
          orderingPaused: row.ordering_paused ?? false,
          pausedMessage: { en: row.paused_message ?? "", ta: tr.ta?.pausedMessage ?? "", hi: tr.hi?.pausedMessage ?? "" },
        }}
      />
    </>
  );
}
