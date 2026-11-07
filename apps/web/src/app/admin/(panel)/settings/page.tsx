import { paiseToRupeesInput } from "@toyshop/shared";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/ui";
import { getShopSettings } from "@/lib/orders";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [settings, { data: business }] = await Promise.all([
    getShopSettings(supabase),
    supabase
      .from("shop_settings")
      .select("business_name, business_address, business_state, business_phone, business_email, gstin, return_days")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  const razorpayMode = process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live_") ? "live" : "test";

  const checks = [
    {
      ok: isAdminConfigured(),
      label: "Ordering switched on",
      help: "Add SUPABASE_SECRET_KEY in Vercel to let customers place orders.",
    },
    {
      ok: isRazorpayConfigured(),
      label: isRazorpayConfigured()
        ? `Online payments connected (Razorpay ${razorpayMode} mode)`
        : "Online payments connected",
      help: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel.",
    },
    {
      ok: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      label: "Payment backup (webhook) connected",
      help: "Add RAZORPAY_WEBHOOK_SECRET in Vercel and the webhook in Razorpay.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">⚙️ Shop settings</h1>
        <p className="text-ink-soft">Delivery charges and payment options for your shop.</p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-2xl">✅ Checkout status</h2>
        <ul className="flex flex-col gap-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-3">
              <span aria-hidden>{check.ok ? "🟢" : "⚪"}</span>
              <span>
                <strong>{check.label}</strong>
                {!check.ok && <span className="block text-sm text-ink-soft">{check.help}</span>}
              </span>
            </li>
          ))}
        </ul>
        {isRazorpayConfigured() && razorpayMode === "test" && (
          <p className="rounded-2xl bg-sunshine/30 px-4 py-3 text-sm">
            🧪 Razorpay is in <strong>test mode</strong>: payments are pretend, no real money moves. Switch to live keys
            when you&apos;re ready to sell.
          </p>
        )}
      </Card>

      <SettingsForm
        initial={{
          deliveryFee: paiseToRupeesInput(settings.deliveryFeePaise),
          freeDeliveryAbove: paiseToRupeesInput(settings.freeDeliveryAbovePaise),
          codEnabled: settings.codEnabled,
          codMax: paiseToRupeesInput(settings.codMaxPaise),
          businessName: business?.business_name ?? "Toy Shop",
          businessAddress: business?.business_address ?? "",
          businessState: business?.business_state ?? "Tamil Nadu",
          businessPhone: business?.business_phone ?? "",
          businessEmail: business?.business_email ?? "",
          gstin: business?.gstin ?? "",
          returnDays: String(business?.return_days ?? 7),
        }}
      />
    </div>
  );
}
