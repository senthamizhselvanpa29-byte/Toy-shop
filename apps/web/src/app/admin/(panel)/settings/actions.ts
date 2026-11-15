"use server";

import { revalidatePath } from "next/cache";
import { parseRupeesToPaise } from "@toyshop/shared";
import { requireOwner } from "@/lib/auth";
import { refreshCatalog } from "@/lib/revalidate";

export type SettingsInput = {
  deliveryFee: string;
  freeDeliveryAbove: string;
  codEnabled: boolean;
  codMax: string;
  returnDays: string;
};

// Shop pages are kept ready-made so they open fast. Saving anything in the
// owner area rebuilds them; this does the same by hand.
export async function refreshShopPages(): Promise<{ ok: true }> {
  await requireOwner();
  refreshCatalog();
  return { ok: true };
}

export async function saveShopSettings(input: SettingsInput): Promise<{ errors?: Record<string, string>; ok?: boolean }> {
  const { supabase } = await requireOwner();
  const errors: Record<string, string> = {};
  const deliveryFee = parseRupeesToPaise(input.deliveryFee);
  const freeAbove = parseRupeesToPaise(input.freeDeliveryAbove || "0");
  const codMax = parseRupeesToPaise(input.codMax);
  if (deliveryFee === null) errors.deliveryFee = "Enter an amount like 49 (or 0 for free delivery)";
  if (freeAbove === null) errors.freeDeliveryAbove = "Enter an amount like 499 (or 0 to turn off)";
  if (codMax === null) errors.codMax = "Enter an amount like 5000";
  const returnDays = Number(input.returnDays);
  if (!Number.isInteger(returnDays) || returnDays < 0 || returnDays > 60) errors.returnDays = "Enter a number of days from 0 to 60";
  if (Object.keys(errors).length) return { errors };

  const { error } = await supabase
    .from("shop_settings")
    .update({
      delivery_fee_paise: deliveryFee,
      free_delivery_above_paise: freeAbove,
      cod_enabled: input.codEnabled,
      cod_max_paise: codMax,
      return_days: returnDays,
    })
    .eq("id", 1);
  if (error) return { errors: { form: "Couldn't save. Please try again." } };

  revalidatePath("/admin/settings");
  refreshCatalog();
  return { ok: true };
}
