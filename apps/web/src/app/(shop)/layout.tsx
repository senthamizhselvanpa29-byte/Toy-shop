import type { ReactNode } from "react";
import { MESSAGES } from "@toyshop/shared";
import { CartProvider } from "@/components/cart/CartProvider";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { CustomerProvider } from "@/components/shop/CustomerProvider";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { getT } from "@/lib/i18n";
import { getCategories } from "@/lib/shop";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const t = await getT();
  const categories = await getCategories(t.locale);
  return (
    <I18nProvider locale={t.locale} messages={MESSAGES[t.locale]}>
      <CustomerProvider>
        <CartProvider>
          <ShopHeader categories={categories} t={t} />
          <main className="mx-auto max-w-7xl px-4" lang={t.locale}>
            {children}
          </main>
          <ShopFooter categories={categories} t={t} />
        </CartProvider>
      </CustomerProvider>
    </I18nProvider>
  );
}
