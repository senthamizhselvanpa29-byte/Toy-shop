import { formatPaise } from "@toyshop/shared";
import type { Quote } from "@/lib/orders";

export function OrderSummary({ quote }: { quote: Quote }) {
  const { subtotalPaise, deliveryPaise, totalPaise, settings } = quote;
  const toFree = settings.freeDeliveryAbovePaise - subtotalPaise;

  return (
    <dl className="flex flex-col gap-2">
      <div className="flex justify-between">
        <dt>Toys</dt>
        <dd>{formatPaise(subtotalPaise)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Delivery</dt>
        <dd className={deliveryPaise === 0 ? "font-bold text-mint-dark" : ""}>
          {deliveryPaise === 0 ? "FREE" : formatPaise(deliveryPaise)}
        </dd>
      </div>
      {deliveryPaise > 0 && toFree > 0 && (
        <p className="rounded-xl bg-sunshine/30 px-3 py-2 text-sm">
          🚚 Add {formatPaise(toFree)} more for <strong>free delivery</strong>!
        </p>
      )}
      <div className="mt-1 flex justify-between border-t-2 border-dashed border-ink/15 pt-3 font-heading text-2xl">
        <dt>Total</dt>
        <dd>{formatPaise(totalPaise)}</dd>
      </div>
      <p className="text-right text-xs text-ink-soft">Inclusive of all taxes</p>
    </dl>
  );
}
