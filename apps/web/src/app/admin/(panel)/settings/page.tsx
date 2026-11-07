import { paiseToRupeesInput } from "@toyshop/shared";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/ui";
import { getShopSettings } from "@/lib/orders";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const settings = await getShopSettings(supabase);
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
        }}
      />
    </div>
  );
}
