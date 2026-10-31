import Link from "next/link";
import type { ReactNode } from "react";
import { AGE_GROUPS } from "@toyshop/shared";
import type { Category } from "@/lib/catalog";

export function ShopFooter({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-2xl">
            <span aria-hidden>🧸</span> Toy Shop
          </p>
          <p className="mt-2 text-white/75">
            Happy toys for happy kids, delivered across India.
          </p>
        </div>
        <FooterList title="Shop by category">
          {categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link href={`/toys?category=${category.slug}`} className="hover:underline">
                {category.icon} {category.name}
              </Link>
            </li>
          ))}
        </FooterList>
        <FooterList title="Shop by age">
          {AGE_GROUPS.map((group) => (
            <li key={group.id}>
              <Link href={`/toys?age=${encodeURIComponent(group.id)}`} className="hover:underline">
                {group.label}
              </Link>
            </li>
          ))}
        </FooterList>
        <FooterList title="Help">
          <li>
            <Link href="/toys" className="hover:underline">
              All toys
            </Link>
          </li>
          <li className="text-white/75">Orders, delivery and returns information is coming soon.</li>
        </FooterList>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Toy Shop · Prices include GST
      </p>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-heading text-lg">{title}</p>
      <ul className="mt-3 flex flex-col gap-1.5 text-white/85">{children}</ul>
    </div>
  );
}
