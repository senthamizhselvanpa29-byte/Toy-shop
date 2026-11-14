"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/orders";
import { quoteCheckout } from "@/app/[locale]/checkout/actions";
import { useT } from "@/components/i18n/I18nProvider";
import { useCart } from "./CartProvider";

// Asks the server for real prices, stock and delivery for the cart. If a toy
// sold out or there are fewer left, the cart is corrected and `notices` says why.
export function useQuote() {
  const cart = useCart();
  const { t, locale } = useT();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<string[]>([]);
  const request = useRef(0);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!cart.ready) return;
    if (cart.lines.length === 0) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const id = ++request.current;
    setLoading(true);
    quoteCheckout(cart.lines, locale).then((result) => {
      if (id !== request.current) return;
      const changes: string[] = [];
      for (const line of result.lines) {
        if (line.problem === "unavailable") {
          changes.push(t("cart.noticeUnavailable"));
          cart.remove(line.productId);
        } else if (line.problem === "sold_out") {
          changes.push(t("cart.noticeSoldOut", { name: line.displayName }));
          cart.remove(line.productId);
        } else if (line.problem === "reduced") {
          changes.push(t("cart.noticeReduced", { count: line.quantity, name: line.displayName }));
          cart.setQuantity(line.productId, line.quantity);
        }
      }
      if (changes.length) setNotices((current) => [...current, ...changes]);
      setQuote(result);
      setLoading(false);
    });
    // Re-quote whenever the cart's contents change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready, JSON.stringify(cart.lines), refreshCount]);

  // Ask the server again (e.g. after it said prices changed).
  const refresh = () => setRefreshCount((count) => count + 1);

  return { quote, loading, notices, cart, refresh };
}
