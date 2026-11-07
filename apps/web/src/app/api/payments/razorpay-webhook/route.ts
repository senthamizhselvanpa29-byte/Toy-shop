import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { isValidWebhookSignature } from "@/lib/razorpay";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

// Razorpay calls this directly when a payment succeeds, so orders are marked
// paid even if the customer closed the browser before returning to the shop.
// Set it up in Razorpay → Settings → Webhooks with the "payment.captured" and
// "order.paid" events and the same secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!isValidWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!isAdminConfigured()) return NextResponse.json({ ok: false }, { status: 503 });

  const event = JSON.parse(raw);
  if (event?.event === "payment.captured" || event?.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
    if (razorpayOrderId && payment?.id) {
      const updated = await markOrderPaid(createAdminClient(), { razorpayOrderId }, payment.id);
      if (updated) revalidatePath("/", "layout");
    }
  }
  return NextResponse.json({ ok: true });
}
