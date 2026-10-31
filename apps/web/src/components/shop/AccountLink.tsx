"use client";

import Link from "next/link";
import { useCustomer } from "./CustomerProvider";

export function AccountLink() {
  const { ready, signedIn, wishlist } = useCustomer();

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/account/wishlist"
        className="relative flex size-10 items-center justify-center rounded-full text-xl hover:bg-ink/5"
        aria-label={`Wishlist${wishlist.size ? ` (${wishlist.size})` : ""}`}
      >
        <span aria-hidden>❤️</span>
        {wishlist.size > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-bubblegum-dark text-xs font-bold text-white">
            {wishlist.size}
          </span>
        )}
      </Link>
      <Link
        href={signedIn ? "/account" : "/account/login"}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 font-bold hover:bg-ink/5"
      >
        <span aria-hidden>👤</span>
        <span className={ready ? "" : "opacity-0"}>{signedIn ? "Account" : "Log in"}</span>
      </Link>
    </div>
  );
}
