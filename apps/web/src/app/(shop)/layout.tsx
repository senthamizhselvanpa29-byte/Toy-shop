import type { ReactNode } from "react";
import { CustomerProvider } from "@/components/shop/CustomerProvider";
import { ShopFooter } from "@/components/shop/ShopFooter";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { getCategories } from "@/lib/shop";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const categories = await getCategories();
  return (
    <CustomerProvider>
      <ShopHeader categories={categories} />
      <main className="mx-auto max-w-7xl px-4">{children}</main>
      <ShopFooter categories={categories} />
    </CustomerProvider>
  );
}
