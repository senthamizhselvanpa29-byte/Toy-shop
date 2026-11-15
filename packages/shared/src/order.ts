// Order rules shared by the web app and (later) the mobile app.

export const MAX_QTY_PER_TOY = 10;

export type ShopSettings = {
  deliveryFeePaise: number;
  freeDeliveryAbovePaise: number;
  codEnabled: boolean;
  codMaxPaise: number;
};

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  deliveryFeePaise: 4900,
  freeDeliveryAbovePaise: 49900,
  codEnabled: true,
  codMaxPaise: 500000,
};

// Delivery is free once the toys cost at least the free-delivery amount.
export function deliveryFeeFor(subtotalPaise: number, settings: ShopSettings): number {
  if (subtotalPaise <= 0) return 0;
  if (settings.freeDeliveryAbovePaise > 0 && subtotalPaise >= settings.freeDeliveryAbovePaise) return 0;
  return settings.deliveryFeePaise;
}

export type CartLine = { productId: string; quantity: number };

export const ORDER_STATUS_LABELS = {
  pending_payment: { label: "Waiting for payment", icon: "⏳" },
  placed: { label: "Order placed", icon: "🎉" },
  packed: { label: "Packed", icon: "📦" },
  shipped: { label: "On the way", icon: "🚚" },
  delivered: { label: "Delivered", icon: "🏠" },
  cancelled: { label: "Cancelled", icon: "✖️" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

export const ORDER_PROGRESS: OrderStatus[] = ["placed", "packed", "shipped", "delivered"];

export const RETURN_STATUS_LABELS = {
  none: "",
  requested: "Return requested",
  approved: "Return approved — we'll arrange pickup",
  rejected: "Return not accepted",
  returned: "Returned & refunded",
} as const;

export type ReturnStatus = keyof typeof RETURN_STATUS_LABELS;

// Prices include GST. Splits a GST-inclusive amount into taxable value and tax.
export function splitGst(inclusivePaise: number, ratePercent: number) {
  const taxable = Math.round((inclusivePaise * 100) / (100 + ratePercent));
  return { taxablePaise: taxable, taxPaise: inclusivePaise - taxable };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n: number) {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

// 129900 → "Rupees One Thousand Two Hundred Ninety Nine Only" (Indian system: lakh, crore).
export function paiseInWords(paise: number): string {
  let rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  if (rupees === 0 && remainder === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rupees) parts.push(belowThousand(rupees));
  const words = parts.length ? `Rupees ${parts.join(" ")}` : "Rupees Zero";
  return remainder ? `${words} and ${belowHundred(remainder)} Paise Only` : `${words} Only`;
}
