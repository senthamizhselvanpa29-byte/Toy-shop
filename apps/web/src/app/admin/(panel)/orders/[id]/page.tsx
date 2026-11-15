import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatIndianMobile,
  formatPaise,
  ORDER_STATUS_LABELS,
  RETURN_STATUS_LABELS,
  type OrderStatus,
  type ReturnStatus,
} from "@toyshop/shared";
import { OrderActions } from "@/components/admin/OrderActions";
import { Badge, buttonClasses, Card } from "@/components/ui";
import { productImageUrl } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const when = (value: string | null) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : null;

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(id, name, slug, image_path, unit_price_paise, quantity, line_total_paise)")
    .eq("id", id)
    .not("placed_at", "is", null)
    .maybeSingle();
  if (!order) notFound();

  const status = ORDER_STATUS_LABELS[order.status as OrderStatus];
  const items = order.order_items as {
    id: string;
    name: string;
    slug: string;
    image_path: string;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }[];
  const address = [
    order.ship_line1,
    order.ship_line2,
    order.ship_landmark && `Near ${order.ship_landmark}`,
    `${order.ship_city}, ${order.ship_state} – ${order.ship_pincode}`,
  ]
    .filter(Boolean)
    .join(", ");

  const timeline = [
    { label: "Placed", at: order.placed_at },
    { label: "Paid", at: order.paid_at },
    { label: "Packed", at: order.packed_at },
    { label: "Shipped", at: order.shipped_at },
    { label: "Delivered", at: order.delivered_at },
    { label: `Cancelled by ${order.cancelled_by ?? "shop"}${order.cancel_reason ? ` — “${order.cancel_reason}”` : ""}`, at: order.cancelled_at },
    { label: `Return requested — “${order.return_reason}”`, at: order.return_requested_at },
    { label: `Refunded ${order.refund_paise ? formatPaise(order.refund_paise) : ""}${order.refund_id ? ` (${order.refund_id})` : ""}`, at: order.refunded_at },
  ].filter((step) => step.at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm font-bold text-sky-dark">
            ← All orders
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">Order {order.order_number}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge color="sky">
              {status.icon} {status.label}
            </Badge>
            <Badge color={order.payment_status === "paid" ? "mint" : order.payment_status === "refunded" ? "grape" : "sunshine"}>
              {order.payment_method === "cod" ? "💵 Cash on delivery" : "💳 Online"} ·{" "}
              {order.payment_status === "paid" ? "Paid" : order.payment_status === "refunded" ? "Refunded" : "Not paid yet"}
            </Badge>
            {order.return_status !== "none" && <Badge color="orange">↩️ {RETURN_STATUS_LABELS[order.return_status as ReturnStatus]}</Badge>}
          </div>
        </div>
        <Link href={`/invoice/${order.id}`} target="_blank" className={buttonClasses("secondary")}>
          🧾 Invoice
        </Link>
      </div>

      {order.stock_short && (
        <p role="alert" className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
          ⚠️ A toy in this order sold out before the payment came in. Check your stock, then contact the customer or cancel
          (the payment is refunded automatically).
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <h2 className="text-2xl">🧸 Toys to pack</h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sky/30">
                    {item.image_path && <Image src={productImageUrl(item.image_path)} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{item.name}</span>
                    <span className="block text-sm text-ink-soft">{formatPaise(item.unit_price_paise)} each</span>
                  </span>
                  <span className="rounded-full bg-sunshine px-3 py-1 font-heading text-lg">× {item.quantity}</span>
                  <span className="w-20 text-right font-bold">{formatPaise(item.line_total_paise)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1 border-t-2 border-dashed border-ink/15 pt-3">
              <div className="flex justify-between"><dt>Toys</dt><dd>{formatPaise(order.subtotal_paise)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.delivery_paise ? formatPaise(order.delivery_paise) : "FREE"}</dd></div>
              <div className="flex justify-between font-heading text-xl"><dt>Total</dt><dd>{formatPaise(order.total_paise)}</dd></div>
            </dl>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-2xl">📍 Ship to</h2>
            <p className="text-lg font-bold">{order.ship_name}</p>
            <p>{address}</p>
            <p className="flex flex-wrap gap-3">
              <a href={`tel:${order.ship_phone}`} className={buttonClasses("ghost", "sm")}>
                📞 {formatIndianMobile(order.ship_phone)}
              </a>
              <a
                href={`https://wa.me/${order.ship_phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses("ghost", "sm")}
              >
                💬 WhatsApp
              </a>
              {order.contact_email && (
                <a href={`mailto:${order.contact_email}`} className={buttonClasses("ghost", "sm")}>
                  ✉️ {order.contact_email}
                </a>
              )}
            </p>
            {order.status === "shipped" || order.status === "delivered" ? (
              (order.courier_name || order.tracking_number) && (
                <p className="text-sm text-ink-soft">
                  🚚 {order.courier_name} {order.tracking_number && `· ${order.tracking_number}`}
                </p>
              )
            ) : null}
          </Card>

          <Card>
            <h2 className="text-2xl">🕒 History</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {timeline.map((step) => (
                <li key={step.label} className="flex flex-wrap justify-between gap-2 border-b border-ink/5 pb-2">
                  <span className="font-bold">{step.label}</span>
                  <span className="text-sm text-ink-soft">{when(step.at)}</span>
                </li>
              ))}
            </ol>
            {order.razorpay_payment_id && (
              <p className="mt-3 text-sm text-ink-soft">Razorpay payment: {order.razorpay_payment_id}</p>
            )}
          </Card>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <OrderActions
            orderId={order.id}
            status={order.status}
            paymentMethod={order.payment_method}
            paymentStatus={order.payment_status}
            returnStatus={order.return_status}
            ownerNote={order.owner_note}
            courierName={order.courier_name}
            trackingNumber={order.tracking_number}
            trackingUrl={order.tracking_url}
          />
        </div>
      </div>
    </div>
  );
}
