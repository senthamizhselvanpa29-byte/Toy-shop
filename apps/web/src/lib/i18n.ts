import "server-only";
import { AGE_GROUPS, LOCALE_TAGS, MESSAGES, translate, type Locale } from "@toyshop/shared";
import type { CardLabels } from "@/components/ui";

export type Translator = ((key: string, vars?: Record<string, string | number>) => string) & {
  locale: Locale;
  tag: string;
};

// Words for one language. Shop pages get the language from their address
// ("/ta/toys" → "ta"); English pages have no prefix.
export function getT(locale: Locale): Translator {
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
