"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useT } from "@/components/i18n/I18nProvider";

// A thin bar at the top of the screen while the next page loads, so a tap
// always shows that something is happening — also on slow connections.
//
// Why not Next.js "loading.tsx" screens: they wrap the page in a Suspense
// boundary, and with that in place the page sometimes failed to show fresh
// data after a save (new address, changed name) until it was reloaded. This
// bar gives the same feedback on every page without touching how pages render.

// How many tapped links are still waiting for their page (normally 0 or 1).
let waiting = 0;
const listeners = new Set<() => void>();

function change(by: number) {
  waiting = Math.max(0, waiting + by);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Goes inside a link (see LocaleLink): reports while its page is loading.
export function LinkPending() {
  const { pending } = useLinkStatus();
  useEffect(() => {
    if (!pending) return;
    change(1);
    return () => change(-1);
  }, [pending]);
  return null;
}

export function NavigationProgress() {
  const { t } = useT();
  const active = useSyncExternalStore(
    subscribe,
    () => waiting > 0,
    () => false,
  );
  if (!active) return null;
  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="nav-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-sunshine/50"
    >
      <div className="h-full w-2/5 rounded-full bg-bubblegum-dark" />
    </div>
  );
}
