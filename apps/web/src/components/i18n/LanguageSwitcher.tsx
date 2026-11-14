"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { LOCALE_NAMES, LOCALES, type Locale } from "@toyshop/shared";
import { cn } from "@/lib/cn";
import { useT } from "./I18nProvider";

const COOKIE = "toyshop-locale";

export function LanguageSwitcher() {
  const { locale, t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Tell browsers and screen readers which language the page is in.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function choose(next: Locale) {
    if (next === locale) return;
    document.cookie = `${COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div role="group" aria-label={t("lang.choose")} className={cn("flex rounded-full bg-ink/5 p-0.5 text-sm", pending && "opacity-60")}>
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          lang={item}
          aria-pressed={item === locale}
          onClick={() => choose(item)}
          className={cn(
            "rounded-full px-2.5 py-1 font-bold transition",
            item === locale ? "bg-white shadow-soft" : "text-ink-soft hover:text-ink",
          )}
        >
          {item === "en" ? "EN" : LOCALE_NAMES[item]}
        </button>
      ))}
    </div>
  );
}
