"use client";

import Image from "next/image";
import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { formatIndianMobile, formatPaise } from "@toyshop/shared";
import { placeOrder } from "@/app/[locale]/checkout/actions";
import { AddressBook, type Address } from "@/components/account/AddressBook";
import { useT } from "@/components/i18n/I18nProvider";
import { localePath } from "@/lib/locales";
import { Badge, Button, Card, TobyLoader, TobySays, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { OrderSummary } from "./OrderSummary";
import { payWithRazorpay } from "./razorpayCheckout";
import { useQuote } from "./useQuote";

type Props = {
  addresses: Address[];
  defaultName: string;
  defaultPhone: string;
  onlinePayment: boolean;
  orderingEnabled: boolean;
};

export function CheckoutForm({ addresses, defaultName, defaultPhone, onlinePayment, orderingEnabled }: Props) {
  const router = useRouter();
  const { t, locale } = useT();
  const { quote, loading, notices, cart, refresh } = useQuote();
  const preferredAddress = addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? "";
  const [addressId, setAddressId] = useState(preferredAddress);

  // When a new address is added (or the chosen one deleted), pick a valid one.
  useEffect(() => {
    if (!addresses.some((address) => address.id === addressId)) setAddressId(preferredAddress);
  }, [addresses, addressId, preferredAddress]);
  const [method, setMethod] = useState<"razorpay" | "cod" | "">(onlinePayment ? "razorpay" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  if (!cart.ready || (loading && !quote)) {
    return (
      <div className="flex justify-center py-20">
        <TobyLoader label={t("checkout.loading")} />
      </div>
    );
  }
  if (cart.lines.length === 0 || !quote) {
    return (
      <TobySays
        title={t("cart.emptyTitle")}
        action={
          <Link href="/toys" className={buttonClasses("primary", "lg")}>
            {t("cart.findToys")} 🧸
          </Link>
        }
      />
    );
  }

  const codAllowed = quote.settings.codEnabled && quote.totalPaise <= quote.settings.codMaxPaise;
  const chosenMethod = method === "cod" && !codAllowed ? "" : method;
  const lines = quote.lines.filter((line) => line.quantity > 0);
  const paused = quote.settings.orderingPaused;
  const canPlace = orderingEnabled && !paused && Boolean(addressId) && Boolean(chosenMethod) && !loading && !busy && lines.length > 0;

  function submit() {
    if (!chosenMethod) return;
    setError("");
    setBusy(true);
    startTransition(async () => {
      const result = await placeOrder({
        cart: cart.lines,
        addressId,
        paymentMethod: chosenMethod,
        expectedTotalPaise: quote!.totalPaise,
      });
      if ("error" in result) {
        setError(t(result.error));
        setBusy(false);
        // Re-check the cart so the customer sees what changed.
        if (result.quote) refresh();
        return;
      }

      const placed = () => {
        cart.clear();
        router.push(localePath(locale, `/account/orders/${result.orderId}?placed=1`));
      };
      if (chosenMethod === "cod") return placed();
      if (!result.razorpay) {
        setError(t("checkout.errStart"));
        setBusy(false);
        return;
      }

      // The cart is only emptied once the payment succeeds, so a cancelled
      // payment leaves everything as it was.
      const outcome = await payWithRazorpay(result.orderId, result.razorpay);
      if (outcome === "paid") return placed();
      setBusy(false);
      setError(
        outcome === "closed" ? t("checkout.cancelled") : t("checkout.failed"),
      );
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        {notices.map((notice) => (
          <p key={notice} role="status" className="rounded-2xl bg-sunshine/30 px-4 py-3 font-bold">
            {notice}
          </p>
        ))}

        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl">1. {t("checkout.address")}</h2>
          {addresses.length > 0 && (
            <div role="radiogroup" aria-label={t("checkout.address")} className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  type="button"
                  role="radio"
                  aria-checked={addressId === address.id}
                  onClick={() => setAddressId(address.id)}
                  className={cn(
                    "rounded-2xl border-3 p-4 text-left transition",
                    addressId === address.id ? "border-sunshine-dark bg-sunshine/15" : "border-ink/10 bg-white hover:border-ink/25",
                  )}
                >
                  <span className="flex items-center gap-2 font-heading text-lg">
                    {addressId === address.id ? "🔘" : "⚪"} {address.full_name}
                    <Badge color="sky" className="ml-auto">{t(`address.label.${address.label}`)}</Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                    {address.line1}
                    {address.line2 && `, ${address.line2}`}, {address.city}, {address.state} – {address.pincode}
                    <br />📞 {formatIndianMobile(address.phone)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <AddressBook
            addresses={[]}
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            compact
            addLabel={`➕ ${addresses.length ? t("checkout.newAddress") : t("checkout.addAddress")}`}
          />
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl">2. {t("checkout.howPay")}</h2>
          <div role="radiogroup" aria-label={t("checkout.paymentMethod")} className="flex flex-col gap-3">
            <PaymentOption
              selected={chosenMethod === "razorpay"}
              disabled={!onlinePayment}
              onSelect={() => setMethod("razorpay")}
              title={`💳 ${t("checkout.payOnline")}`}
              text={onlinePayment ? t("checkout.payOnlineText") : t("checkout.comingSoon")}
            />
            <PaymentOption
              selected={chosenMethod === "cod"}
              disabled={!codAllowed}
              onSelect={() => setMethod("cod")}
              title={`💵 ${t("checkout.cod")}`}
              text={
                !quote.settings.codEnabled
                  ? t("checkout.codOff")
                  : codAllowed
                    ? t("checkout.codText")
                    : t("checkout.codLimit", { amount: formatPaise(quote.settings.codMaxPaise) })
              }
            />
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <Card className="flex flex-col gap-4">
          <h2 className="text-2xl">3. {t("checkout.yourOrder")}</h2>
          <ul className="flex flex-col gap-3">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sky/30">
                  {line.imageUrl && <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="line-clamp-1 font-bold">{line.displayName}</span>
                  <span className="text-ink-soft">{t("checkout.qty", { count: line.quantity })}</span>
                </span>
                <span className="text-sm font-bold">{formatPaise(line.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <Link href="/cart" className="text-sm font-bold text-sky-dark hover:underline">
            ✏️ {t("checkout.changeCart")}
          </Link>
          <OrderSummary quote={quote} t={t} />
          {error && (
            <p role="alert" className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
              {error}
            </p>
          )}
          {!orderingEnabled && (
            <p className="rounded-2xl bg-sunshine/30 px-4 py-3 text-sm">{t("checkout.notOpen")}</p>
          )}
          {orderingEnabled && paused && (
            <p role="status" className="rounded-2xl bg-sunshine/30 px-4 py-3 text-sm" data-paused-checkout>
              ⏸️ <strong>{t("paused.title")}.</strong> {t("paused.default")}
            </p>
          )}
          <Button size="lg" disabled={!canPlace} onClick={submit}>
            {busy
              ? t("checkout.placing")
              : chosenMethod === "razorpay"
                ? `${t("checkout.pay", { amount: formatPaise(quote.totalPaise) })} 🔒`
                : `${t("checkout.place")} 🎉`}
          </Button>
          {!addressId && <p className="text-center text-sm text-ink-soft">{t("checkout.needAddress")}</p>}
          {addressId && !chosenMethod && <p className="text-center text-sm text-ink-soft">{t("checkout.needMethod")}</p>}
        </Card>
      </aside>
    </div>
  );
}

function PaymentOption({
  selected,
  disabled,
  onSelect,
  title,
  text,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-3 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "border-sunshine-dark bg-sunshine/15" : "border-ink/10 bg-white enabled:hover:border-ink/25",
      )}
    >
      <span aria-hidden>{selected ? "🔘" : "⚪"}</span>
      <span>
        <span className="block font-heading text-lg">{title}</span>
        <span className="text-sm text-ink-soft">{text}</span>
      </span>
    </button>
  );
}
