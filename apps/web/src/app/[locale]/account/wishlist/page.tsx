import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import { redirect } from "next/navigation";
import type { Locale } from "@toyshop/shared";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonClasses, TobySays } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { loginPath } from "@/lib/locales";
import { getWishlistProducts } from "@/lib/shop";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My wishlist · Toy Shop", robots: { index: false } };

export default async function WishlistPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getT(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginPath(locale, "/account/wishlist"));

  const products = await getWishlistProducts(supabase, user.id, t.locale);

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <Link href="/account" className="text-sm font-bold text-sky-dark">
          ← {t("account.title")}
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">❤️ {t("account.wishlist")}</h1>
        <p className="text-ink-soft">
          {t(products.length === 1 ? "wishlist.countOne" : "wishlist.count", { count: products.length })}
        </p>
      </div>
      {products.length === 0 ? (
        <TobySays
          title={t("wishlist.emptyTitle")}
          action={
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              {t("wishlist.find")} 🧸
            </Link>
          }
        >
          {t("wishlist.emptyText")}
        </TobySays>
      ) : (
        <ProductGrid products={products} t={t} />
      )}
    </div>
  );
}
