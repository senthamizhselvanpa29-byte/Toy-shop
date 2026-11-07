import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { markOrderPaid } from "@/lib/orders";
import { isValidPaymentSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Razorpay Checkout calls this (from the browser) after a successful payment.
// The signature proves the payment is real; only then is the order marked paid.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const orderId = String(body?.orderId ?? "");
  const razorpayOrderId = String(body?.razorpay_order_id ?? "");
  const paymentId = String(body?.razorpay_payment_id ?? "");
  const signature = String(body?.razorpay_signature ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please log in again." }, { status: 401 });

  const { data: order } = await supabase
    .from("orders")
    .select("id, razorpay_order_id, payment_status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order || order.razorpay_order_id !== razorpayOrderId) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }
  if (order.payment_status === "paid") return NextResponse.json({ ok: true });

  if (!isValidPaymentSignature(razorpayOrderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, error: "We couldn't confirm this payment." }, { status: 400 });
  }

  await markOrderPaid(createAdminClient(), { orderId: order.id }, paymentId);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
