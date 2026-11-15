import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { formatIndianMobile, formatPaise, paiseInWords, splitGst } from "@toyshop/shared";
import { PrintButton } from "@/components/shop/PrintButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice · Toy Shop", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Item = {
  id: string;
  name: string;
  unit_price_paise: number;
  gst_rate: number;
  quantity: number;
  line_total_paise: number;
};

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

  const [{ data: order }, { data: shop }] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(id, name, unit_price_paise, gst_rate, quantity, line_total_paise)")
      .eq("id", id)
      .not("placed_at", "is", null)
      .maybeSingle(),
    supabase
      .from("shop_settings")
      .select("business_name, business_address, business_state, business_phone, business_email, gstin, default_hsn")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  if (!order) notFound();

  const business = {
    name: shop?.business_name || "Toy Shop",
    address: shop?.business_address ?? "",
    state: shop?.business_state ?? "",
    phone: shop?.business_phone ?? "",
    email: shop?.business_email ?? "",
    gstin: shop?.gstin ?? "",
    hsn: shop?.default_hsn || "9503",
  };
  const hasGst = Boolean(business.gstin);
  const sameState = business.state.trim().toLowerCase() === String(order.ship_state).trim().toLowerCase();
  const items = order.order_items as Item[];

  // Delivery is taxed like the main item it comes with (the highest GST rate).
  const deliveryRate = Math.max(0, ...items.map((item) => item.gst_rate));
  const rows = [
    ...items.map((item) => ({
      key: item.id,
      name: item.name,
      hsn: business.hsn,
      quantity: item.quantity,
      unit: item.unit_price_paise,
      rate: item.gst_rate,
      total: item.line_total_paise,
    })),
    ...(order.delivery_paise > 0
      ? [{ key: "delivery", name: "Delivery charges", hsn: "996812", quantity: 1, unit: order.delivery_paise, rate: deliveryRate, total: order.delivery_paise }]
      : []),
  ].map((row) => ({ ...row, ...splitGst(row.total, row.rate) }));

  const totals = rows.reduce(
    (sum, row) => ({ taxable: sum.taxable + row.taxablePaise, tax: sum.tax + row.taxPaise }),
    { taxable: 0, tax: 0 },
  );
  const date = new Date(order.placed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <main className="mx-auto max-w-4xl bg-white p-6 text-sm text-ink print:max-w-none print:p-0 sm:p-10">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-ink-soft">Tip: choose “Save as PDF” in the print window to download it.</p>
        <PrintButton />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div>
          <p className="font-heading text-3xl">🧸 {business.name}</p>
          {business.address && <p className="mt-1 max-w-xs whitespace-pre-line">{business.address}</p>}
          {business.state && <p>State: {business.state}</p>}
          {business.phone && <p>Phone: {business.phone}</p>}
          {business.email && <p>Email: {business.email}</p>}
          {hasGst && <p className="font-bold">GSTIN: {business.gstin}</p>}
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl">{hasGst ? "TAX INVOICE" : "ORDER RECEIPT"}</p>
          <p>
            Invoice no: <strong>{order.order_number}</strong>
          </p>
          <p>Date: {date}</p>
          <p>
            Payment: {order.payment_method === "cod" ? "Cash on delivery" : "Online (Razorpay)"} ·{" "}
            {order.payment_status === "paid" ? "Paid" : order.payment_status === "refunded" ? "Refunded" : "Pending"}
          </p>
          {order.status === "cancelled" && <p className="font-bold text-bubblegum-dark">ORDER CANCELLED</p>}
        </div>
      </header>

      <section className="grid gap-4 border-b border-ink/20 py-4 sm:grid-cols-2">
        <div>
          <p className="font-bold">Bill to / Ship to</p>
          <p>{order.ship_name}</p>
          <p>
            {order.ship_line1}
            {order.ship_line2 && `, ${order.ship_line2}`}
          </p>
          <p>
            {order.ship_city}, {order.ship_state} – {order.ship_pincode}
          </p>
          <p>Phone: {formatIndianMobile(order.ship_phone)}</p>
        </div>
        {hasGst && (
          <div className="sm:text-right">
            <p>
              <span className="font-bold">Place of supply:</span> {order.ship_state}
            </p>
            <p>{sameState ? "Intra-state supply (CGST + SGST)" : "Inter-state supply (IGST)"}</p>
          </div>
        )}
      </section>

      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Item</th>
            {hasGst && <th className="py-2 pr-2">HSN</th>}
            <th className="py-2 pr-2 text-right">Qty</th>
            <th className="py-2 pr-2 text-right">Rate</th>
            {hasGst && <th className="py-2 pr-2 text-right">Taxable</th>}
            {hasGst && <th className="py-2 pr-2 text-right">{sameState ? "CGST + SGST" : "IGST"}</th>}
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="border-b border-ink/15 align-top">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">{row.name}</td>
              {hasGst && <td className="py-2 pr-2">{row.hsn}</td>}
              <td className="py-2 pr-2 text-right">{row.quantity}</td>
              <td className="py-2 pr-2 text-right">{formatPaise(row.unit)}</td>
              {hasGst && <td className="py-2 pr-2 text-right">{formatPaise(row.taxablePaise)}</td>}
              {hasGst && (
                <td className="py-2 pr-2 text-right">
                  {sameState
                    ? `${formatPaise(Math.floor(row.taxPaise / 2))} + ${formatPaise(row.taxPaise - Math.floor(row.taxPaise / 2))}`
                    : formatPaise(row.taxPaise)}
                  <span className="block text-xs text-ink-soft">
                    @ {sameState ? `${row.rate / 2}% + ${row.rate / 2}%` : `${row.rate}%`}
                  </span>
                </td>
              )}
              <td className="py-2 text-right">{formatPaise(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-4 flex flex-col items-end gap-1">
        {hasGst && (
          <>
            <p>Taxable value: {formatPaise(totals.taxable)}</p>
            {sameState ? (
              <>
                <p>CGST: {formatPaise(Math.floor(totals.tax / 2))}</p>
                <p>SGST: {formatPaise(totals.tax - Math.floor(totals.tax / 2))}</p>
              </>
            ) : (
              <p>IGST: {formatPaise(totals.tax)}</p>
            )}
          </>
        )}
        <p className="font-heading text-2xl">Total: {formatPaise(order.total_paise)}</p>
        <p className="italic">{paiseInWords(order.total_paise)}</p>
        {order.refund_paise ? <p className="font-bold">Refunded: {formatPaise(order.refund_paise)}</p> : null}
      </section>

      <footer className="mt-8 border-t border-ink/20 pt-4 text-xs text-ink-soft">
        <p>Prices include GST. This is a computer-generated invoice and does not need a signature.</p>
        {!hasGst && <p>GST details will appear here once the shop adds its GSTIN in Settings.</p>}
        <p className="mt-1">Thank you for shopping with {business.name}! 🎈</p>
      </footer>
    </main>
  );
}
