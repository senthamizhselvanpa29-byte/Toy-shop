import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/CartProvider";
import { CustomerProvider } from "@/components/shop/CustomerProvider";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { getCategories } from "@/lib/shop";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const categories = await getCategories();
  return (
    <CustomerProvider>
      <CartProvider>
        <ShopHeader categories={categories} />
        <main className="mx-auto max-w-7xl px-4">{children}</main>
        <ShopFooter categories={categories} />
      </CartProvider>
    </CustomerProvider>
  );
}
