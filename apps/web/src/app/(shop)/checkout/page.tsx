import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Address } from "@/components/account/AddressBook";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout · Toy Shop", robots: { index: false } };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/checkout");

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("id, label, full_name, phone, line1, line2, landmark, city, state, pincode, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-3xl sm:text-4xl">🔒 Checkout</h1>
      <CheckoutForm
        addresses={(addresses ?? []) as Address[]}
        defaultName={profile?.full_name ?? ""}
        defaultPhone={profile?.phone ?? ""}
        onlinePayment={isRazorpayConfigured() && isAdminConfigured()}
        orderingEnabled={isAdminConfigured()}
      />
    </div>
  );
}
