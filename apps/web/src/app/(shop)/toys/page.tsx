import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AGE_GROUPS } from "@toyshop/shared";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { SortSelect } from "@/components/shop/SortSelect";
import { buttonClasses, TobySays } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n";
import { browseProducts, getCategories, PRICE_RANGES, SORTS } from "@/lib/shop";

type Params = { q?: string; category?: string; age?: string; price?: string; stock?: string; sort?: string; page?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const { q, category } = await searchParams;
  const t = await getT();
  const categories = category ? await getCategories(t.locale) : [];
  const name = categories.find((item) => item.slug === category)?.name;
  return { title: `${q ? `“${q}”` : name ?? t("header.allToys")} · Toy Shop` };
}

export default async function ToysPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const t = await getT();
  const filters = {
    q: params.q?.trim() || undefined,
    category: params.category || undefined,
    age: params.age || undefined,
    price: params.price || undefined,
    inStock: params.stock === "1",
    sort: params.sort || undefined,
    page: Number(params.page) || 1,
  };

  const [categories, result] = await Promise.all([getCategories(t.locale), browseProducts(filters, t.locale)]);
  const category = categories.find((item) => item.slug === filters.category);
  const age = AGE_GROUPS.find((item) => item.id === filters.age);
  const price = PRICE_RANGES.find((item) => item.id === filters.price);

  // Builds a link to this page with some filters changed (undefined removes one).
  const link = (changes: Partial<Params>) => {
    const next = new URLSearchParams();
    const merged: Params = { ...params, page: undefined, ...changes };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const query = next.toString();
    return query ? `/toys?${query}` : "/toys";
  };

  const active = [
    filters.q && { label: `“${filters.q}”`, href: link({ q: undefined }) },
    category && { label: `${category.icon} ${category.name}`, href: link({ category: undefined }) },
    age && { label: `🎂 ${t(`age.${age.id}`)}`, href: link({ age: undefined }) },
    price && { label: t(`price.${price.id}`), href: link({ price: undefined }) },
    filters.inStock && { label: t("toys.inStock"), href: link({ stock: undefined }) },
  ].filter(Boolean) as { label: string; href: string }[];

  const title = filters.q
    ? t("toys.resultsFor", { q: filters.q })
    : category
      ? `${category.icon} ${category.name}`
      : age
        ? t("toys.forAge", { age: t(`age.${age.id}`) })
        : t("header.allToys");

  const filterPanel = (
    <div className="flex flex-col gap-6">
      <FilterGroup title={t("toys.category")}>
        {categories.map((item) => (
          <FilterLink key={item.id} href={link({ category: item.slug === filters.category ? undefined : item.slug })} active={item.slug === filters.category}>
            {item.icon} {item.name}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={t("toys.age")}>
        {AGE_GROUPS.map((item) => (
          <FilterLink key={item.id} href={link({ age: item.id === filters.age ? undefined : item.id })} active={item.id === filters.age}>
            {t(`age.${item.id}`)}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={t("toys.price")}>
        {PRICE_RANGES.map((item) => (
          <FilterLink key={item.id} href={link({ price: item.id === filters.price ? undefined : item.id })} active={item.id === filters.price}>
            {t(`price.${item.id}`)}
          </FilterLink>
        ))}
      </FilterGroup>
      <FilterGroup title={t("toys.availability")}>
        <FilterLink href={link({ stock: filters.inStock ? undefined : "1" })} active={filters.inStock}>
          {t("toys.inStockOnly")}
        </FilterLink>
      </FilterGroup>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          <p className="text-ink-soft">
            {t(result.total === 1 ? "toys.countOne" : "toys.count", { count: result.total })}
          </p>
        </div>
        <Suspense>
          <SortSelect options={SORTS.map((id) => ({ id, label: t(`sort.${id}`) }))} label={t("sort.label")} />
        </Suspense>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 rounded-full bg-sunshine px-3 py-1 text-sm font-bold hover:bg-sunshine-dark"
              aria-label={t("toys.removeFilter", { label: item.label })}
            >
              {item.label} <span aria-hidden>✕</span>
            </Link>
          ))}
          <Link href="/toys" className="text-sm font-bold text-sky-dark hover:underline">
            {t("toys.clearAll")}
          </Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <details className="rounded-bubble bg-white p-4 shadow-soft lg:hidden">
            <summary className="cursor-pointer font-heading text-lg">🎛️ {t("toys.filters")}</summary>
            <div className="mt-4">{filterPanel}</div>
          </details>
          <div className="hidden lg:block">{filterPanel}</div>
        </aside>

        <div className="flex flex-col gap-8">
          {result.products.length === 0 ? (
            <TobySays
              title={t("toys.noneTitle")}
              action={
                <Link href="/toys" className={buttonClasses("primary")}>
                  {t("toys.seeAll")}
                </Link>
              }
            >
              {t("toys.noneText")}
            </TobySays>
          ) : (
            <ProductGrid products={result.products} t={t} className="lg:grid-cols-3 xl:grid-cols-4" />
          )}

          {result.pageCount > 1 && (
            <nav aria-label={t("toys.pages")} className="flex items-center justify-center gap-3">
              {result.page > 1 && (
                <Link href={link({ page: String(result.page - 1) })} className={buttonClasses("secondary", "sm")}>
                  ← {t("toys.previous")}
                </Link>
              )}
              <span className="font-bold">
                {t("toys.pageOf", { page: result.page, count: result.pageCount })}
              </span>
              {result.page < result.pageCount && (
                <Link href={link({ page: String(result.page + 1) })} className={buttonClasses("secondary", "sm")}>
                  {t("toys.next")} →
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 font-heading text-lg">{title}</p>
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">{children}</ul>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cn(
          "block rounded-full px-3 py-1.5 text-sm font-bold transition lg:rounded-xl",
          active ? "bg-sunshine" : "bg-white hover:bg-ink/5 lg:bg-transparent",
        )}
      >
        {active && <span aria-hidden>✓ </span>}
        {children}
      </Link>
    </li>
  );
}
