"use server";

import { revalidatePath } from "next/cache";
import type { CartLine } from "@toyshop/shared";
import { quoteCart, type Quote } from "@/lib/orders";
import { createRazorpayOrder, isRazorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RazorpayCheckout = {
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  orderNumber: string;
  prefill: { name: string; email: string; contact: string };
};

export type PlaceOrderResult =
  | { error: string; quote?: Quote }
  | { orderId: string; razorpay?: RazorpayCheckout };

export async function quoteCheckout(cart: CartLine[]): Promise<Quote> {
  const supabase = await createClient();
  return quoteCart(supabase, cart);
}

export async function placeOrder(input: {
  cart: CartLine[];
  addressId: string;
  paymentMethod: "razorpay" | "cod";
  // Totals the customer saw; if prices changed meanwhile we ask them to check again.
  expectedTotalPaise: number;
}): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again to place your order." };
  if (!isAdminConfigured()) return { error: "Ordering isn't switched on yet. Please try again later." };

  const quote = await quoteCart(supabase, input.cart);
  const lines = quote.lines.filter((line) => line.quantity > 0);
  if (lines.length === 0) return { error: "Your cart is empty.", quote };
  if (quote.hasProblems || quote.totalPaise !== input.expectedTotalPaise) {
    return { error: "Some prices or stock changed. Please check your order again.", quote };
  }

  if (input.paymentMethod === "cod") {
    if (!quote.settings.codEnabled) return { error: "Cash on delivery isn't available right now.", quote };
    if (quote.totalPaise > quote.settings.codMaxPaise) {
      return { error: "This order is too large for cash on delivery. Please pay online.", quote };
    }
  } else if (!isRazorpayConfigured()) {
    return { error: "Online payment isn't available yet. Please choose cash on delivery.", quote };
  }

  const { data: address } = await supabase
    .from("addresses")
    .select("full_name, phone, line1, line2, landmark, city, state, pincode")
    .eq("id", input.addressId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!address) return { error: "Please choose a delivery address." };

  const admin = createAdminClient();
  const isCod = input.paymentMethod === "cod";
  const now = new Date().toISOString();

  // A new attempt replaces any earlier one whose payment was never finished.
  // (If such a payment still arrives later, the webhook marks that order paid.)
  await admin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "pending_payment")
    .eq("payment_status", "pending");
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      payment_method: input.paymentMethod,
      status: isCod ? "placed" : "pending_payment",
      placed_at: isCod ? now : null,
      subtotal_paise: quote.subtotalPaise,
      delivery_paise: quote.deliveryPaise,
      total_paise: quote.totalPaise,
      ship_name: address.full_name,
      ship_phone: address.phone,
      ship_line1: address.line1,
      ship_line2: address.line2,
      ship_landmark: address.landmark,
      ship_city: address.city,
      ship_state: address.state,
      ship_pincode: address.pincode,
      contact_email: user.email ?? "",
    })
    .select("id, order_number")
    .single();
  if (orderError || !order) return { error: "Couldn't place your order. Please try again." };

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map((line) => ({
      order_id: order.id,
      product_id: line.productId,
      name: line.name,
      slug: line.slug,
      image_path: line.imagePath,
      unit_price_paise: line.unitPricePaise,
      mrp_paise: line.mrpPaise,
      gst_rate: line.gstRate,
      quantity: line.quantity,
      line_total_paise: line.lineTotalPaise,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", order.id);
    return { error: "Couldn't place your order. Please try again." };
  }

  if (isCod) {
    await admin.rpc("confirm_order_stock", { p_order_id: order.id });
    revalidatePath("/", "layout");
    return { orderId: order.id };
  }

  try {
    const razorpay = await startRazorpayPayment(admin, order.id, order.order_number, quote.totalPaise, {
      name: address.full_name,
      email: user.email ?? "",
      contact: address.phone,
    });
    return { orderId: order.id, razorpay };
  } catch {
    // The order stays "waiting for payment"; the customer can pay from the order page.
    return { orderId: order.id };
  }
}

async function startRazorpayPayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  orderNumber: string,
  totalPaise: number,
  prefill: RazorpayCheckout["prefill"],
): Promise<RazorpayCheckout> {
  const razorpayOrder = await createRazorpayOrder({
    amountPaise: totalPaise,
    receipt: orderNumber,
    notes: { order_id: orderId, order_number: orderNumber },
  });
  await admin.from("orders").update({ razorpay_order_id: razorpayOrder.id }).eq("id", orderId);
  return {
    keyId: razorpayKeyId(),
    razorpayOrderId: razorpayOrder.id,
    amountPaise: totalPaise,
    orderNumber,
    prefill,
  };
}

// "Pay now" for an order that is still waiting for payment.
export async function payExistingOrder(orderId: string): Promise<{ error: string } | { razorpay: RazorpayCheckout }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };
  if (!isAdminConfigured() || !isRazorpayConfigured()) return { error: "Online payment isn't available right now." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total_paise, payment_method, payment_status, status, razorpay_order_id, ship_name, ship_phone")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order || order.payment_method !== "razorpay" || order.payment_status !== "pending" || order.status !== "pending_payment") {
    return { error: "This order doesn't need a payment." };
  }

  const prefill = { name: order.ship_name, email: user.email ?? "", contact: order.ship_phone };
  if (order.razorpay_order_id) {
    return {
      razorpay: {
        keyId: razorpayKeyId(),
        razorpayOrderId: order.razorpay_order_id,
        amountPaise: order.total_paise,
        orderNumber: order.order_number,
        prefill,
      },
    };
  }
  try {
    return {
      razorpay: await startRazorpayPayment(createAdminClient(), order.id, order.order_number, order.total_paise, prefill),
    };
  } catch {
    return { error: "Couldn't start the payment. Please try again in a minute." };
  }
}
