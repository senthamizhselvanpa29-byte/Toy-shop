import Link from "next/link";
import { buttonClasses } from "@/components/ui";
import type { Category } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { bgColor, isThemeColor } from "@/components/ui/colors";
import { AccountLink } from "./AccountLink";

export function ShopHeader({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink/5 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-heading text-2xl" aria-label="Toy Shop home">
          <span className="text-3xl" aria-hidden>
            🧸
          </span>
          Toy <span className="-ml-1.5 text-bubblegum-dark">Shop</span>
        </Link>

        <form action="/toys" role="search" className="order-last w-full sm:order-none sm:ml-4 sm:w-auto sm:flex-1">
          <label htmlFor="shop-search" className="sr-only">
            Search toys
          </label>
          <div className="flex rounded-full border-2 border-ink/15 bg-white focus-within:border-sky-dark focus-within:ring-4 focus-within:ring-sky/30">
            <input
              id="shop-search"
              name="q"
              type="search"
              placeholder="Search for teddy, puzzle, car…"
              className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-2.5 outline-none"
            />
            <button type="submit" className="rounded-full px-4 text-xl" aria-label="Search">
              🔍
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {/* On phones the category chips below cover browsing, so this is hidden. */}
          <span className="hidden sm:block">
            <Link href="/toys" className={buttonClasses("primary", "sm")}>
              All toys
            </Link>
          </span>
          <AccountLink />
        </div>
      </div>

      {categories.length > 0 && (
        <nav aria-label="Categories" className="mx-auto max-w-7xl px-4 pb-3">
          <ul className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <li key={category.id} className="shrink-0">
                <Link
                  href={`/toys?category=${category.slug}`}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold text-ink transition hover:-translate-y-0.5",
                    isThemeColor(category.color) ? bgColor[category.color] : "bg-sunshine",
                  )}
                >
                  <span aria-hidden>{category.icon}</span>
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
