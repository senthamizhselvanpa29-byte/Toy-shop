import { formatPaise } from "@toyshop/shared";
import type { Quote } from "@/lib/orders";

// `t` gives the words in the shopper's language.
export function OrderSummary({ quote, t }: { quote: Quote; t: (key: string, vars?: Record<string, string | number>) => string }) {
  const { subtotalPaise, deliveryPaise, totalPaise, settings } = quote;
  const toFree = settings.freeDeliveryAbovePaise - subtotalPaise;

  return (
    <dl className="flex flex-col gap-2">
      <div className="flex justify-between">
        <dt>{t("summary.toys")}</dt>
        <dd>{formatPaise(subtotalPaise)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>{t("summary.delivery")}</dt>
        <dd className={deliveryPaise === 0 ? "font-bold text-mint-dark" : ""}>
          {deliveryPaise === 0 ? t("summary.free") : formatPaise(deliveryPaise)}
        </dd>
      </div>
      {deliveryPaise > 0 && toFree > 0 && (
        <p className="rounded-xl bg-sunshine/30 px-3 py-2 text-sm">
          🚚 {t("summary.addMore", { amount: formatPaise(toFree) })}
        </p>
      )}
      <div className="mt-1 flex justify-between border-t-2 border-dashed border-ink/15 pt-3 font-heading text-2xl">
        <dt>{t("summary.total")}</dt>
        <dd>{formatPaise(totalPaise)}</dd>
      </div>
      <p className="text-right text-xs text-ink-soft">{t("product.inclTaxes")}</p>
    </dl>
  );
}
