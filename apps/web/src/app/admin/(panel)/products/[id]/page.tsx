import Link from "next/link";
import { notFound } from "next/navigation";
import { paiseToRupeesInput } from "@toyshop/shared";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { ProductForm, type ProductFormState } from "@/components/admin/ProductForm";
import { SavedBanner } from "@/components/admin/SavedBanner";
import { Button, Card } from "@/components/ui";
import type { Category, Product, ProductImage } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct, duplicateProduct } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: product }, { data: images }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("product_images")
      .select("id, storage_path, alt_text, position")
      .eq("product_id", id)
      .order("position"),
    supabase.from("categories").select("id, name, slug, icon, color, position").order("position"),
  ]);
  if (!product) notFound();

  const p = product as Product;
  const initial: ProductFormState = {
    name: p.name,
    shortDescription: p.short_description,
    description: p.description,
    categoryId: p.category_id ?? "",
    ageGroup: p.age_group,
    brand: p.brand,
    price: paiseToRupeesInput(p.price_paise),
    mrp: paiseToRupeesInput(p.mrp_paise),
    stock: String(p.stock),
    sku: p.sku ?? "",
    gstRate: String(p.gst_rate),
    weightGrams: p.weight_grams ? String(p.weight_grams) : "",
    bisLicense: p.bis_license,
    isFeatured: p.is_featured,
    images: ((images ?? []) as ProductImage[]).map((image) => ({
      storagePath: image.storage_path,
      altText: image.alt_text,
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/products" className="text-sm font-bold text-sky-dark">
          ← Back to your toys
        </Link>
        <h1 className="mt-1 text-3xl sm:text-4xl">✏️ {p.name}</h1>
      </div>

      <SavedBanner kind={saved} />

      {p.is_demo && (
        <p className="rounded-2xl bg-grape/15 px-4 py-3 text-ink">
          🎭 <strong>This is a demo toy.</strong> Save any change and it becomes one of your own toys
          (it won&apos;t be removed with the other demo toys).
        </p>
      )}

      {/* key resets the form after each save so it shows the saved values */}
      <ProductForm
        key={p.updated_at}
        productId={p.id}
        photoFolderId={p.id}
        status={p.status}
        initial={initial}
        categories={(categories ?? []) as Category[]}
      />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl">More actions</h2>
          <p className="text-sm text-ink-soft">Copy this toy to add a similar one quickly, or delete it for good.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={duplicateProduct.bind(null, p.id)}>
            <Button type="submit" variant="secondary">
              📋 Make a copy
            </Button>
          </form>
          <form action={deleteProduct.bind(null, p.id)}>
            <ConfirmSubmitButton
              variant="danger"
              message={`Delete "${p.name}" for good? This can't be undone. (Tip: you can hide it instead.)`}
            >
              🗑️ Delete
            </ConfirmSubmitButton>
          </form>
        </div>
      </Card>
    </div>
  );
}
