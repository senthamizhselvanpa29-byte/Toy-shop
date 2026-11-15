"use client";

import { useT } from "@/components/i18n/I18nProvider";
import { TobyLoader } from "@/components/ui";

// Shown the moment a shopper taps a link, while the next page is fetched.
// Tall enough that the footer doesn't jump up and down.
export function PageLoading() {
  const { t } = useT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <TobyLoader label={t("common.loading")} />
    </div>
  );
}
