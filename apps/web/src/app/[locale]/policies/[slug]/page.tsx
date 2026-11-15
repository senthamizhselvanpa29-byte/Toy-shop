import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@toyshop/shared";
import { RichText } from "@/components/shop/RichText";
import { getT } from "@/lib/i18n";
import { LOCALES } from "@/lib/locales";
import { POLICY_SLUGS } from "@/lib/policyDrafts";
import { alternatesFor } from "@/lib/seo";
import { getShopPage } from "@/lib/shopPages";
import { getShopProfile } from "@/lib/shopProfile";

// Privacy, terms, refunds and shipping: built ahead of time, refreshed when the
// owner edits them (Owner area → Settings → Policy pages).
export const revalidate = 3600;
// (No `dynamicParams = false`: with it, the Tamil and Hindi copies were not
// found. Unknown page names are turned away below instead.)

type Slug = (typeof POLICY_SLUGS)[number];
type Props = { params: Promise<{ locale: Locale; slug: string }> };

// One copy per language comes from the [locale] layout; this adds the pages.
export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

const isPolicy = (slug: string): slug is Slug => (POLICY_SLUGS as readonly string[]).includes(slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isPolicy(slug)) return {};
  const page = await getShopPage(slug, locale, await getShopProfile(locale));
  return { title: page.title, alternates: alternatesFor(locale, `/policies/${slug}`) };
}

export default async function PolicyPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isPolicy(slug)) notFound();
  const t = getT(locale);
  const page = await getShopPage(slug, locale, await getShopProfile(locale));
  const updated = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString(LOCALES.includes(locale) ? `${locale}-IN` : "en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 py-10" lang={page.lang}>
      <div>
        <h1 className="text-3xl sm:text-4xl">{page.title}</h1>
        {updated && <p className="mt-1 text-sm text-ink-soft">{t("policy.updated", { date: updated })}</p>}
        {page.lang !== locale && (
          <p className="mt-2 text-sm text-ink-soft" lang={locale}>
            {t("policy.englishOnly")}
          </p>
        )}
      </div>
      <RichText text={page.body} />
    </article>
  );
}
