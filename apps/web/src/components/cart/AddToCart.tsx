"use client";

import Link from "next/link";
import { useState } from "react";
import { MAX_QTY_PER_TOY } from "@toyshop/shared";
import { Button, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useCart } from "./CartProvider";

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const { lines, add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = lines.find((line) => line.productId === productId)?.quantity ?? 0;
  const max = Math.max(0, Math.min(stock, MAX_QTY_PER_TOY) - inCart);

  if (stock <= 0) {
    return (
      <Button size="lg" disabled className="w-full">
        Sold out
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <QuantityStepper value={Math.min(quantity, Math.max(max, 1))} max={Math.max(max, 1)} onChange={setQuantity} label="Quantity" />
        <Button
          size="lg"
          className="flex-1 hover:animate-wiggle"
          disabled={max <= 0}
          onClick={() => {
            add(productId, Math.min(quantity, max));
            setAdded(true);
            setQuantity(1);
          }}
        >
          {max <= 0 ? "Max in cart" : "Add to cart 🛒"}
        </Button>
      </div>
      {(added || inCart > 0) && (
        <p role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mint/25 px-4 py-2 font-bold text-mint-dark">
          ✓ {inCart} in your cart
          <Link href="/cart" className={cn(buttonClasses("success", "sm"))}>
            View cart →
          </Link>
        </p>
      )}
    </div>
  );
}

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const button =
    "flex size-10 items-center justify-center rounded-full text-xl font-bold transition hover:bg-ink/10 disabled:opacity-30";
  return (
    <div className="flex items-center rounded-full border-2 border-ink/15 bg-white" role="group" aria-label={label}>
      <button type="button" className={button} aria-label="Decrease" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-8 text-center font-heading text-lg" aria-live="polite">
        {value}
      </span>
      <button type="button" className={button} aria-label="Increase" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
