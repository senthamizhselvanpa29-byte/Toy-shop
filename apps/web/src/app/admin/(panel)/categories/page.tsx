import { CategoryManager } from "@/components/admin/CategoryManager";
import type { Category } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon, color, position").order("position").order("name"),
    supabase.from("products").select("category_id"),
  ]);

  const productCounts: Record<string, number> = {};
  for (const product of products ?? []) {
    if (product.category_id) {
      productCounts[product.category_id] = (productCounts[product.category_id] ?? 0) + 1;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">🗂️ Categories</h1>
        <p className="text-ink-soft">
          Group your toys so shoppers find them easily. Use ▲ ▼ to change the order in the shop.
        </p>
      </div>
      <CategoryManager categories={(categories ?? []) as Category[]} productCounts={productCounts} />
    </div>
  );
}
