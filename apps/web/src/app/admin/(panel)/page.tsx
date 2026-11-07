import Link from "next/link";
import { formatPaise } from "@toyshop/shared";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { buttonClasses, Card } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteDemoProducts } from "./products/actions";

async function countProducts(filter: { status?: string; demo?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase.from("products").select("id", { count: "exact", head: true });
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.demo !== undefined) query = query.eq("is_demo", filter.demo);
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ demoRemoved?: string }>;
}) {
  const { demoRemoved } = await searchParams;
  const supabase = await createClient();
  const [viewer, totalProducts, liveProducts, demoProducts, ownProducts, ownLive, lowStock, { count: categoryCount }, { data: orderRows }] =
    await Promise.all([
      getViewer(),
      countProducts(),
      countProducts({ status: "published" }),
      countProducts({ demo: true }),
      countProducts({ demo: false }),
      countProducts({ status: "published", demo: false }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .lte("stock", 5)
        .then(({ count }) => count ?? 0),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("status, return_status, total_paise, placed_at")
        .not("placed_at", "is", null)
        .order("placed_at", { ascending: false })
        .limit(5000),
    ]);

  // "Today" in India, whatever time zone the server runs in.
  const indianDate = (value: string | Date) => new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const today = indianDate(new Date());
  const orders = (orderRows ?? []) as { status: string; return_status: string; total_paise: number; placed_at: string }[];
  const toPack = orders.filter((order) => order.status === "placed").length;
  const openReturns = orders.filter((order) => ["requested", "approved"].includes(order.return_status)).length;
  const todaysOrders = orders.filter((order) => order.status !== "cancelled" && indianDate(order.placed_at) === today);
  const todaysSales = todaysOrders.reduce((sum, order) => sum + order.total_paise, 0);

  const name =
    viewer.status === "owner" && viewer.fullName ? viewer.fullName : "Shop Owner";

  const stats: { label: string; value: string | number; icon: string; href?: string }[] = [
    { label: "Orders to pack", value: toPack, icon: "📥", href: "/admin/orders?tab=placed" },
    { label: `Today's sales (${todaysOrders.length} order${todaysOrders.length === 1 ? "" : "s"})`, value: formatPaise(todaysSales), icon: "💰", href: "/admin/orders?tab=all" },
    { label: "Toys in your shop", value: liveProducts, icon: "🟢" },
    { label: "All toys (incl. drafts)", value: totalProducts, icon: "🧸" },
    { label: "Running low (5 or less)", value: lowStock, icon: "⚠️" },
    { label: "Categories", value: categoryCount ?? 0, icon: "🗂️" },
  ];

  const steps = [
    { done: true, label: "Log in to your owner area" },
    { done: (categoryCount ?? 0) > 0, label: "Set up your toy categories", href: "/admin/categories" },
    { done: ownProducts > 0, label: "Add your first toy with photos", href: "/admin/products/new" },
    { done: ownLive > 0, label: "Publish a toy to the shop", href: "/admin/products" },
    { done: ownProducts > 0 && demoProducts === 0, label: "Replace the demo toys with your own" },
    { done: orders.length > 0, label: "Take your first order", href: "/admin/orders" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">Hello, {name}! 👋</h1>
          <p className="mt-1 text-lg text-ink-soft">
            This is your shop&apos;s control room. Only you can see it.
          </p>
        </div>
        <Link href="/admin/products/new" className={buttonClasses("primary", "lg")}>
          ➕ Add a toy
        </Link>
      </div>

      {demoRemoved && (
        <p role="status" className="rounded-2xl bg-mint/25 px-4 py-3 font-bold text-mint-dark">
          All demo toys removed. The shelves are ready for your own toys! 🧸
        </p>
      )}

      {openReturns > 0 && (
        <Link href="/admin/orders?tab=returns" className="rounded-2xl bg-orange/20 px-4 py-3 font-bold hover:bg-orange/30">
          ↩️ {openReturns} return request{openReturns === 1 ? "" : "s"} waiting for you →
        </Link>
      )}

      {demoProducts > 0 && (
        <Card className="flex flex-col gap-4 border-grape/40 bg-grape/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl">🎭 Your shop has {demoProducts} demo toys</h2>
            <p className="text-ink-soft">
              They make the shop look full while you set up. Edit any demo toy to make it your own,
              or remove them all once your real toys are in.
            </p>
          </div>
          <form action={deleteDemoProducts} className="shrink-0">
            <ConfirmSubmitButton
              variant="danger"
              message={`Remove all ${demoProducts} demo toys? Toys you've edited are kept.`}
            >
              Remove all demo toys
            </ConfirmSubmitButton>
          </form>
        </Card>
      )}

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const card = (
            <Card className="flex h-full flex-col gap-1 p-4">
              <span className="text-2xl" aria-hidden>
                {stat.icon}
              </span>
              <span className="font-heading text-3xl">{stat.value}</span>
              <span className="text-sm text-ink-soft">{stat.label}</span>
            </Card>
          );
          return (
            <li key={stat.label}>
              {stat.href ? (
                <Link href={stat.href} className="block h-full rounded-bubble transition hover:-translate-y-0.5">
                  {card}
                </Link>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>

      <Card>
        <h2 className="text-2xl">Getting started</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-lg">
              <span
                className={
                  step.done
                    ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-mint"
                    : "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/20"
                }
                aria-hidden
              >
                {step.done ? "✓" : ""}
              </span>
              {step.href && !step.done ? (
                <Link href={step.href} className="font-bold text-sky-dark underline underline-offset-2">
                  {step.label}
                </Link>
              ) : (
                <span className={step.done ? "line-through text-ink-soft" : ""}>{step.label}</span>
              )}
              <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
