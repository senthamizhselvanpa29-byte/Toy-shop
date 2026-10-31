import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonClasses, TobySays } from "@/components/ui";
import { getWishlistProducts } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My wishlist · Toy Shop", robots: { index: false } };

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/wishlist");

  const products = await getWishlistProducts(supabase, user.id);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/account" className="text-sm font-bold text-sky-dark">
          ← My account
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">❤️ My wishlist</h1>
        <p className="text-ink-soft">
          {products.length} saved {products.length === 1 ? "toy" : "toys"} · tap the heart to remove one
        </p>
      </div>
      {products.length === 0 ? (
        <TobySays
          title="Your wishlist is empty"
          action={
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              Find toys to love 🧸
            </Link>
          }
        >
          Tap the 🤍 on any toy to save it here.
        </TobySays>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
