import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvoiceView } from "@/components/invoice/InvoiceView";
import { toInvoiceBusiness, toInvoiceOrder } from "@/lib/invoice";
import { readShopSettings } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A printable invoice for one order. The customer who placed it and the shop
// owner can open it (the database rules hide it from everyone else).
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=/invoice/${id}`);

  const [{ data: order }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(id, name, unit_price_paise, gst_rate, quantity, line_total_paise)")
      .eq("id", id)
      .not("placed_at", "is", null)
      .maybeSingle(),
    readShopSettings(supabase),
  ]);
  if (!order) notFound();

  return <InvoiceView order={toInvoiceOrder(order)} business={toInvoiceBusiness(settings)} />;
}
