import { LocaleLink as Link } from "@/components/i18n/LocaleLink";
import type { ReactNode } from "react";
import { AGE_GROUPS, formatIndianMobile } from "@toyshop/shared";
import type { Translator } from "@/lib/i18n";
import { POLICY_SLUGS } from "@/lib/policyDrafts";
import type { ShopCategory } from "@/lib/shop";
import type { ShopProfile } from "@/lib/shopProfile";
import { whatsappLink } from "@/lib/whatsapp";
import { ShopLogo } from "./ShopLogo";

export function ShopFooter({ categories, t, shop }: { categories: ShopCategory[]; t: Translator; shop: ShopProfile }) {
  const phoneDigits = shop.phone.replace(/[^\d+]/g, "");
  return (
    <footer className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-3">
          <ShopLogo {...shop} tone="light" className="text-2xl" />
          <p className="text-white/75">{shop.tagline || t("footer.tagline")}</p>
          {shop.social.length > 0 && (
            <div>
              <p className="sr-only">{t("footer.follow")}</p>
              <ul className="flex flex-wrap gap-2">
                {shop.social.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.url}
                      rel="noopener"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                    >
                      <span aria-hidden>{item.icon}</span> {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
            <Link href="/account/orders" className="hover:underline">
              {t("footer.myOrders")}
            </Link>
          </li>
          <li>
            <Link href="/contact" className="hover:underline">
              {t("footer.contact")}
            </Link>
          </li>
          {POLICY_SLUGS.map((slug) => (
            <li key={slug}>
              <Link href={`/policies/${slug}`} className="hover:underline">
                {t(`policy.${slug}`)}
              </Link>
            </li>
          ))}
        </FooterList>
        <FooterList title={t("footer.contact")}>
          {shop.phone && (
            <li>
              📞 <a href={`tel:${phoneDigits}`} className="hover:underline">{shop.phone}</a>
            </li>
          )}
          {shop.whatsapp && (
            <li>
              💬{" "}
              <a href={whatsappLink(shop.whatsapp.number, shop.whatsapp.message || t("whatsapp.message"))} rel="noopener" target="_blank" className="hover:underline">
                {t("contact.whatsapp")} {formatIndianMobile(shop.whatsapp.number)}
              </a>
            </li>
          )}
          {shop.email && (
            <li className="break-all">
              ✉️ <a href={`mailto:${shop.email}`} className="hover:underline">{shop.email}</a>
            </li>
          )}
          {shop.address && <li className="whitespace-pre-line text-white/75">📍 {shop.address}</li>}
          {!shop.phone && !shop.email && !shop.whatsapp && (
            <li>
              <Link href="/contact" className="hover:underline">
                {t("contact.chat")} →
              </Link>
            </li>
          )}
        </FooterList>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/60">
        © {new Date().getFullYear()} {shop.legalName}
        {shop.state && ` · ${shop.state}`}
        {shop.gstMode === "regular" && ` · ${t("footer.gst")}`}
        {shop.gstMode !== "none" && shop.gstin && ` · GSTIN ${shop.gstin}`}
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
