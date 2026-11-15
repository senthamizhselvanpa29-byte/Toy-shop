"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import { formatPaise, MAX_QTY_PER_TOY } from "@toyshop/shared";
import { QuantityStepper } from "@/components/cart/AddToCart";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useQuote } from "@/components/cart/useQuote";
import { useT } from "@/components/i18n/I18nProvider";
import { buttonClasses, Card, TobyLoader, TobySays } from "@/components/ui";

export default function CartPage() {
  const { quote, loading, notices, cart } = useQuote();
  const { t } = useT();
  const lines = quote?.lines.filter((line) => line.quantity > 0) ?? [];

  if (!cart.ready || (loading && !quote)) {
    return (
      <div className="flex justify-center py-20">
        <TobyLoader label={t("cart.opening")} />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="py-12">
        {notices.map((notice) => (
          <p key={notice} role="status" className="mx-auto mb-3 max-w-xl rounded-2xl bg-sunshine/30 px-4 py-3">
            {notice}
          </p>
        ))}
        <TobySays
          title={t("cart.emptyTitle")}
          action={
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              {t("cart.findToys")} 🧸
            </Link>
          }
        >
          {t("cart.emptyText")}
        </TobySays>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <h1 className="text-3xl sm:text-4xl">🛒 {t("cart.title")}</h1>

      {notices.map((notice) => (
        <p key={notice} role="status" className="rounded-2xl bg-sunshine/30 px-4 py-3 font-bold">
          {notice}
        </p>
      ))}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <li key={line.productId}>
              <Card className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap">
                <Link href={`/toys/${line.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-sky/30">
                  {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/toys/${line.slug}`} className="font-heading text-lg hover:underline">
                    {line.displayName}
                  </Link>
                  <p className="text-sm text-ink-soft">{t("cart.each", { price: formatPaise(line.unitPricePaise) })}</p>
                  {line.stock <= 5 && <p className="text-sm font-bold text-orange-dark">{t("cart.onlyLeft", { count: line.stock })}</p>}
                </div>
                <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                  <QuantityStepper
                    label={t("cart.quantityOf", { name: line.displayName })}
                    value={line.quantity}
                    max={Math.min(line.stock, MAX_QTY_PER_TOY)}
                    onChange={(quantity) => cart.setQuantity(line.productId, quantity)}
                  />
                  <span className="w-20 text-right font-heading text-lg">{formatPaise(line.lineTotalPaise)}</span>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.productId)}
                    aria-label={t("cart.removeNamed", { name: line.displayName })}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-ink/10"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>

        {quote && (
          <aside className="lg:sticky lg:top-40 lg:self-start">
            <Card className="flex flex-col gap-4">
              <h2 className="text-2xl">{t("cart.summary")}</h2>
              <OrderSummary quote={quote} t={t} />
              {quote.settings.orderingPaused ? (
                <p role="status" className="rounded-2xl bg-sunshine/30 px-4 py-3 text-sm" data-paused-cart>
                  ⏸️ <strong>{t("paused.title")}.</strong> {t("paused.default")}
                </p>
              ) : (
                <Link
                  href="/checkout"
                  aria-disabled={loading}
                  className={buttonClasses("primary", "lg") + (loading ? " pointer-events-none opacity-60" : "")}
                >
                  {t("cart.checkout")} 🔒
                </Link>
              )}
              <Link href="/toys" className="text-center text-sm font-bold text-sky-dark hover:underline">
                ← {t("cart.keepShopping")}
              </Link>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
