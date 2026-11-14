"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { localePath } from "@/lib/locales";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Logs out in the browser so the header and wishlist update straight away.
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { t, locale } = useT();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace(localePath(locale, "/"));
        router.refresh();
      }}
    >
      {busy ? t("account.loggingOut") : t("account.logout")}
    </Button>
  );
}
