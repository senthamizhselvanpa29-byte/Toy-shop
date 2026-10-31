"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
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

export function CustomerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true);
      return;
    }
    const supabase = createClient();

    async function load(id: string | null) {
      setUserId(id);
      if (id) {
        const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", id);
        setWishlist(new Set((data ?? []).map((row) => row.product_id as string)));
      } else {
        setWishlist(new Set());
      }
      setReady(true);
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load(session?.user.id ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const supabase = createClient();
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
    [userId, wishlist, router, pathname],
  );

  const value = useMemo(
    () => ({ ready, signedIn: Boolean(userId), wishlist, toggleWishlist }),
    [ready, userId, wishlist, toggleWishlist],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
