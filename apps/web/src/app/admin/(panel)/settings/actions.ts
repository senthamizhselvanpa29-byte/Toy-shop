"use server";

import { revalidatePath } from "next/cache";
import { INDIAN_STATES, parseRupeesToPaise } from "@toyshop/shared";
import { requireOwner } from "@/lib/auth";

export type SettingsInput = {
  deliveryFee: string;
  freeDeliveryAbove: string;
  codEnabled: boolean;
  codMax: string;
  businessName: string;
  businessAddress: string;
  businessState: string;
  businessPhone: string;
  businessEmail: string;
  gstin: string;
  returnDays: string;
};

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export async function saveShopSettings(input: SettingsInput): Promise<{ errors?: Record<string, string>; ok?: boolean }> {
  const { supabase } = await requireOwner();
  const errors: Record<string, string> = {};
  const deliveryFee = parseRupeesToPaise(input.deliveryFee);
  const freeAbove = parseRupeesToPaise(input.freeDeliveryAbove || "0");
  const codMax = parseRupeesToPaise(input.codMax);
  if (deliveryFee === null) errors.deliveryFee = "Enter an amount like 49 (or 0 for free delivery)";
  if (freeAbove === null) errors.freeDeliveryAbove = "Enter an amount like 499 (or 0 to turn off)";
  if (codMax === null) errors.codMax = "Enter an amount like 5000";
  const gstin = input.gstin.trim().toUpperCase();
  if (gstin && !GSTIN.test(gstin)) errors.gstin = "A GSTIN has 15 characters, like 33ABCDE1234F1Z5";
  if (!input.businessName.trim()) errors.businessName = "Please enter your shop's name";
  if (!(INDIAN_STATES as readonly string[]).includes(input.businessState)) errors.businessState = "Please pick a state";
  const email = input.businessEmail.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.businessEmail = "Enter a valid email";
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
      business_name: input.businessName.trim().slice(0, 100),
      business_address: input.businessAddress.trim().slice(0, 400),
      business_state: input.businessState,
      business_phone: input.businessPhone.trim().slice(0, 30),
      business_email: email.slice(0, 120),
      gstin,
      return_days: returnDays,
    })
    .eq("id", 1);
  if (error) return { errors: { form: "Couldn't save. Please try again." } };

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
