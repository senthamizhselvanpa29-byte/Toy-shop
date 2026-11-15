import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Database updates (supabase/migrations) this version of the website expects,
// oldest first, each with a column that only exists once that file has run.
const UPDATES = [
  { file: "0006_order_management.sql", table: "shop_settings", column: "business_name" },
  { file: "0007_translations.sql", table: "products", column: "translations" },
  { file: "0008_shop_identity.sql", table: "shop_settings", column: "gst_mode" },
] as const;

// 42703: Postgres "column does not exist" (reading). PGRST204: the data API
// can't find the column (writing).
export function isMissingColumn(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703" || error?.code === "PGRST204";
}

// The files the owner still has to run in Supabase → SQL Editor (in this order).
export async function missingDatabaseUpdates(supabase: SupabaseClient): Promise<string[]> {
  const checks = await Promise.all(
    UPDATES.map(async ({ file, table, column }) => {
      const { error } = await supabase.from(table).select(column).limit(1);
      return isMissingColumn(error) ? file : null;
    }),
  );
  return checks.filter((file): file is (typeof UPDATES)[number]["file"] => file !== null);
}

export function databaseUpdateMessage(file: string): string {
  return `Your database needs an update first. Run ${file} in Supabase → SQL Editor, then save again.`;
}
