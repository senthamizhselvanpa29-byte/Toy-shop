import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPaise } from "@toyshop/shared";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { AddToCart } from "@/components/cart/AddToCart";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { AgeBadge, Badge, Card, PriceTag, type ThemeColor } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { getProductBySlug, getRelatedProducts } from "@/lib/shop";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getT();
  const product = await getProductBySlug(slug, t.locale);
  if (!product) return { title: `${t("product.notFound")} · Toy Shop` };
  const description =
    product.shortDescription || product.description.slice(0, 150) || `${product.name} at Toy Shop`;
  return {
    title: `${product.name} · Toy Shop`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const t = await getT();
  const product = await getProductBySlug(slug, t.locale);
  if (!product) notFound();

  const related = await getRelatedProducts(product, t.locale);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const ageLabel = t(`age.${product.ageGroup}`);

  const details = [
    { label: t("product.age"), value: ageLabel },
    { label: t("product.brand"), value: product.brand },
    { label: t("product.weight"), value: product.weightGrams ? t("product.weightValue", { grams: product.weightGrams }) : "" },
    { label: t("product.bis"), value: product.bisLicense },
    { label: t("product.itemCode"), value: product.sku },
  ].filter((row) => row.value);

  return (
    <div className="flex flex-col gap-12 py-8">
      <nav aria-label={t("product.breadcrumb")} className="text-sm text-ink-soft">
        <Link href="/" className="hover:underline">{t("product.home")}</Link>
        {" / "}
        <Link href="/toys" className="hover:underline">{t("product.toys")}</Link>
        {product.category && (
          <>
            {" / "}
            <Link href={`/toys?category=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={product.images}
          name={product.name}
          placeholderIcon={product.category?.icon ?? "🧸"}
          placeholderColor={(product.category?.color as ThemeColor) ?? "sky"}
        />

        <div className="flex flex-col gap-5">
          {product.category && (
            <Link
              href={`/toys?category=${product.category.slug}`}
              className="text-sm font-bold tracking-wide text-ink-soft uppercase hover:underline"
            >
              {product.category.icon} {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl leading-tight sm:text-4xl">{product.name}</h1>
          {product.shortDescription && <p className="text-lg text-ink-soft">{product.shortDescription}</p>}

          <div className="flex flex-wrap gap-2">
            <AgeBadge age={product.ageGroup} label={ageLabel} />
            {outOfStock ? (
              <Badge color="ink">{t("card.soldOut")}</Badge>
            ) : lowStock ? (
              <Badge color="orange">{t("card.onlyLeft", { count: product.stock })}</Badge>
            ) : (
              <Badge color="mint">✓ {t("toys.inStock")}</Badge>
            )}
          </div>

          <div>
            <PriceTag
              pricePaise={product.pricePaise}
              mrpPaise={product.mrpPaise ?? undefined}
              size="lg"
              offLabel={t("card.off")}
              mrpLabel={t("card.mrp")}
            />
            <p className="text-sm text-ink-soft">{t("product.inclTaxes")}</p>
            {product.mrpPaise && product.mrpPaise > product.pricePaise && (
              <p className="text-sm font-bold text-mint-dark">
                {t("product.youSave", { amount: formatPaise(product.mrpPaise - product.pricePaise) })}
              </p>
            )}
          </div>

          <Card className="flex flex-col gap-3 border-sunshine-dark/40">
            <AddToCart productId={product.id} stock={product.stock} />
            <p className="text-center text-sm text-ink-soft">
              🔒 {t("product.secure")}
            </p>
            <WishlistButton productId={product.id} productName={product.name} variant="full" />
          </Card>

          {details.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-bubble bg-white p-5 shadow-soft">
              {details.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="font-bold">{row.label}</dt>
                  <dd className="text-ink-soft">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {product.description && (
        <section className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl">{t("product.about")}</h2>
          <div className="mt-3 flex flex-col gap-3 text-lg leading-relaxed">
            {product.description.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl sm:text-3xl">{t("product.related")} 💛</h2>
          <ProductGrid products={related} t={t} />
        </section>
      )}
    </div>
  );
}
