"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LOCALE_NAMES, type Locale } from "@toyshop/shared";
import { LinkPending } from "@/components/shop/NavigationProgress";
import { cn } from "@/lib/cn";
import { LOCALE_COOKIE, LOCALES, localePath, stripLocale } from "@/lib/locales";
import { useT } from "./I18nProvider";

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

// EN | தமிழ் | हिंदी — links to the same page in another language.
export function LanguageSwitcher() {
  const { locale, t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { path } = stripLocale(pathname);

  // Tell browsers and screen readers which language the page is in, and
  // remember it so "/" opens in the same language next time.
  useEffect(() => {
    document.documentElement.lang = locale;
    remember(locale);
  }, [locale]);

  return (
    <nav aria-label={t("lang.choose")} className="flex rounded-full bg-ink/5 p-0.5 text-sm">
      {LOCALES.map((item) => {
        const href = localePath(item, path);
        return (
          <Link
            key={item}
            href={href}
            hrefLang={item}
            lang={item}
            prefetch={false}
            aria-current={item === locale ? "true" : undefined}
            onClick={(event) => {
              remember(item);
              // Keep any search or filter in the address.
              if (window.location.search) {
                event.preventDefault();
                router.push(href + window.location.search);
              }
            }}
            className={cn(
              "rounded-full px-2.5 py-1 font-bold transition",
              item === locale ? "bg-white shadow-soft" : "text-ink-soft hover:text-ink",
            )}
          >
            {item === "en" ? "EN" : LOCALE_NAMES[item]}
            <LinkPending />
          </Link>
        );
      })}
    </nav>
  );
}
