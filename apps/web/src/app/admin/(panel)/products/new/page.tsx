import Link from "next/link";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";
import type { Category } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon, color, position")
    .order("position");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-sm font-bold text-sky-dark">
          ← Back to your toys
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">➕ Add a new toy</h1>
        <p className="text-ink-soft">Fill in the steps below. Only the name and price are required.</p>
      </div>
      <ProductForm
        productId={null}
        photoFolderId={crypto.randomUUID()}
        status={null}
        initial={EMPTY_PRODUCT}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  );
}
