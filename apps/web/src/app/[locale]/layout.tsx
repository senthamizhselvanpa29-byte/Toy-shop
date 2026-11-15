import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { MESSAGES } from "@toyshop/shared/messages";
import { CartProvider } from "@/components/cart/CartProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { AnnouncementBar } from "@/components/shop/AnnouncementBar";
import { CustomerProvider } from "@/components/shop/CustomerProvider";
import { NavigationProgress } from "@/components/shop/NavigationProgress";
import { PausedNotice } from "@/components/shop/PausedNotice";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n";
import { isLocale, LOCALES } from "@/lib/locales";
import { getCategories } from "@/lib/shop";
import { getShopProfile } from "@/lib/shopProfile";
import { indicFontClass } from "./fonts";

// One copy of the shop per language: "/" (English), "/ta" and "/hi".
// (Don't add `dynamicParams = false` here: it would also stop toys added
// after a deploy from getting a page. Unknown languages are refused below.)
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const shop = await getShopProfile(locale);
  return {
    // Pages give their own title ("Puzzles"); the shop's name is added after it.
    title: { default: shop.name, template: `%s · ${shop.name}` },
    description: shop.tagline || getT(locale)("meta.description"),
    applicationName: shop.name,
    ...(shop.logoUrl ? { icons: { icon: shop.logoUrl, apple: shop.logoUrl } } : {}),
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getT(locale);
  const [categories, shop] = await Promise.all([getCategories(locale), getShopProfile(locale)]);

  return (
    <I18nProvider locale={locale} messages={MESSAGES[locale]} className={cn("contents", indicFontClass(locale))}>
      <CustomerProvider>
        <CartProvider>
          <NavigationProgress />
          {shop.paused && <PausedNotice message={shop.paused.message} t={t} />}
          {shop.announcement && <AnnouncementBar {...shop.announcement} />}
          <ShopHeader categories={categories} t={t} shop={shop} />
          <main className="mx-auto max-w-7xl px-4">
            {/* Keep this keyed Fragment. The page slot depends on error.tsx, whose
                code can still be loading when React first reaches <main>; React
                (19.2 canary, bundled with Next.js 15.5) then mis-reads <main> and
                redraws the whole page. With the Fragment in between, it waits
                correctly instead. */}
            <Fragment key="page">{children}</Fragment>
          </main>
          <ShopFooter categories={categories} t={t} shop={shop} />
          {shop.whatsapp && <WhatsAppButton number={shop.whatsapp.number} message={shop.whatsapp.message} />}
        </CartProvider>
      </CustomerProvider>
    </I18nProvider>
  );
}
