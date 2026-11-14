import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { MESSAGES } from "@toyshop/shared/messages";
import { CartProvider } from "@/components/cart/CartProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { CustomerProvider } from "@/components/shop/CustomerProvider";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n";
import { isLocale, LOCALES } from "@/lib/locales";
import { getCategories } from "@/lib/shop";
import { indicFontClass } from "./fonts";

// One copy of the shop per language: "/" (English), "/ta" and "/hi".
// (Don't add `dynamicParams = false` here: it would also stop toys added
// after a deploy from getting a page. Unknown languages are refused below.)
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { description: getT(locale)("meta.description") } : {};
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
  const categories = await getCategories(locale);

  return (
    <div lang={locale} className={cn("contents", indicFontClass(locale))}>
      <I18nProvider locale={locale} messages={MESSAGES[locale]}>
        <CustomerProvider>
          <CartProvider>
            <ShopHeader categories={categories} t={t} />
            <main className="mx-auto max-w-7xl px-4">{children}</main>
            <ShopFooter categories={categories} t={t} />
          </CartProvider>
        </CustomerProvider>
      </I18nProvider>
    </div>
  );
}
