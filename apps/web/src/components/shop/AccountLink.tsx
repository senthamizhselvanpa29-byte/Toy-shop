"use client";

import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import { CartLink } from "@/components/cart/CartLink";
import { useT } from "@/components/i18n/I18nProvider";
import { useCustomer } from "./CustomerProvider";

export function AccountLink() {
  const { ready, signedIn, wishlist } = useCustomer();
  const { t } = useT();

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/account/wishlist"
        className="relative flex size-10 items-center justify-center rounded-full text-xl hover:bg-ink/5"
        aria-label={`${t("header.wishlist")}${wishlist.size ? ` (${wishlist.size})` : ""}`}
      >
        <span aria-hidden>❤️</span>
        {wishlist.size > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-bubblegum-dark text-xs font-bold text-white">
            {wishlist.size}
          </span>
        )}
      </Link>
      <CartLink />
      <Link
        href={signedIn ? "/account" : "/account/login"}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 font-bold hover:bg-ink/5"
      >
        <span aria-hidden>👤</span>
        <span className={ready ? "" : "opacity-0"}>{signedIn ? t("header.account") : t("header.login")}</span>
      </Link>
    </div>
  );
}
