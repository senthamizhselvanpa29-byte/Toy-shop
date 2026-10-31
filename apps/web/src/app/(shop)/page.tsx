import Link from "next/link";
import type { ReactNode } from "react";
import { AGE_GROUPS } from "@toyshop/shared";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonClasses, CategoryTile, TobySays } from "@/components/ui";
import { getCategories, getHomeSections } from "@/lib/shop";

// Refresh at most once a minute (and right away when the owner saves a toy).
export const revalidate = 60;

const ageStyles = [
  "bg-bubblegum",
  "bg-sunshine",
  "bg-mint",
  "bg-sky",
  "bg-grape",
];
const ageEmoji = ["👶", "🧒", "👧", "🧑", "🧑‍🎓"];

export default async function HomePage() {
  const [categories, sections] = await Promise.all([getCategories(), getHomeSections()]);

  return (
    <div className="flex flex-col gap-14 py-8">
      <section className="relative overflow-hidden rounded-bubble bg-gradient-to-br from-sky to-grape px-6 py-12 text-center text-ink shadow-soft sm:px-12 sm:py-16 sm:text-left">
        <div className="relative z-10 flex flex-col items-center gap-5 sm:max-w-xl sm:items-start">
          <span className="rounded-full bg-white/80 px-4 py-1 text-sm font-bold">
            🎉 Happy toys for happy kids
          </span>
          <h1 className="text-4xl leading-tight font-semibold sm:text-6xl">
            Find a toy they&apos;ll <span className="text-white drop-shadow">love!</span>
          </h1>
          <p className="text-lg sm:text-xl">
            Teddies, puzzles, science kits and more — picked for every age and delivered across India.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/toys" className={buttonClasses("primary", "lg")}>
              Shop all toys 🧸
            </Link>
            {sections.deals.length > 0 && (
              <Link href="/toys?sort=discount" className={buttonClasses("ghost", "lg") + " bg-white/70"}>
                See deals
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
        <TobySays title="Our shelves are being stocked!">
          New toys are on their way. Please check back soon.
        </TobySays>
      ) : (
        <>
          {categories.length > 0 && (
            <Section title="Shop by category" emoji="🗂️">
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={`/toys?category=${category.slug}`} className="block rounded-bubble focus-visible:outline-3 focus-visible:outline-sky-dark">
                      <CategoryTile name={category.name} icon={category.icon} color={category.color} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sections.featured.length > 0 && (
            <Section title="Customer favourites" emoji="⭐" href="/toys">
              <ProductGrid products={sections.featured} />
            </Section>
          )}

          {sections.deals.length > 0 && (
            <Section title="Super deals" emoji="🏷️" href="/toys?sort=discount">
              <ProductGrid products={sections.deals} />
            </Section>
          )}

          <Section title="Shop by age" emoji="🎂">
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
                    {group.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          {sections.newArrivals.length > 0 && (
            <Section title="New arrivals" emoji="✨" href="/toys?sort=new">
              <ProductGrid products={sections.newArrivals} />
            </Section>
          )}
        </>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🛡️", title: "Child-friendly toys", text: "Every toy is chosen with little hands in mind." },
          { icon: "🚚", title: "Delivery across India", text: "From our shop to your doorstep." },
          { icon: "💳", title: "Easy payments", text: "UPI, cards and cash on delivery — coming soon." },
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
  children,
}: {
  title: string;
  emoji: string;
  href?: string;
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
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
