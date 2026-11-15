"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { LocaleLink } from "@/components/i18n/LocaleLink";
import { buttonClasses, TobySays } from "@/components/ui";

// Shown inside the shop (in the shopper's language) when a toy or page isn't there.
export default function ShopNotFound() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-xl py-20">
      <TobySays
        title={t("notFound.title")}
        action={
          <LocaleLink href="/toys" className={buttonClasses("primary", "lg")}>
            {t("notFound.back")} 🧸
          </LocaleLink>
        }
      >
        {t("notFound.text")}
      </TobySays>
    </div>
  );
}
