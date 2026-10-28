// Prices are stored as whole paise (₹1 = 100 paise) to avoid rounding errors,
// which is also the unit Razorpay expects.

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatPaise(paise: number): string {
  return inrFormatter.format(paise / 100);
}

export function discountPercent(pricePaise: number, mrpPaise: number): number {
  if (mrpPaise <= 0 || pricePaise >= mrpPaise) return 0;
  return Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
