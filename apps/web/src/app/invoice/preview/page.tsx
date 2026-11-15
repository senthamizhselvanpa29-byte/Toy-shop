import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InvoiceView, type InvoiceOrder } from "@/components/invoice/InvoiceView";
import { getViewer } from "@/lib/auth";
import { toInvoiceBusiness } from "@/lib/invoice";
import { readShopSettings } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice preview", robots: { index: false } };

// The owner's preview of how invoices look with the current settings, using a
// made-up order (Owner area → Settings → Invoices → "See a sample invoice").
export default async function InvoicePreviewPage() {
  const viewer = await getViewer();
  if (viewer.status === "signed-out") redirect("/admin/login");
  if (viewer.status !== "owner") notFound();

  const supabase = await createClient();
  const [settings, { data: preview }] = await Promise.all([readShopSettings(supabase), supabase.rpc("next_invoice_preview")]);
  const business = toInvoiceBusiness(settings);
  const otherState = business.state === "Karnataka" ? "Kerala" : "Karnataka";
  const sample: InvoiceOrder = {
    invoiceNumber: typeof preview === "string" ? preview : "INV/0001",
    orderNumber: "TS001234",
    placedAt: new Date().toISOString(),
    paymentMethod: "razorpay",
    paymentStatus: "paid",
    status: "placed",
    refundPaise: null,
    ship: { name: "Sample Customer", line1: "12, Rainbow Apartments", line2: "MG Road", city: "Bengaluru", state: otherState, pincode: "560001", phone: "+919876543210" },
    items: [
      { id: "a", name: "Wooden Rainbow Stacker", unitPricePaise: 49900, gstRate: 12, quantity: 2, lineTotalPaise: 99800 },
      { id: "b", name: "Jungle Animals Jigsaw Puzzle", unitPricePaise: 34900, gstRate: 12, quantity: 1, lineTotalPaise: 34900 },
    ],
    deliveryPaise: 0,
    totalPaise: 134700,
  };
  return <InvoiceView order={sample} business={business} banner="👀 Sample invoice with your current settings — not a real order." />;
}
