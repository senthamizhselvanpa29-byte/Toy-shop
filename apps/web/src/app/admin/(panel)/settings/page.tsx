import { paiseToRupeesInput } from "@toyshop/shared";
import { RefreshShopButton } from "@/components/admin/RefreshShopButton";
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
    supabase.from("shop_settings").select("return_days").eq("id", 1).maybeSingle(),
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

      <Card className="flex flex-col gap-3">
        <h2 className="text-2xl">⚡ Shop pages</h2>
        <p className="text-ink-soft">
          Your shop pages are kept ready-made so they open fast. They update by themselves whenever you save a toy, a
          category or a setting here. If something ever looks out of date, tap this button.
        </p>
        <RefreshShopButton />
      </Card>

      <SettingsForm
        initial={{
          deliveryFee: paiseToRupeesInput(settings.deliveryFeePaise),
          freeDeliveryAbove: paiseToRupeesInput(settings.freeDeliveryAbovePaise),
          codEnabled: settings.codEnabled,
          codMax: paiseToRupeesInput(settings.codMaxPaise),
          returnDays: String(business?.return_days ?? 7),
        }}
      />
    </div>
  );
}
