import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SHOP_SETTINGS,
  deliveryFeeFor,
  MAX_QTY_PER_TOY,
  type CartLine,
  type ShopSettings,
} from "@toyshop/shared";
import { productImageUrl } from "@/lib/catalog";

export async function getShopSettings(supabase: SupabaseClient): Promise<ShopSettings> {
  const { data } = await supabase
    .from("shop_settings")
    .select("delivery_fee_paise, free_delivery_above_paise, cod_enabled, cod_max_paise")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULT_SHOP_SETTINGS;
  return {
    deliveryFeePaise: data.delivery_fee_paise,
    freeDeliveryAbovePaise: data.free_delivery_above_paise,
    codEnabled: data.cod_enabled,
    codMaxPaise: data.cod_max_paise,
  };
}

export type QuoteLine = {
  productId: string;
  name: string;
  slug: string;
  imagePath: string;
  imageUrl: string | null;
  unitPricePaise: number;
  mrpPaise: number | null;
  gstRate: number;
  stock: number;
  requested: number;
  quantity: number;
  lineTotalPaise: number;
  // Why the line can't be ordered as asked, if it can't.
  problem: null | "unavailable" | "sold_out" | "reduced";
};

export type Quote = {
  lines: QuoteLine[];
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  settings: ShopSettings;
  hasProblems: boolean;
};

// Turns a cart (toy ids + quantities) into real prices and stock from the
// database. Toys that are hidden, deleted or sold out are flagged, never priced.
export async function quoteCart(supabase: SupabaseClient, cart: CartLine[]): Promise<Quote> {
  const wanted = new Map<string, number>();
  for (const line of cart.slice(0, 50)) {
    if (typeof line?.productId !== "string" || !/^[0-9a-f-]{36}$/i.test(line.productId)) continue;
    const qty = Math.floor(Number(line.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    wanted.set(line.productId, Math.min((wanted.get(line.productId) ?? 0) + qty, MAX_QTY_PER_TOY));
  }

  const ids = [...wanted.keys()];
  const [settings, { data }] = await Promise.all([
    getShopSettings(supabase),
    ids.length
      ? supabase
          .from("products")
          .select("id, name, slug, price_paise, mrp_paise, gst_rate, stock, status, product_images(storage_path, position)")
          .in("id", ids)
          .eq("status", "published")
      : Promise.resolve({ data: [] as never[] }),
  ]);

  type Row = {
    id: string;
    name: string;
    slug: string;
    price_paise: number;
    mrp_paise: number | null;
    gst_rate: number;
    stock: number;
    product_images: { storage_path: string; position: number }[];
  };
  const byId = new Map(((data ?? []) as Row[]).map((row) => [row.id, row]));

  const lines: QuoteLine[] = ids.map((id) => {
    const requested = wanted.get(id)!;
    const row = byId.get(id);
    if (!row) {
      return {
        productId: id, name: "This toy is no longer available", slug: "", imagePath: "", imageUrl: null,
        unitPricePaise: 0, mrpPaise: null, gstRate: 0, stock: 0, requested, quantity: 0, lineTotalPaise: 0,
        problem: "unavailable",
      };
    }
    const cover = [...(row.product_images ?? [])].sort((a, b) => a.position - b.position)[0];
    const quantity = Math.min(requested, row.stock, MAX_QTY_PER_TOY);
    return {
      productId: id,
      name: row.name,
      slug: row.slug,
      imagePath: cover?.storage_path ?? "",
      imageUrl: cover ? productImageUrl(cover.storage_path) : null,
      unitPricePaise: row.price_paise,
      mrpPaise: row.mrp_paise,
      gstRate: row.gst_rate,
      stock: row.stock,
      requested,
      quantity,
      lineTotalPaise: quantity * row.price_paise,
      problem: row.stock <= 0 ? "sold_out" : quantity < requested ? "reduced" : null,
    };
  });

  const subtotalPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  const deliveryPaise = deliveryFeeFor(subtotalPaise, settings);
  return {
    lines,
    subtotalPaise,
    deliveryPaise,
    totalPaise: subtotalPaise + deliveryPaise,
    settings,
    hasProblems: lines.some((line) => line.problem !== null),
  };
}

// Marks an order as paid (safe to call more than once) and takes its toys out
// of stock. Used after Razorpay Checkout and by the Razorpay webhook.
export async function markOrderPaid(
  admin: SupabaseClient,
  where: { orderId?: string; razorpayOrderId?: string },
  paymentId: string,
): Promise<string | null> {
  let query = admin
    .from("orders")
    .update({
      payment_status: "paid",
      status: "placed",
      razorpay_payment_id: paymentId,
      paid_at: new Date().toISOString(),
      placed_at: new Date().toISOString(),
    })
    .eq("payment_method", "razorpay")
    .eq("payment_status", "pending");
  if (where.orderId) query = query.eq("id", where.orderId);
  if (where.razorpayOrderId) query = query.eq("razorpay_order_id", where.razorpayOrderId);

  const { data } = await query.select("id");
  const id = data?.[0]?.id as string | undefined;
  if (id) await admin.rpc("confirm_order_stock", { p_order_id: id });
  return id ?? null;
}
