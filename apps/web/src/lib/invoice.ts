import "server-only";
import type { InvoiceBusiness, InvoiceOrder } from "@/components/invoice/InvoiceView";
import { gstModeOf, shopImageUrl, type ShopSettingsRow } from "@/lib/shopProfile";

export function toInvoiceBusiness(row: ShopSettingsRow): InvoiceBusiness {
  const shopName = row.business_name?.trim() || "Toy Shop";
  return {
    legalName: row.legal_name?.trim() || shopName,
    shopName,
    address: row.business_address?.trim() ?? "",
    state: row.business_state?.trim() ?? "",
    phone: row.business_phone?.trim() ?? "",
    email: row.business_email?.trim() ?? "",
    gstin: row.gstin?.trim() ?? "",
    hsn: row.default_hsn?.trim() || "9503",
    gstMode: gstModeOf(row),
    logoUrl: shopImageUrl(row.logo_path),
    logoEmoji: row.logo_emoji?.trim() || "🧸",
    notes: row.invoice_notes?.trim() ?? "",
    signatureUrl: shopImageUrl(row.signature_path),
    signatoryName: row.signatory_name?.trim() ?? "",
  };
}

type OrderRow = {
  invoice_number?: string | null;
  order_number: string;
  placed_at: string;
  payment_method: string;
  payment_status: string;
  status: string;
  refund_paise: number | null;
  ship_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  ship_phone: string;
  delivery_paise: number;
  total_paise: number;
  order_items: { id: string; name: string; unit_price_paise: number; gst_rate: number; quantity: number; line_total_paise: number }[];
};

export function toInvoiceOrder(order: OrderRow): InvoiceOrder {
  return {
    // Orders placed before invoice numbers existed (0008) use their order number.
    invoiceNumber: order.invoice_number || order.order_number,
    orderNumber: order.order_number,
    placedAt: order.placed_at,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    status: order.status,
    refundPaise: order.refund_paise,
    ship: {
      name: order.ship_name,
      line1: order.ship_line1,
      line2: order.ship_line2,
      city: order.ship_city,
      state: order.ship_state,
      pincode: order.ship_pincode,
      phone: order.ship_phone,
    },
    items: order.order_items.map((item) => ({
      id: item.id,
      name: item.name,
      unitPricePaise: item.unit_price_paise,
      gstRate: item.gst_rate,
      quantity: item.quantity,
      lineTotalPaise: item.line_total_paise,
    })),
    deliveryPaise: order.delivery_paise,
    totalPaise: order.total_paise,
  };
}
