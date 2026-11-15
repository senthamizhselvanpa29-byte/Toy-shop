import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AGE_GROUPS, type Locale } from "@toyshop/shared";
import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonClasses, CategoryTile, TobySays } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { getCategories, getHomeSections } from "@/lib/shop";

const ageStyles = ["bg-bubblegum", "bg-sunshine", "bg-mint", "bg-sky", "bg-grape"];
// Single-character emoji only: combined ones (like "student") contain an
// invisible joiner that makes browsers download extra font files.
const ageEmoji = ["👶", "🧒", "👧", "🧑", "🎓"];

// Built ahead of time; refreshed when the owner saves a toy, and at least hourly.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternatesFor(locale, "/") };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = getT(locale);
  const [categories, sections] = await Promise.all([getCategories(t.locale), getHomeSections(t.locale)]);

  return (
    <div className="flex flex-col gap-14 py-8">
      <section className="relative overflow-hidden rounded-bubble bg-gradient-to-br from-sky to-grape px-6 py-12 text-center text-ink shadow-soft sm:px-12 sm:py-16 sm:text-left">
        <div className="relative z-10 flex flex-col items-center gap-5 sm:max-w-xl sm:items-start">
          <span className="rounded-full bg-white/80 px-4 py-1 text-sm font-bold">🎉 {t("home.badge")}</span>
          <h1 className="text-4xl leading-tight font-semibold sm:text-6xl">
            {t("home.titleStart")} <span className="text-white drop-shadow">{t("home.titleEnd")}</span>
          </h1>
          <p className="text-lg sm:text-xl">{t("home.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              {t("home.shopAll")} 🧸
            </Link>
            {sections.deals.length > 0 && (
              <Link href="/toys?sort=discount" className={buttonClasses("ghost", "lg") + " bg-white/70"}>
                {t("home.seeDeals")}
              </Link>
            )}
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-6 -bottom-8 hidden text-[13rem] leading-none select-none sm:block motion-safe:animate-bounce"
          style={{ animationDuration: "3s" }}
          aria-hidden
        >
          🧸
        </div>
        <span className="absolute top-6 right-1/3 hidden text-5xl sm:block" aria-hidden>
          ⭐
        </span>
        <span className="absolute right-10 top-10 hidden text-4xl sm:block" aria-hidden>
          🎈
        </span>
      </section>

      {sections.total === 0 ? (
        <TobySays title={t("home.emptyTitle")}>{t("home.emptyText")}</TobySays>
      ) : (
        <>
          {categories.length > 0 && (
            <Section title={t("home.byCategory")} emoji="🗂️">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/toys?category=${category.slug}`}
                      className="block rounded-bubble focus-visible:outline-3 focus-visible:outline-sky-dark"
                    >
                      <CategoryTile name={category.name} icon={category.icon} color={category.color} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sections.featured.length > 0 && (
            <Section title={t("home.favourites")} emoji="⭐" href="/toys" seeAll={t("home.seeAll")}>
              <ProductGrid products={sections.featured} t={t} />
            </Section>
          )}

          {sections.deals.length > 0 && (
            <Section title={t("home.deals")} emoji="🏷️" href="/toys?sort=discount" seeAll={t("home.seeAll")}>
              <ProductGrid products={sections.deals} t={t} />
            </Section>
          )}

          <Section title={t("home.byAge")} emoji="🎂">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {AGE_GROUPS.map((group, index) => (
                <li key={group.id}>
                  <Link
                    href={`/toys?age=${encodeURIComponent(group.id)}`}
                    className={`${ageStyles[index]} flex flex-col items-center gap-1 rounded-bubble px-3 py-5 font-heading text-lg shadow-soft transition hover:-translate-y-1`}
                  >
                    <span className="text-4xl" aria-hidden>
                      {ageEmoji[index]}
                    </span>
                    {t(`age.${group.id}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          {sections.newArrivals.length > 0 && (
            <Section title={t("home.newArrivals")} emoji="✨" href="/toys?sort=new" seeAll={t("home.seeAll")}>
              <ProductGrid products={sections.newArrivals} t={t} />
            </Section>
          )}
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🛡️", title: t("home.trust1Title"), text: t("home.trust1Text") },
          { icon: "🚚", title: t("home.trust2Title"), text: t("home.trust2Text") },
          { icon: "💳", title: t("home.trust3Title"), text: t("home.trust3Text") },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-bubble bg-white p-5 shadow-soft">
            <span className="text-3xl" aria-hidden>
              {item.icon}
            </span>
            <div>
              <p className="font-heading text-lg">{item.title}</p>
              <p className="text-sm text-ink-soft">{item.text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Section({
  title,
  emoji,
  href,
  seeAll,
  children,
}: {
  title: string;
  emoji: string;
  href?: string;
  seeAll?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">
          <span aria-hidden>{emoji}</span> {title}
        </h2>
        {href && (
          <Link href={href} className="shrink-0 font-bold text-sky-dark hover:underline">
            {seeAll} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
