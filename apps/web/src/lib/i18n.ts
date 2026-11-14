import "server-only";
import { cookies } from "next/headers";
import { AGE_GROUPS, DEFAULT_LOCALE, isLocale, LOCALE_TAGS, MESSAGES, translate, type Locale } from "@toyshop/shared";
import type { CardLabels } from "@/components/ui";

export const LOCALE_COOKIE = "toyshop-locale";

// The shopper's chosen language (remembered in a cookie), English by default.
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type Translator = ((key: string, vars?: Record<string, string | number>) => string) & {
  locale: Locale;
  tag: string;
};

export async function getT(): Promise<Translator> {
  const locale = await getLocale();
  return makeT(locale);
}

export function makeT(locale: Locale): Translator {
  const t = ((key: string, vars?: Record<string, string | number>) =>
    translate(MESSAGES[locale], key, vars)) as Translator;
  t.locale = locale;
  t.tag = LOCALE_TAGS[locale];
  return t;
}

// Product card words in the shopper's language.
export function cardLabels(t: Translator): CardLabels {
  return {
    new: t("card.new"),
    soldOut: t("card.soldOut"),
    seeToy: t("card.seeToy"),
    onlyLeft: t("card.onlyLeft"),
    addToCart: t("card.addToCart"),
    outOfStock: t("card.outOfStock"),
    off: t("card.off"),
    mrp: t("card.mrp"),
    ages: Object.fromEntries(AGE_GROUPS.map((group) => [group.id, t(`age.${group.id}`)])),
  };
}
