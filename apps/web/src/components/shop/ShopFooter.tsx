import Link from "next/link";
import type { ReactNode } from "react";
import { AGE_GROUPS } from "@toyshop/shared";
import type { Translator } from "@/lib/i18n";
import type { ShopCategory } from "@/lib/shop";

export function ShopFooter({ categories, t }: { categories: ShopCategory[]; t: Translator }) {
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-2xl">
            <span aria-hidden>🧸</span> Toy Shop
          </p>
          <p className="mt-2 text-white/75">
            {t("footer.tagline")}
          </p>
        </div>
        <FooterList title={t("home.byCategory")}>
          {categories.slice(0, 8).map((category) => (
            <li key={category.id}>
              <Link href={`/toys?category=${category.slug}`} className="hover:underline">
                {category.icon} {category.name}
              </Link>
            </li>
          ))}
        </FooterList>
        <FooterList title={t("home.byAge")}>
          {AGE_GROUPS.map((group) => (
            <li key={group.id}>
              <Link href={`/toys?age=${encodeURIComponent(group.id)}`} className="hover:underline">
                {t(`age.${group.id}`)}
              </Link>
            </li>
          ))}
        </FooterList>
        <FooterList title={t("footer.help")}>
          <li>
            <Link href="/toys" className="hover:underline">
              {t("header.allToys")}
            </Link>
          </li>
          <li>
            <Link href="/account/orders" className="hover:underline">
              {t("footer.myOrders")}
            </Link>
          </li>
        </FooterList>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/60">
        © {new Date().getFullYear()} Toy Shop · {t("footer.gst")}
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
