"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useT } from "@/components/i18n/I18nProvider";
import { AUTH_CHANGED_EVENT, hasAuthCookie } from "@/lib/authSignal";
import { loginPath } from "@/lib/locales";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Shop pages are cached for everyone, so the signed-in customer and their
// wishlist are loaded here in the browser instead.
type CustomerState = {
  ready: boolean;
  signedIn: boolean;
  wishlist: Set<string>;
  toggleWishlist: (productId: string) => Promise<void>;
};

const CustomerContext = createContext<CustomerState>({
  ready: false,
  signedIn: false,
  wishlist: new Set(),
  toggleWishlist: async () => {},
});

export function useCustomer() {
  return useContext(CustomerContext);
}

// The database client is a big download (about 70 KB), so it is only fetched
// for shoppers who are signed in. Everyone else never needs it on shop pages.
async function loadClient(): Promise<SupabaseClient> {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useT();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const client = useRef<SupabaseClient | null>(null);
  const signedIn = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const show = (id: string | null, saved: string[]) => {
      if (!active) return;
      signedIn.current = Boolean(id);
      setUserId(id);
      setWishlist(new Set(saved));
      setReady(true);
    };

    async function load(supabase: SupabaseClient, id: string | null) {
      if (!id) return show(null, []);
      const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", id);
      show(id, (data ?? []).map((row) => row.product_id as string));
    }

    async function sync() {
      if (!hasAuthCookie()) return show(null, []);
      const supabase = client.current ?? (client.current = await loadClient());
      if (!active) return;
      if (!unsubscribe) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" || event === "SIGNED_OUT") load(supabase, session?.user.id ?? null);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      }
      const { data } = await supabase.auth.getUser();
      await load(supabase, data.user?.id ?? null);
    }

    sync();
    // Logging in or out on this page, or in another tab.
    const onVisible = () => {
      if (document.visibilityState === "visible" && hasAuthCookie() !== signedIn.current) sync();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      unsubscribe?.();
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        router.push(loginPath(locale, pathname));
        return;
      }
      const supabase = client.current ?? (client.current = await loadClient());
      const saved = wishlist.has(productId);
      const update = (add: boolean) =>
        setWishlist((current) => {
          const next = new Set(current);
          if (add) next.add(productId);
          else next.delete(productId);
          return next;
        });

      update(!saved);
      const { error } = saved
        ? await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId)
        : await supabase.from("wishlist_items").insert({ product_id: productId });
      // 23505 = it was already saved (e.g. in another tab), which is fine.
      if (error && error.code !== "23505") update(saved);
    },
    [userId, wishlist, router, pathname, locale],
  );

  const value = useMemo(
    () => ({ ready, signedIn: Boolean(userId), wishlist, toggleWishlist }),
    [ready, userId, wishlist, toggleWishlist],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
