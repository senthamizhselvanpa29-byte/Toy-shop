import type { Metadata } from "next";
import type { ReactNode } from "react";
import { formatIndianMobile, type Locale } from "@toyshop/shared";
import { RichText } from "@/components/shop/RichText";
import { Card } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { getShopPage } from "@/lib/shopPages";
import { getShopProfile } from "@/lib/shopProfile";
import { whatsappLink } from "@/lib/whatsapp";

// Built ahead of time; refreshed when the owner saves their settings.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: getT(locale)("footer.contact"), alternates: alternatesFor(locale, "/contact") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = getT(locale);
  const shop = await getShopProfile(locale);
  const page = await getShopPage("contact", locale, shop);
  const phoneDigits = shop.phone.replace(/[^\d+]/g, "");

  const rows = [
    shop.whatsapp && {
      icon: "💬",
      label: t("contact.whatsapp"),
      value: (
        <a href={whatsappLink(shop.whatsapp.number, shop.whatsapp.message || t("whatsapp.message"))} target="_blank" rel="noopener" className="font-bold text-sky-dark underline underline-offset-2">
          {formatIndianMobile(shop.whatsapp.number)} · {t("contact.chat")}
        </a>
      ),
    },
    shop.phone && {
      icon: "📞",
      label: t("contact.phone"),
      value: (
        <a href={`tel:${phoneDigits}`} className="font-bold text-sky-dark underline underline-offset-2">
          {shop.phone}
        </a>
      ),
    },
    shop.email && {
      icon: "✉️",
      label: t("contact.email"),
      value: (
        <a href={`mailto:${shop.email}`} className="font-bold break-all text-sky-dark underline underline-offset-2">
          {shop.email}
        </a>
      ),
    },
    shop.address && {
      icon: "📍",
      label: t("contact.address"),
      value: (
        <span className="whitespace-pre-line">
          {shop.legalName}
          {"\n"}
          {shop.address}
          {shop.state && !shop.address.toLowerCase().includes(shop.state.toLowerCase()) ? `\n${shop.state}` : ""}
        </span>
      ),
    },
  ].filter(Boolean) as { icon: string; label: string; value: ReactNode }[];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <h1 className="text-3xl sm:text-4xl">📮 {t("footer.contact")}</h1>
      <div lang={page.lang}>
        <RichText text={page.body} />
      </div>
      {rows.length > 0 && (
        <Card>
          <dl className="flex flex-col gap-4">
            {rows.map((row) => (
              <div key={row.label} className="flex gap-3">
                <dt className="text-2xl" aria-hidden>
                  {row.icon}
                </dt>
                <dd className="flex flex-col">
                  <span className="text-sm text-ink-soft">{row.label}</span>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
      <Card className="flex flex-col gap-2 bg-sky/10">
        <h2 className="text-xl">⚖️ {t("contact.grievance")}</h2>
        <p>{t("contact.grievanceText", { name: shop.grievanceOfficer || shop.legalName })}</p>
      </Card>
    </div>
  );
}
