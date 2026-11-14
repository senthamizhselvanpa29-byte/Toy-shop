"use client";

import { useState, useTransition } from "react";
import { refreshShopPages } from "@/app/admin/(panel)/settings/actions";
import { Button } from "@/components/ui";

export function RefreshShopButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setDone(false);
          startTransition(async () => {
            await refreshShopPages();
            setDone(true);
          });
        }}
      >
        {pending ? "Refreshing…" : "🔄 Refresh shop pages"}
      </Button>
      {done && (
        <span role="status" className="font-bold text-mint-dark">
          Done — your shop is up to date ✓
        </span>
      )}
    </div>
  );
}
