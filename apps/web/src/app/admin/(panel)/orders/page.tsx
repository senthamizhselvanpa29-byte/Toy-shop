import Link from "next/link";
import { formatPaise, ORDER_STATUS_LABELS, type OrderStatus } from "@toyshop/shared";
import { Badge, Card, Input, TobySays } from "@/components/ui";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_method: "razorpay" | "cod";
  payment_status: string;
  return_status: string;
  stock_short: boolean;
  total_paise: number;
  ship_name: string;
  ship_city: string;
  placed_at: string;
  order_items: { quantity: number }[];
};

const TABS = [
  { id: "placed", label: "📥 To pack", match: (o: Row) => o.status === "placed" },
  { id: "packed", label: "📦 Packed", match: (o: Row) => o.status === "packed" },
  { id: "shipped", label: "🚚 Shipped", match: (o: Row) => o.status === "shipped" },
  { id: "delivered", label: "🏠 Delivered", match: (o: Row) => o.status === "delivered" && !["requested", "approved"].includes(o.return_status) },
  { id: "returns", label: "↩️ Returns", match: (o: Row) => ["requested", "approved"].includes(o.return_status) },
  { id: "cancelled", label: "✖️ Cancelled", match: (o: Row) => o.status === "cancelled" },
  { id: "all", label: "All", match: () => true },
] as const;

const statusColor = {
  pending_payment: "orange",
  placed: "sky",
  packed: "grape",
  shipped: "sunshine",
  delivered: "mint",
  cancelled: "ink",
} as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = "placed", q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, payment_method, payment_status, return_status, stock_short, total_paise, ship_name, ship_city, placed_at, order_items(quantity)")
    // Unfinished payment attempts aren't real orders.
    .not("placed_at", "is", null)
    .order("placed_at", { ascending: false })
    .limit(2000);
  const search = q.replace(/[^\p{L}\p{N}\s+-]/gu, " ").trim().slice(0, 40);
  if (search) {
    query = query.or(`order_number.ilike.%${search}%,ship_name.ilike.%${search}%,ship_phone.ilike.%${search}%`);
  }
  const { data } = await query;
  const all = (data ?? []) as Row[];

  const active = TABS.find((item) => item.id === tab) ?? TABS[0];
  const orders = all.filter(active.match);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">📦 Orders</h1>
        <p className="text-ink-soft">Pack, ship and deliver — the customer sees every step.</p>
      </div>

      <form className="flex flex-wrap items-center gap-3" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by order number, name or phone…"
          aria-label="Search orders"
          className="max-w-sm flex-1"
        />
        <input type="hidden" name="tab" value={active.id} />
      </form>

      <nav aria-label="Order status" className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const count = all.filter(item.match).length;
          return (
            <Link
              key={item.id}
              href={{ query: { tab: item.id, ...(search ? { q: search } : {}) } }}
              aria-current={item.id === active.id ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold",
                item.id === active.id ? "border-sunshine-dark bg-sunshine" : "border-ink/15 bg-white hover:border-ink/30",
              )}
            >
              {item.label}
              <span className="rounded-full bg-ink/10 px-2 text-xs">{count}</span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <Card>
          <TobySays title={search ? "No orders match that search" : "Nothing here right now"}>
            {active.id === "placed" ? "New orders to pack will appear here. 🎉" : "Try another tab."}
          </TobySays>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const count = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
            const status = ORDER_STATUS_LABELS[order.status];
            return (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="block rounded-bubble transition hover:-translate-y-0.5">
                  <Card className="flex flex-wrap items-center gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-heading text-xl">
                        {order.order_number}
                        <span className="ml-2 font-body text-base text-ink-soft">· {order.ship_name}, {order.ship_city}</span>
                      </p>
                      <p className="text-sm text-ink-soft">
                        {new Date(order.placed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        {" · "}
                        {count} {count === 1 ? "toy" : "toys"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.stock_short && <Badge color="bubblegum">⚠️ Stock problem</Badge>}
                      {["requested", "approved"].includes(order.return_status) && <Badge color="orange">↩️ Return</Badge>}
                      <Badge color={statusColor[order.status]}>
                        {status.icon} {status.label}
                      </Badge>
                      <Badge color={order.payment_status === "paid" ? "mint" : order.payment_status === "refunded" ? "grape" : "sunshine"}>
                        {order.payment_status === "paid"
                          ? "Paid"
                          : order.payment_status === "refunded"
                            ? "Refunded"
                            : order.payment_method === "cod"
                              ? "💵 COD"
                              : "Unpaid"}
                      </Badge>
                      <span className="w-24 text-right font-heading text-xl">{formatPaise(order.total_paise)}</span>
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
