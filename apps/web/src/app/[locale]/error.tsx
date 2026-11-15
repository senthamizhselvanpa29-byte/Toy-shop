"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { Button, TobySays } from "@/components/ui";

// Shown inside the shop (header and footer stay) when a page fails to load.
export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useT();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-20">
      <TobySays
        title={t("error.title")}
        action={
          <Button type="button" size="lg" onClick={reset}>
            {t("error.retry")} 🔄
          </Button>
        }
      >
        {t("error.text")}
      </TobySays>
    </div>
  );
}
