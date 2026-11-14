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
//
// The provider also draws the element that marks the page's language
// (`lang`), instead of the layout doing it. That is deliberate: while a page
// loads, React (19.2 canary, bundled with Next.js 15.5) mis-reads an element
// whose first child isn't ready yet and then redraws the whole page. Drawn
// here, the element's children are always ready by the time it appears.
export function I18nProvider({
  locale,
  messages,
  className,
  children,
}: {
  locale: Locale;
  messages: Record<string, string>;
  className?: string;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, tag: LOCALE_TAGS[locale], t: (key: string, vars?: Record<string, string | number>) => translate(messages, key, vars) }),
    [locale, messages],
  );
  return (
    <I18nContext.Provider value={value}>
      <div lang={locale} className={className}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
