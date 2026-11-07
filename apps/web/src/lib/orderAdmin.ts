import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isRazorpayConfigured, refundRazorpayPayment } from "@/lib/razorpay";

export type ManagedOrder = {
  id: string;
  status: string;
  payment_method: "razorpay" | "cod";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  razorpay_payment_id: string | null;
  total_paise: number;
  return_status: string;
  delivered_at: string | null;
  placed_at: string | null;
};

export const MANAGED_ORDER_FIELDS =
  "id, status, payment_method, payment_status, razorpay_payment_id, total_paise, return_status, delivered_at, placed_at";

export type ActionResult = { ok?: boolean; error?: string; notice?: string };

// Gives money back for an order: through Razorpay for online payments, or
// recorded as refunded for cash on delivery (the owner returns the cash).
async function refundOrder(admin: SupabaseClient, order: ManagedOrder): Promise<ActionResult> {
  if (order.payment_status !== "paid") return { ok: true };
  const now = new Date().toISOString();

  if (order.payment_method === "cod") {
    await admin
      .from("orders")
      .update({ payment_status: "refunded", refund_paise: order.total_paise, refunded_at: now })
      .eq("id", order.id);
    return { ok: true, notice: "Marked as refunded — please return the cash or send it by UPI." };
  }

  if (!order.razorpay_payment_id || !isRazorpayConfigured()) {
    return { ok: true, notice: "Couldn't refund automatically. Please refund this payment in your Razorpay dashboard." };
  }
  try {
    const refund = await refundRazorpayPayment(order.razorpay_payment_id);
    await admin
      .from("orders")
      .update({ payment_status: "refunded", refund_id: refund.id, refund_paise: order.total_paise, refunded_at: now })
      .eq("id", order.id);
    return { ok: true, notice: "Refund started — it usually reaches the customer in 5–7 working days." };
  } catch {
    return {
      ok: true,
      notice: "The automatic refund didn't go through. Please refund this payment in your Razorpay dashboard.",
    };
  }
}

// Cancels an order: puts its toys back in stock and refunds any payment.
export async function cancelOrder(
  admin: SupabaseClient,
  order: ManagedOrder,
  by: "customer" | "owner",
  reason: string,
): Promise<ActionResult> {
  if (order.status === "cancelled") return { error: "This order is already cancelled." };
  if (order.status === "delivered") return { error: "Delivered orders can't be cancelled. Use a return instead." };
  if (!order.placed_at) return { error: "This order was never placed." };

  const { data } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: by,
      cancel_reason: reason.slice(0, 200),
    })
    .eq("id", order.id)
    .neq("status", "cancelled")
    .select("id");
  if (!data?.length) return { error: "This order is already cancelled." };

  await admin.rpc("restore_order_stock", { p_order_id: order.id });
  return refundOrder(admin, order);
}

// Finishes a return: toys back in stock and the money refunded.
export async function completeReturn(admin: SupabaseClient, order: ManagedOrder): Promise<ActionResult> {
  if (order.return_status !== "approved" && order.return_status !== "requested") {
    return { error: "There's no open return for this order." };
  }
  await admin.from("orders").update({ return_status: "returned" }).eq("id", order.id);
  await admin.rpc("restore_order_stock", { p_order_id: order.id });
  return refundOrder(admin, order);
}
