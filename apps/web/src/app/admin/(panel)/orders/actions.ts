"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth";
import {
  cancelOrder,
  completeReturn,
  MANAGED_ORDER_FIELDS,
  type ActionResult,
  type ManagedOrder,
} from "@/lib/orderAdmin";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

async function loadForOwner(orderId: string) {
  await requireOwner();
  if (!isAdminConfigured()) throw new Error("SUPABASE_SECRET_KEY is not set");
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select(MANAGED_ORDER_FIELDS).eq("id", orderId).maybeSingle();
  return { admin, order: data as ManagedOrder | null };
}

function refresh(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/", "layout");
}

const NEXT_STEP: Record<string, "packed" | "shipped" | "delivered"> = {
  placed: "packed",
  packed: "shipped",
  shipped: "delivered",
};

export async function advanceOrder(
  orderId: string,
  to: "packed" | "shipped" | "delivered",
  shipping?: { courierName: string; trackingNumber: string; trackingUrl: string },
): Promise<ActionResult> {
  const { admin, order } = await loadForOwner(orderId);
  if (!order) return { error: "Order not found." };
  if (NEXT_STEP[order.status] !== to) return { error: "This order has already moved on. Please refresh." };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { status: to, [`${to}_at`]: now };
  if (to === "shipped" && shipping) {
    const url = shipping.trackingUrl.trim();
    if (url && !/^https:\/\/[^\s]+$/i.test(url)) return { error: "The tracking link should start with https://" };
    update.courier_name = shipping.courierName.trim().slice(0, 60);
    update.tracking_number = shipping.trackingNumber.trim().slice(0, 60);
    update.tracking_url = url.slice(0, 300);
  }
  // Cash on delivery is collected when the toys are handed over.
  if (to === "delivered" && order.payment_method === "cod" && order.payment_status === "pending") {
    update.payment_status = "paid";
    update.paid_at = now;
  }

  await admin.from("orders").update(update).eq("id", orderId).eq("status", order.status);
  refresh(orderId);
  return { ok: true };
}

export async function cancelOrderAsOwner(orderId: string, reason: string): Promise<ActionResult> {
  const { admin, order } = await loadForOwner(orderId);
  if (!order) return { error: "Order not found." };
  const result = await cancelOrder(admin, order, "owner", reason || "Cancelled by the shop");
  refresh(orderId);
  return result;
}

export async function updateReturn(orderId: string, action: "approve" | "reject" | "complete"): Promise<ActionResult> {
  const { admin, order } = await loadForOwner(orderId);
  if (!order) return { error: "Order not found." };

  let result: ActionResult = { ok: true };
  if (action === "complete") {
    result = await completeReturn(admin, order);
  } else if (order.return_status === "requested") {
    await admin
      .from("orders")
      .update({ return_status: action === "approve" ? "approved" : "rejected" })
      .eq("id", orderId);
  } else {
    result = { error: "There's no return request to answer." };
  }
  refresh(orderId);
  return result;
}

export async function saveOwnerNote(orderId: string, note: string): Promise<ActionResult> {
  const { admin, order } = await loadForOwner(orderId);
  if (!order) return { error: "Order not found." };
  await admin.from("orders").update({ owner_note: note.slice(0, 1000) }).eq("id", orderId);
  refresh(orderId);
  return { ok: true };
}
