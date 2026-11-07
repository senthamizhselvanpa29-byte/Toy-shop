"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative flex size-10 items-center justify-center rounded-full text-xl hover:bg-ink/5"
      aria-label={`Cart${count ? ` (${count})` : ""}`}
    >
      <span aria-hidden>🛒</span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-sky-dark text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
