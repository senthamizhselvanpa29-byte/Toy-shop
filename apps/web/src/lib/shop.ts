import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGE_GROUPS, discountPercent, type AgeGroup } from "@toyshop/shared";
import type { ProductCardData, ThemeColor } from "@/components/ui";
import { productImageUrl, type Category } from "@/lib/catalog";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

// Customer-facing reads. Uses a plain, signed-out client (no cookies) so shop
// pages can be cached; the database rules only return published toys anyway.
function publicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  ageGroup: AgeGroup;
  brand: string;
  pricePaise: number;
  mrpPaise: number | null;
  stock: number;
  weightGrams: number | null;
  bisLicense: string;
  sku: string | null;
  isFeatured: boolean;
  isDemo: boolean;
  createdAt: string;
  category: Pick<Category, "id" | "name" | "slug" | "icon" | "color"> | null;
  images: { url: string; alt: string }[];
};

const PRODUCT_FIELDS =
  "id, slug, name, short_description, description, age_group, brand, price_paise, mrp_paise, stock, weight_grams, bis_license, sku, is_featured, is_demo, created_at, categories(id, name, slug, icon, color), product_images(storage_path, alt_text, position)";

type Row = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  age_group: AgeGroup;
  brand: string;
  price_paise: number;
  mrp_paise: number | null;
  stock: number;
  weight_grams: number | null;
  bis_license: string;
  sku: string | null;
  is_featured: boolean;
  is_demo: boolean;
  created_at: string;
  categories: ShopProduct["category"];
  product_images: { storage_path: string; alt_text: string; position: number }[];
};

function toShopProduct(row: Row): ShopProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    ageGroup: row.age_group,
    brand: row.brand,
    pricePaise: row.price_paise,
    mrpPaise: row.mrp_paise,
    stock: row.stock,
    weightGrams: row.weight_grams,
    bisLicense: row.bis_license,
    sku: row.sku,
    isFeatured: row.is_featured,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    category: row.categories,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ url: productImageUrl(image.storage_path), alt: image.alt_text || row.name })),
  };
}

export function toCardData(product: ShopProduct): ProductCardData {
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return {
    name: product.name,
    categoryName: product.category?.name ?? "Toy",
    ageGroup: product.ageGroup,
    pricePaise: product.pricePaise,
    mrpPaise: product.mrpPaise ?? undefined,
    stock: product.stock,
    imageUrl: product.images[0]?.url,
    placeholderIcon: product.category?.icon,
    placeholderColor: (product.category?.color as ThemeColor) ?? "sky",
    // Demo toys were all added at once, so only the owner's own toys get "New".
    isNew: !product.isDemo && new Date(product.createdAt).getTime() > twoWeeksAgo,
  };
}

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await publicClient()
    .from("categories")
    .select("id, name, slug, icon, color, position")
    .order("position")
    .order("name");
  return (data ?? []) as Category[];
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await publicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  return data ? toShopProduct(data as unknown as Row) : null;
}

// ---------------------------------------------------------------------------
// Browsing with filters
// ---------------------------------------------------------------------------

export const PRICE_RANGES = [
  { id: "under-500", label: "Under ₹500", min: 0, max: 49999 },
  { id: "500-1000", label: "₹500 – ₹1,000", min: 50000, max: 100000 },
  { id: "1000-2000", label: "₹1,000 – ₹2,000", min: 100001, max: 200000 },
  { id: "over-2000", label: "Over ₹2,000", min: 200001, max: null },
] as const;

export const SORTS = [
  { id: "new", label: "Newest first" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "discount", label: "Biggest discount" },
] as const;

export type SortId = (typeof SORTS)[number]["id"];

export type BrowseFilters = {
  q?: string;
  category?: string;
  age?: string;
  price?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
};

export const PAGE_SIZE = 24;

// All published toys matching the filters, sorted (in-stock first).
async function findProducts(filters: BrowseFilters): Promise<ShopProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = publicClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "published")
    .limit(1000);

  if (filters.category) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }
  if (filters.age && AGE_GROUPS.some((group) => group.id === filters.age)) {
    query = query.eq("age_group", filters.age);
  }
  const range = PRICE_RANGES.find((item) => item.id === filters.price);
  if (range) {
    query = query.gte("price_paise", range.min);
    if (range.max !== null) query = query.lte("price_paise", range.max);
  }
  if (filters.inStock) query = query.gt("stock", 0);

  // Keep only letters, numbers and spaces so the search can't break the query.
  const search = (filters.q ?? "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
  if (search) {
    const pattern = `%${search.replace(/\s+/g, "%")}%`;
    query = query.or(
      `name.ilike.${pattern},short_description.ilike.${pattern},brand.ilike.${pattern}`,
    );
  }

  const { data } = await query;
  const products = ((data ?? []) as unknown as Row[]).map(toShopProduct);

  const sort = (SORTS.some((item) => item.id === filters.sort) ? filters.sort : "new") as SortId;
  const off = (product: ShopProduct) =>
    product.mrpPaise ? discountPercent(product.pricePaise, product.mrpPaise) : 0;
  products.sort((a, b) => {
    // Toys in stock come before sold-out ones.
    if ((a.stock > 0) !== (b.stock > 0)) return a.stock > 0 ? -1 : 1;
    if (sort === "price-asc") return a.pricePaise - b.pricePaise;
    if (sort === "price-desc") return b.pricePaise - a.pricePaise;
    if (sort === "discount") return off(b) - off(a);
    return b.createdAt.localeCompare(a.createdAt);
  });
  return products;
}

export async function browseProducts(filters: BrowseFilters) {
  const products = await findProducts(filters);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  return {
    products: products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: products.length,
    page,
    pageCount,
  };
}

export async function getHomeSections() {
  const all = await findProducts({});
  const inStock = all.filter((product) => product.stock > 0);
  const off = (product: ShopProduct) =>
    product.mrpPaise ? discountPercent(product.pricePaise, product.mrpPaise) : 0;
  return {
    featured: inStock.filter((product) => product.isFeatured).slice(0, 8),
    newArrivals: [...inStock].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    deals: inStock.filter((product) => off(product) >= 20).sort((a, b) => off(b) - off(a)).slice(0, 4),
    total: all.length,
  };
}

export async function getRelatedProducts(product: ShopProduct): Promise<ShopProduct[]> {
  if (!product.category) return [];
  const products = await findProducts({ category: product.category.slug, inStock: true });
  return products.filter((item) => item.id !== product.id).slice(0, 4);
}

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  if (!isSupabaseConfigured()) return [];
  const { data } = await publicClient()
    .from("products")
    .select("slug, updated_at")
    .eq("status", "published")
    .limit(5000);
  return (data ?? []).map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

// A signed-in customer's saved toys (newest first). Hidden toys are left out.
export async function getWishlistProducts(supabase: SupabaseClient, userId: string): Promise<ShopProduct[]> {
  const { data } = await supabase
    .from("wishlist_items")
    .select(`created_at, products(${PRODUCT_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { products: Row | null }[])
    .map((item) => item.products)
    .filter((row): row is Row => row !== null)
    .map(toShopProduct);
}
