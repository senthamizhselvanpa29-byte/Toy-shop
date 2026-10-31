"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addressFormSchema,
  fieldErrors,
  profileFormSchema,
  type AddressFormInput,
  type ProfileFormInput,
} from "@toyshop/shared";
import { createClient } from "@/lib/supabase/server";

export type FormResult = { errors?: Record<string, string>; ok?: boolean };

async function requireCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  return { supabase, user };
}

export async function updateProfile(input: ProfileFormInput): Promise<FormResult> {
  const { supabase, user } = await requireCustomer();
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName || null, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) return { errors: { form: "Couldn't save your details. Please try again." } };

  revalidatePath("/account");
  return { ok: true };
}

export async function saveAddress(addressId: string | null, input: AddressFormInput): Promise<FormResult> {
  const { supabase, user } = await requireCustomer();
  const parsed = addressFormSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const values = parsed.data;

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  // The first address is always the default.
  const makeDefault = values.isDefault || (count ?? 0) === 0 || false;

  if (makeDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  }

  const row = {
    label: values.label,
    full_name: values.fullName,
    phone: values.phone,
    line1: values.line1,
    line2: values.line2,
    landmark: values.landmark,
    city: values.city,
    state: values.state,
    pincode: values.pincode,
    ...(makeDefault ? { is_default: true } : {}),
  };

  const { error } = addressId
    ? await supabase.from("addresses").update(row).eq("id", addressId).eq("user_id", user.id)
    : await supabase.from("addresses").insert(row);
  if (error) return { errors: { form: "Couldn't save the address. Please try again." } };

  revalidatePath("/account");
  return { ok: true };
}

export async function setDefaultAddress(addressId: string) {
  const { supabase, user } = await requireCustomer();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  await supabase.from("addresses").update({ is_default: true }).eq("id", addressId).eq("user_id", user.id);
  revalidatePath("/account");
}

export async function deleteAddress(addressId: string) {
  const { supabase, user } = await requireCustomer();
  const { data: removed } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", user.id)
    .select("is_default");

  // If the default address was removed, the newest remaining one takes over.
  if (removed?.[0]?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("addresses").update({ is_default: true }).eq("id", next.id);
  }
  revalidatePath("/account");
}
