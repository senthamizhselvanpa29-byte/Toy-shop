"use server";

import { revalidatePath } from "next/cache";
import { cancelOrder, MANAGED_ORDER_FIELDS, type ActionResult, type ManagedOrder } from "@/lib/orderAdmin";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { refreshCatalog } from "@/lib/revalidate";

// Loads one of the signed-in customer's own orders (the database rules make
// sure nobody can load someone else's).
async function loadOwnOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminConfigured()) return { order: null };
  const { data } = await supabase
    .from("orders")
    .select(MANAGED_ORDER_FIELDS)
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  return { order: data as ManagedOrder | null };
}

function refresh(orderId: string) {
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  refreshCatalog();
}

export async function cancelMyOrder(orderId: string, reason: string): Promise<ActionResult> {
  const { order } = await loadOwnOrder(orderId);
  if (!order) return { error: "err.orderNotFound" };
  // Once packed, the shop handles cancellations.
  if (order.status !== "placed") {
    return { error: "err.alreadyPacked" };
  }
  const result = await cancelOrder(createAdminClient(), order, "customer", reason || "Cancelled by customer");
  refresh(orderId);
  return result;
}

export async function requestReturn(orderId: string, reason: string): Promise<ActionResult> {
  const { order } = await loadOwnOrder(orderId);
  if (!order) return { error: "err.orderNotFound" };
  if (order.status !== "delivered" || !order.delivered_at) return { error: "err.returnNotDelivered" };
  if (order.return_status !== "none") return { error: "err.returnAlready" };
  if (!reason.trim()) return { error: "err.returnReason" };

  const admin = createAdminClient();
  const { data: settings } = await admin.from("shop_settings").select("return_days").eq("id", 1).maybeSingle();
  const days = settings?.return_days ?? 7;
  const deadline = new Date(order.delivered_at).getTime() + days * 24 * 60 * 60 * 1000;
  if (Date.now() > deadline) return { error: "err.returnWindow", vars: { days } };

  await admin
    .from("orders")
    .update({ return_status: "requested", return_reason: reason.trim().slice(0, 300), return_requested_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("return_status", "none");
  refresh(orderId);
  return { ok: true, notice: "order.returnRequested" };
}
