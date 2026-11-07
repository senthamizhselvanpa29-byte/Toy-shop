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
