import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPaise, ORDER_STATUS_LABELS, type OrderStatus } from "@toyshop/shared";
import { Badge, buttonClasses, Card, TobySays } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My orders · Toy Shop", robots: { index: false } };

const statusColor = {
  pending_payment: "orange",
  placed: "sky",
  packed: "grape",
  shipped: "sunshine",
  delivered: "mint",
  cancelled: "ink",
} as const;

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/orders");

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total_paise, created_at, order_items(quantity)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as {
    id: string;
    order_number: string;
    status: OrderStatus;
    total_paise: number;
    created_at: string;
    order_items: { quantity: number }[];
  }[];

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/account" className="text-sm font-bold text-sky-dark">
          ← My account
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">📦 My orders</h1>
      </div>
      {orders.length === 0 ? (
        <TobySays
          title="No orders yet"
          action={
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              Start shopping 🧸
            </Link>
          }
        >
          Your orders will show up here.
        </TobySays>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const status = ORDER_STATUS_LABELS[order.status];
            const count = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <li key={order.id}>
                <Link href={`/account/orders/${order.id}`} className="block rounded-bubble transition hover:-translate-y-0.5">
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-heading text-xl">Order {order.order_number}</p>
                      <p className="text-sm text-ink-soft">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {count} {count === 1 ? "toy" : "toys"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge color={statusColor[order.status]}>
                        {status.icon} {status.label}
                      </Badge>
                      <span className="font-heading text-xl">{formatPaise(order.total_paise)}</span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
