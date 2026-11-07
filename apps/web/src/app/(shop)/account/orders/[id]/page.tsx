import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  formatIndianMobile,
  formatPaise,
  ORDER_PROGRESS,
  ORDER_STATUS_LABELS,
  RETURN_STATUS_LABELS,
  type OrderStatus,
  type ReturnStatus,
} from "@toyshop/shared";
import { CustomerOrderActions } from "@/components/account/CustomerOrderActions";
import { PayNowButton } from "@/components/cart/PayNowButton";
import { buttonClasses, Card } from "@/components/ui";
import { productImageUrl } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order · Toy Shop", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Order = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: "razorpay" | "cod";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  subtotal_paise: number;
  delivery_paise: number;
  total_paise: number;
  ship_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string;
  ship_landmark: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  created_at: string;
  placed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancelled_by: "customer" | "owner" | null;
  cancel_reason: string;
  courier_name: string;
  tracking_number: string;
  tracking_url: string;
  return_status: ReturnStatus;
  refund_paise: number | null;
  refunded_at: string | null;
  order_items: {
    id: string;
    name: string;
    slug: string;
    image_path: string;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }[];
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; payment?: string }>;
}) {
  const { id } = await params;
  const { placed, payment } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=/account/orders/${id}`);

  const [{ data }, { data: shop }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(id, name, slug, image_path, unit_price_paise, quantity, line_total_paise)")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("shop_settings").select("return_days").eq("id", 1).maybeSingle(),
  ]);
  if (!data) notFound();
  const order = data as Order;

  const waitingForPayment = order.status === "pending_payment";
  const status = ORDER_STATUS_LABELS[order.status];
  const step = ORDER_PROGRESS.indexOf(order.status);
  const stepDates: Record<string, string | null> = {
    placed: order.placed_at,
    packed: order.packed_at,
    shipped: order.shipped_at,
    delivered: order.delivered_at,
  };
  const shortDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
  const returnDays = shop?.return_days ?? 7;
  const returnOpen =
    order.status === "delivered" &&
    order.return_status === "none" &&
    Boolean(order.delivered_at) &&
    Date.now() < new Date(order.delivered_at!).getTime() + returnDays * 24 * 60 * 60 * 1000;

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/account/orders" className="text-sm font-bold text-sky-dark">
          ← My orders
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">Order {order.order_number}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-ink-soft">
            Placed on {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          {order.placed_at && (
            <Link href={`/invoice/${order.id}`} target="_blank" className={buttonClasses("ghost", "sm")}>
              🧾 Invoice
            </Link>
          )}
        </div>
      </div>

      {placed && !waitingForPayment && (
        <div role="status" className="rounded-bubble bg-mint/30 p-6 text-center">
          <p className="text-5xl" aria-hidden>🎉🧸🎈</p>
          <p className="mt-2 font-heading text-2xl">Thank you! Your order is placed.</p>
          <p className="text-ink-soft">We&apos;ll get your toys ready and let you know when they&apos;re on the way.</p>
        </div>
      )}
      {waitingForPayment && (
        <Card className="flex flex-col gap-3 border-orange">
          <p className="font-heading text-xl">
            {payment === "failed"
              ? "⚠️ The payment didn't go through."
              : payment === "closed"
                ? "⏳ You closed the payment window."
                : "⏳ This order is waiting for payment."}
          </p>
          <p className="text-ink-soft">
            No money was taken. Your order is saved — tap below to pay and we&apos;ll start packing.
          </p>
          <PayNowButton orderId={order.id} totalPaise={order.total_paise} />
        </Card>
      )}

      {order.status !== "cancelled" && !waitingForPayment && (
        <Card>
          <ol className="grid grid-cols-4 gap-2 text-center text-sm">
            {ORDER_PROGRESS.map((item, index) => (
              <li key={item} className="flex flex-col items-center gap-1">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-2xl",
                    index <= step ? "bg-mint" : "bg-ink/10 grayscale",
                  )}
                  aria-hidden
                >
                  {ORDER_STATUS_LABELS[item].icon}
                </span>
                <span className={index <= step ? "font-bold" : "text-ink-soft"}>{ORDER_STATUS_LABELS[item].label}</span>
                <span className="text-xs text-ink-soft">{shortDate(stepDates[item])}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      {(order.status === "shipped" || order.status === "delivered") && (order.courier_name || order.tracking_number) && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p>
            🚚 Sent with <strong>{order.courier_name || "our courier"}</strong>
            {order.tracking_number && (
              <>
                {" · "}Tracking number <strong>{order.tracking_number}</strong>
              </>
            )}
          </p>
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noreferrer" className={buttonClasses("secondary", "sm")}>
              Track parcel →
            </a>
          )}
        </Card>
      )}
      {order.status === "cancelled" && (
        <div className="rounded-2xl bg-ink/10 px-4 py-3">
          <p className="font-bold">
            {status.icon} This order was cancelled{order.cancelled_by === "owner" ? " by the shop" : ""}.
            {order.cancel_reason && ` Reason: ${order.cancel_reason}`}
          </p>
          {order.refund_paise ? (
            <p>💸 {formatPaise(order.refund_paise)} refunded{order.payment_method === "razorpay" ? " to your original payment method (usually 5–7 working days)." : "."}</p>
          ) : null}
        </div>
      )}
      {order.return_status !== "none" && (
        <p className="rounded-2xl bg-orange/20 px-4 py-3 font-bold">
          ↩️ {RETURN_STATUS_LABELS[order.return_status]}
          {order.return_status === "returned" && order.refund_paise ? ` — ${formatPaise(order.refund_paise)} refunded.` : ""}
        </p>
      )}
      <CustomerOrderActions
        orderId={order.id}
        canCancel={order.status === "placed"}
        canReturn={returnOpen}
        returnDays={returnDays}
        paidOnline={order.payment_method === "razorpay" && order.payment_status === "paid"}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl">Toys</h2>
          <ul className="flex flex-col gap-3">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sky/30">
                  {item.image_path && (
                    <Image src={productImageUrl(item.image_path)} alt="" fill sizes="64px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  {item.slug ? (
                    <Link href={`/toys/${item.slug}`} className="font-bold hover:underline">
                      {item.name}
                    </Link>
                  ) : (
                    <span className="font-bold">{item.name}</span>
                  )}
                  <span className="block text-sm text-ink-soft">
                    {item.quantity} × {formatPaise(item.unit_price_paise)}
                  </span>
                </span>
                <span className="font-bold">{formatPaise(item.line_total_paise)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-1 border-t-2 border-dashed border-ink/15 pt-3">
            <div className="flex justify-between">
              <dt>Toys</dt>
              <dd>{formatPaise(order.subtotal_paise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{order.delivery_paise ? formatPaise(order.delivery_paise) : "FREE"}</dd>
            </div>
            <div className="flex justify-between font-heading text-xl">
              <dt>Total</dt>
              <dd>{formatPaise(order.total_paise)}</dd>
            </div>
          </dl>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="text-xl">📍 Delivering to</h2>
            <address className="mt-2 not-italic leading-relaxed">
              <strong>{order.ship_name}</strong>
              <br />
              {order.ship_line1}
              {order.ship_line2 && `, ${order.ship_line2}`}
              <br />
              {order.ship_landmark && (
                <>
                  Near {order.ship_landmark}
                  <br />
                </>
              )}
              {order.ship_city}, {order.ship_state} – {order.ship_pincode}
              <br />📞 {formatIndianMobile(order.ship_phone)}
            </address>
          </Card>
          <Card>
            <h2 className="text-xl">💳 Payment</h2>
            <p className="mt-2">
              {order.payment_method === "cod" ? "Cash on delivery" : "Online (Razorpay)"}
              {" · "}
              <strong>
                {order.payment_status === "paid"
                  ? "Paid ✓"
                  : order.payment_method === "cod"
                    ? "Pay when it arrives"
                    : order.payment_status === "refunded"
                      ? "Refunded"
                      : "Not paid yet"}
              </strong>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
