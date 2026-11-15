import type { ShopSettingsRow } from "@/lib/shopProfile";

// Before 0008_shop_identity.sql has been run, these settings can't be saved yet.
export function NeedsUpdate({ row }: { row: ShopSettingsRow }) {
  if (row.gst_mode !== undefined) return null;
  return (
    <p role="alert" className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
      ⚠️ Your database needs an update first: run <code>0008_shop_identity.sql</code> in Supabase → SQL Editor, then
      reload this page.
    </p>
  );
}
