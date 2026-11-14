"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPaise } from "@toyshop/shared";
import { payExistingOrder } from "@/app/(shop)/checkout/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui";
import { payWithRazorpay } from "./razorpayCheckout";

export function PayNowButton({ orderId, totalPaise }: { orderId: string; totalPaise: number }) {
  const router = useRouter();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          const result = await payExistingOrder(orderId);
          if ("error" in result) {
            setError(t(result.error));
            setBusy(false);
            return;
          }
          const outcome = await payWithRazorpay(orderId, result.razorpay);
          setBusy(false);
          router.replace(`/account/orders/${orderId}?${outcome === "paid" ? "placed=1" : `payment=${outcome}`}`);
          router.refresh();
        }}
      >
        {busy ? t("order.openingPayment") : `${t("order.payNow", { amount: formatPaise(totalPaise) })} 🔒`}
      </Button>
      {error && <p role="alert" className="font-bold text-bubblegum-dark">{error}</p>}
    </div>
  );
}
