"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { LOCALE_TAGS, translate, type Locale } from "@toyshop/shared";

type I18n = {
  locale: Locale;
  tag: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18n>({
  locale: "en",
  tag: "en-IN",
  t: (key) => key,
});

// Only the current language's words are sent to the browser.
export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Record<string, string>;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, tag: LOCALE_TAGS[locale], t: (key: string, vars?: Record<string, string | number>) => translate(messages, key, vars) }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  return useContext(I18nContext);
}
