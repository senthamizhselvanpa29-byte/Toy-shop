"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fieldErrors,
  PRODUCT_STATUSES,
  productFormSchema,
  slugify,
  type ProductFormInput,
  type ProductStatus,
} from "@toyshop/shared";
import { requireOwner } from "@/lib/auth";
import { isDemoImagePath, PRODUCT_IMAGES_BUCKET } from "@/lib/catalog";

export type SaveProductResult = { errors: Record<string, string> };

const UNIQUE_VIOLATION = "23505";

function refreshShopPages(productId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
}

// Inserts a product, adding a short suffix to the web address if the name is taken.
async function insertWithUniqueSlug(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
  name: string,
) {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug =
      attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("products")
      .insert({ ...row, slug })
      .select("id")
      .single();
    if (!error) return { id: data.id as string, error: null };
    const slugTaken =
      error.code === UNIQUE_VIOLATION && error.message.includes("slug");
    if (!slugTaken) return { id: null, error };
  }
  return { id: null, error: { code: "slug", message: "Couldn't pick a web address" } };
}

// Deletes photo files that no product uses any more.
async function removeUnusedFiles(supabase: SupabaseClient, allPaths: string[]) {
  const paths = allPaths.filter((path) => !isDemoImagePath(path));
  if (paths.length === 0) return;
  const { data: stillUsed } = await supabase
    .from("product_images")
    .select("storage_path")
    .in("storage_path", paths);
  const used = new Set((stillUsed ?? []).map((row) => row.storage_path));
  const unused = paths.filter((path) => !used.has(path));
  if (unused.length) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(unused);
  }
}

export async function saveProduct(
  productId: string | null,
  input: ProductFormInput,
  status: ProductStatus | "keep",
): Promise<SaveProductResult> {
  const { supabase } = await requireOwner();

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const values = parsed.data;

  const validPath = (path: string) => path.startsWith("products/") || isDemoImagePath(path);
  if (values.images.some((image) => !validPath(image.storagePath))) {
    return { errors: { images: "One of the photos didn't upload properly. Please remove it and try again." } };
  }

  const row: Record<string, unknown> = {
    name: values.name,
    short_description: values.shortDescription,
    description: values.description,
    category_id: values.categoryId,
    age_group: values.ageGroup,
    brand: values.brand,
    price_paise: values.price,
    mrp_paise: values.mrp,
    stock: values.stock ?? 0,
    sku: values.sku,
    gst_rate: values.gstRate,
    weight_grams: values.weightGrams,
    bis_license: values.bisLicense,
    is_featured: values.isFeatured,
    // Once the owner edits a demo toy, it becomes one of their own.
    is_demo: false,
  };
  if (status !== "keep") row.status = status;

  let id = productId;
  let error: { code?: string; message: string } | null = null;

  if (id) {
    ({ error } = await supabase.from("products").update(row).eq("id", id));
  } else {
    row.status ??= "draft";
    ({ id, error } = await insertWithUniqueSlug(supabase, row, values.name));
  }

  if (error || !id) {
    if (error?.code === UNIQUE_VIOLATION && error.message.includes("sku")) {
      return { errors: { sku: "Another toy already uses this SKU" } };
    }
    return { errors: { form: "Couldn't save the toy. Please try again." } };
  }

  // Replace the photo list with the one from the form.
  const { data: oldImages } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  await supabase.from("product_images").delete().eq("product_id", id);
  if (values.images.length) {
    const { error: imageError } = await supabase.from("product_images").insert(
      values.images.map((image, position) => ({
        product_id: id,
        storage_path: image.storagePath,
        alt_text: image.altText,
        position,
      })),
    );
    if (imageError) {
      return { errors: { images: "The toy was saved, but its photos weren't. Please try saving again." } };
    }
  }
  const keptPaths = new Set(values.images.map((image) => image.storagePath));
  await removeUnusedFiles(
    supabase,
    (oldImages ?? []).map((image) => image.storage_path).filter((path) => !keptPaths.has(path)),
  );

  refreshShopPages(id);
  redirect(`/admin/products/${id}?saved=${status === "published" ? "published" : "1"}`);
}

export async function duplicateProduct(productId: string) {
  const { supabase } = await requireOwner();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(storage_path, alt_text, position)")
    .eq("id", productId)
    .single();
  if (!product) throw new Error("Toy not found");

  const name = `${product.name} (copy)`.slice(0, 120);
  const copy = {
    short_description: product.short_description,
    description: product.description,
    category_id: product.category_id,
    age_group: product.age_group,
    brand: product.brand,
    price_paise: product.price_paise,
    mrp_paise: product.mrp_paise,
    stock: product.stock,
    gst_rate: product.gst_rate,
    weight_grams: product.weight_grams,
    bis_license: product.bis_license,
    name,
    sku: null,
    status: "draft",
    is_featured: false,
  };
  const images = product.product_images;

  const { id: newId, error } = await insertWithUniqueSlug(supabase, copy, name);
  if (error || !newId) throw new Error("Couldn't copy the toy");

  if (images?.length) {
    // Both toys point at the same photo files until one of them changes.
    await supabase.from("product_images").insert(
      images.map((image: { storage_path: string; alt_text: string; position: number }) => ({
        product_id: newId,
        storage_path: image.storage_path,
        alt_text: image.alt_text,
        position: image.position,
      })),
    );
  }

  refreshShopPages();
  redirect(`/admin/products/${newId}?saved=copied`);
}

export async function setProductStatus(productId: string, status: ProductStatus) {
  if (!PRODUCT_STATUSES.includes(status)) throw new Error("Unknown status");
  const { supabase } = await requireOwner();
  await supabase.from("products").update({ status }).eq("id", productId);
  refreshShopPages(productId);
}

export async function deleteDemoProducts() {
  const { supabase } = await requireOwner();

  const { data: demo } = await supabase
    .from("products")
    .select("id, product_images(storage_path)")
    .eq("is_demo", true);
  const ids = (demo ?? []).map((product) => product.id);
  if (ids.length) {
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) throw new Error("Couldn't remove the demo toys");
    await removeUnusedFiles(
      supabase,
      (demo ?? []).flatMap((product) =>
        (product.product_images as { storage_path: string }[]).map((image) => image.storage_path),
      ),
    );
  }

  refreshShopPages();
  redirect("/admin?demoRemoved=1");
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireOwner();

  const { data: images } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error("Couldn't delete the toy");

  await removeUnusedFiles(
    supabase,
    (images ?? []).map((image) => image.storage_path),
  );

  refreshShopPages();
  redirect("/admin/products?deleted=1");
}
