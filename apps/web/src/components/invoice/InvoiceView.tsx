import { formatIndianMobile, formatPaise, paiseInWords, splitGst } from "@toyshop/shared";
import type { GstMode } from "@/lib/shopProfile";
import { InvoicePrintButton } from "./InvoicePrintButton";

export type InvoiceBusiness = {
  // Name on the invoice (registered business name) and the shop's everyday name.
  legalName: string;
  shopName: string;
  address: string;
  state: string;
  phone: string;
  email: string;
  gstin: string;
  hsn: string;
  gstMode: GstMode;
  logoUrl: string | null;
  logoEmoji: string;
  notes: string;
  signatureUrl: string | null;
  signatoryName: string;
};

export type InvoiceOrder = {
  invoiceNumber: string;
  orderNumber: string;
  placedAt: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  refundPaise: number | null;
  ship: { name: string; line1: string; line2: string; city: string; state: string; pincode: string; phone: string };
  items: { id: string; name: string; unitPricePaise: number; gstRate: number; quantity: number; lineTotalPaise: number }[];
  deliveryPaise: number;
  totalPaise: number;
};

const TITLES: Record<GstMode, string> = {
  regular: "TAX INVOICE",
  composition: "BILL OF SUPPLY",
  none: "INVOICE",
};

// One printable invoice. Laid out for A4 paper; "Download PDF" uses the
// browser's own "Save as PDF", so the text stays sharp and searchable.
export function InvoiceView({ order, business, banner }: { order: InvoiceOrder; business: InvoiceBusiness; banner?: string }) {
  // Tax columns only on a GST tax invoice (a GSTIN is needed for one).
  const taxInvoice = business.gstMode === "regular" && Boolean(business.gstin);
  const showGstin = business.gstMode !== "none" && Boolean(business.gstin);
  const mode: GstMode = business.gstMode === "regular" && !business.gstin ? "none" : business.gstMode;
  const sameState = business.state.trim().toLowerCase() === order.ship.state.trim().toLowerCase();

  // Delivery is taxed like the main item it comes with (the highest GST rate).
  const deliveryRate = Math.max(0, ...order.items.map((item) => item.gstRate));
  const rows = [
    ...order.items.map((item) => ({
      key: item.id,
      name: item.name,
      hsn: business.hsn,
      quantity: item.quantity,
      unit: item.unitPricePaise,
      rate: item.gstRate,
      total: item.lineTotalPaise,
    })),
    ...(order.deliveryPaise > 0
      ? [{ key: "delivery", name: "Delivery charges", hsn: "996812", quantity: 1, unit: order.deliveryPaise, rate: deliveryRate, total: order.deliveryPaise }]
      : []),
  ].map((row) => ({ ...row, ...splitGst(row.total, row.rate) }));
  const totals = rows.reduce(
    (sum, row) => ({ taxable: sum.taxable + row.taxablePaise, tax: sum.tax + row.taxPaise }),
    { taxable: 0, tax: 0 },
  );
  const date = new Date(order.placedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const half = (paise: number) => Math.floor(paise / 2);

  return (
    <main className="invoice mx-auto max-w-4xl bg-white p-6 text-sm text-ink print:max-w-none print:p-0 sm:p-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <p className="text-ink-soft">
          “Download PDF” opens the print window: choose <strong>Save as PDF</strong> as the printer.
        </p>
        <InvoicePrintButton fileName={order.invoiceNumber.replace(/\//g, "-")} />
      </div>
      {banner && <p className="mb-4 rounded-2xl bg-sunshine/30 px-4 py-3 font-bold print:hidden">{banner}</p>}

      <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-4">
        <div className="flex items-start gap-4">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt="" className="h-16 w-auto max-w-32 object-contain" />
          ) : (
            <span className="text-5xl" aria-hidden>
              {business.logoEmoji}
            </span>
          )}
          <div>
            <p className="font-heading text-2xl">{business.legalName}</p>
            {business.shopName !== business.legalName && <p className="text-ink-soft">({business.shopName})</p>}
            {business.address && <p className="mt-1 max-w-xs whitespace-pre-line">{business.address}</p>}
            {business.state && <p>State: {business.state}</p>}
            {business.phone && <p>Phone: {business.phone}</p>}
            {business.email && <p>Email: {business.email}</p>}
            {showGstin && <p className="font-bold">GSTIN: {business.gstin}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl">{TITLES[mode]}</p>
          <p>
            Invoice no: <strong data-invoice-number>{order.invoiceNumber}</strong>
          </p>
          <p>Order no: {order.orderNumber}</p>
          <p>Date: {date}</p>
          <p>
            Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"} ·{" "}
            {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Pending"}
          </p>
          {order.status === "cancelled" && <p className="font-bold text-bubblegum-dark">ORDER CANCELLED</p>}
        </div>
      </header>

      <section className="grid gap-4 border-b border-ink/20 py-4 sm:grid-cols-2">
        <div>
          <p className="font-bold">Bill to / Ship to</p>
          <p>{order.ship.name}</p>
          <p>
            {order.ship.line1}
            {order.ship.line2 && `, ${order.ship.line2}`}
          </p>
          <p>
            {order.ship.city}, {order.ship.state} – {order.ship.pincode}
          </p>
          <p>Phone: {formatIndianMobile(order.ship.phone)}</p>
        </div>
        {showGstin && (
          <div className="sm:text-right">
            <p>
              <span className="font-bold">Place of supply:</span> {order.ship.state}
            </p>
            {taxInvoice && <p>{sameState ? "Intra-state supply (CGST + SGST)" : "Inter-state supply (IGST)"}</p>}
          </div>
        )}
      </section>

      <table className="mt-4 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-ink">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Item</th>
            {showGstin && <th className="py-2 pr-2">HSN</th>}
            <th className="py-2 pr-2 text-right">Qty</th>
            <th className="py-2 pr-2 text-right">Rate</th>
            {taxInvoice && <th className="py-2 pr-2 text-right">Taxable</th>}
            {taxInvoice && <th className="py-2 pr-2 text-right">{sameState ? "CGST + SGST" : "IGST"}</th>}
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key} className="border-b border-ink/15 align-top">
              <td className="py-2 pr-2">{index + 1}</td>
              <td className="py-2 pr-2">{row.name}</td>
              {showGstin && <td className="py-2 pr-2">{row.hsn}</td>}
              <td className="py-2 pr-2 text-right">{row.quantity}</td>
              <td className="py-2 pr-2 text-right">{formatPaise(row.unit)}</td>
              {taxInvoice && <td className="py-2 pr-2 text-right">{formatPaise(row.taxablePaise)}</td>}
              {taxInvoice && (
                <td className="py-2 pr-2 text-right">
                  {sameState
                    ? `${formatPaise(half(row.taxPaise))} + ${formatPaise(row.taxPaise - half(row.taxPaise))}`
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
        {taxInvoice && (
          <>
            <p>Taxable value: {formatPaise(totals.taxable)}</p>
            {sameState ? (
              <>
                <p>CGST: {formatPaise(half(totals.tax))}</p>
                <p>SGST: {formatPaise(totals.tax - half(totals.tax))}</p>
              </>
            ) : (
              <p>IGST: {formatPaise(totals.tax)}</p>
            )}
          </>
        )}
        <p className="font-heading text-2xl">Total: {formatPaise(order.totalPaise)}</p>
        <p className="italic">{paiseInWords(order.totalPaise)}</p>
        {order.refundPaise ? <p className="font-bold">Refunded: {formatPaise(order.refundPaise)}</p> : null}
      </section>

      <section className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-ink/20 pt-4">
        <div className="max-w-md text-xs text-ink-soft">
          {business.notes && (
            <div className="mb-3 text-sm text-ink" data-invoice-notes>
              <p className="font-bold">Notes</p>
              <p className="whitespace-pre-line">{business.notes}</p>
            </div>
          )}
          {taxInvoice && <p>Prices include GST.</p>}
          {mode === "composition" && <p>Composition taxable person, not eligible to collect tax on supplies.</p>}
          {!business.signatureUrl && <p>This is a computer-generated invoice and does not need a signature.</p>}
          <p className="mt-1">Thank you for shopping with {business.shopName}! 🎈</p>
        </div>
        {business.signatureUrl && (
          <div className="text-center text-sm">
            <p>For {business.legalName}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={business.signatureUrl} alt="Signature" className="mx-auto my-1 h-16 w-auto max-w-48 object-contain" />
            {business.signatoryName && <p className="font-bold">{business.signatoryName}</p>}
            <p className="border-t border-ink/40 pt-1">Authorised signatory</p>
          </div>
        )}
      </section>
    </main>
  );
}
