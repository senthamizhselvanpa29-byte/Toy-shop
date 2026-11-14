import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  AGE_GROUPS,
  discountPercent,
  localized,
  type AgeGroup,
  type ContentTranslations,
  type Locale,
} from "@toyshop/shared";
import type { ProductCardData, ThemeColor } from "@/components/ui";
import { productImageUrl, type Category } from "@/lib/catalog";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

// Customer-facing reads. Uses a plain, signed-out client (no cookies); the
// database rules only return published toys anyway.
function publicClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Shop pages depend on the shopper's language, so they're built per visit.
// The toy list itself is cached for a minute (and refreshed straight away when
// the owner changes something — see refreshCatalog) to keep pages fast.
export const CATALOG_TAG = "catalog";

export type ShopCategory = Pick<Category, "id" | "name" | "slug" | "icon" | "color">;

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
  updatedAt: string;
  category: ShopCategory | null;
  images: { url: string; alt: string }[];
  // Every language's name and summary, so search finds toys in any language.
  searchText: string;
};

const PRODUCT_FIELDS =
  "id, slug, name, short_description, description, translations, age_group, brand, price_paise, mrp_paise, stock, weight_grams, bis_license, sku, is_featured, is_demo, created_at, updated_at, categories(id, name, slug, icon, color, translations), product_images(storage_path, alt_text, position)";

type CategoryRow = ShopCategory & { translations: ContentTranslations | null; position?: number };

type Row = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  translations: ContentTranslations | null;
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
  updated_at: string;
  categories: CategoryRow | null;
  product_images: { storage_path: string; alt_text: string; position: number }[];
};

function toCategory(row: CategoryRow, locale: Locale): ShopCategory {
  return {
    id: row.id,
    slug: row.slug,
    icon: row.icon,
    color: row.color,
    name: localized(row.translations, locale, "name", row.name),
  };
}

function toShopProduct(row: Row, locale: Locale): ShopProduct {
  const name = localized(row.translations, locale, "name", row.name);
  const translations = Object.values(row.translations ?? {});
  return {
    id: row.id,
    slug: row.slug,
    name,
    shortDescription: localized(row.translations, locale, "short_description", row.short_description),
    description: localized(row.translations, locale, "description", row.description),
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
    updatedAt: row.updated_at,
    category: row.categories ? toCategory(row.categories, locale) : null,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ url: productImageUrl(image.storage_path), alt: image.alt_text || name })),
    searchText: [
      row.name,
      row.short_description,
      row.brand,
      row.categories?.name,
      ...translations.flatMap((item) => [item?.name, item?.short_description]),
      ...Object.values(row.categories?.translations ?? {}).map((item) => item?.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase(),
  };
}

export function toCardData(product: ShopProduct): ProductCardData {
  const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return {
    name: product.name,
    categoryName: product.category?.name ?? "",
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

// ---------------------------------------------------------------------------
// Cached reads (shared by every language)
// ---------------------------------------------------------------------------

const loadCategoryRows = unstable_cache(
  async (): Promise<CategoryRow[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await publicClient()
      .from("categories")
      .select("id, name, slug, icon, color, position, translations")
      .order("position")
      .order("name");
    return (data ?? []) as CategoryRow[];
  },
  ["shop-categories"],
  { tags: [CATALOG_TAG], revalidate: 60 },
);

const loadProductRows = unstable_cache(
  async (): Promise<Row[]> => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await publicClient()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1000);
    return (data ?? []) as unknown as Row[];
  },
  ["shop-products"],
  { tags: [CATALOG_TAG], revalidate: 60 },
);

export async function getCategories(locale: Locale = "en"): Promise<ShopCategory[]> {
  return (await loadCategoryRows()).map((row) => toCategory(row, locale));
}

export async function getProductBySlug(slug: string, locale: Locale = "en"): Promise<ShopProduct | null> {
  const row = (await loadProductRows()).find((item) => item.slug === slug);
  return row ? toShopProduct(row, locale) : null;
}

// ---------------------------------------------------------------------------
// Browsing with filters
// ---------------------------------------------------------------------------

// Labels come from the translations ("price.under-500", "sort.new").
export const PRICE_RANGES = [
  { id: "under-500", min: 0, max: 49999 },
  { id: "500-1000", min: 50000, max: 100000 },
  { id: "1000-2000", min: 100001, max: 200000 },
  { id: "over-2000", min: 200001, max: null },
] as const;

export const SORTS = ["new", "price-asc", "price-desc", "discount"] as const;
export type SortId = (typeof SORTS)[number];

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

const discountOf = (product: ShopProduct) =>
  product.mrpPaise ? discountPercent(product.pricePaise, product.mrpPaise) : 0;

// All published toys matching the filters, sorted (in-stock first).
async function findProducts(filters: BrowseFilters, locale: Locale): Promise<ShopProduct[]> {
  let products = (await loadProductRows()).map((row) => toShopProduct(row, locale));

  if (filters.category) products = products.filter((product) => product.category?.slug === filters.category);
  if (filters.age && AGE_GROUPS.some((group) => group.id === filters.age)) {
    products = products.filter((product) => product.ageGroup === filters.age);
  }
  const range = PRICE_RANGES.find((item) => item.id === filters.price);
  if (range) {
    products = products.filter(
      (product) => product.pricePaise >= range.min && (range.max === null || product.pricePaise <= range.max),
    );
  }
  if (filters.inStock) products = products.filter((product) => product.stock > 0);

  // Every word must appear somewhere (in any language).
  const words = (filters.q ?? "").toLocaleLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  if (words.length) products = products.filter((product) => words.every((word) => product.searchText.includes(word)));

  const sort = ((SORTS as readonly string[]).includes(filters.sort ?? "") ? filters.sort : "new") as SortId;
  return products.sort((a, b) => {
    if ((a.stock > 0) !== (b.stock > 0)) return a.stock > 0 ? -1 : 1;
    if (sort === "price-asc") return a.pricePaise - b.pricePaise;
    if (sort === "price-desc") return b.pricePaise - a.pricePaise;
    if (sort === "discount") return discountOf(b) - discountOf(a);
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export async function browseProducts(filters: BrowseFilters, locale: Locale = "en") {
  const products = await findProducts(filters, locale);
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  return {
    products: products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: products.length,
    page,
    pageCount,
  };
}

export async function getHomeSections(locale: Locale = "en") {
  const all = await findProducts({}, locale);
  const inStock = all.filter((product) => product.stock > 0);
  return {
    featured: inStock.filter((product) => product.isFeatured).slice(0, 8),
    newArrivals: inStock.slice(0, 8),
    deals: inStock.filter((product) => discountOf(product) >= 20).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 4),
    total: all.length,
  };
}

export async function getRelatedProducts(product: ShopProduct, locale: Locale = "en"): Promise<ShopProduct[]> {
  if (!product.category) return [];
  const products = await findProducts({ category: product.category.slug, inStock: true }, locale);
  return products.filter((item) => item.id !== product.id).slice(0, 4);
}

export async function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  return (await loadProductRows()).map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}

// A signed-in customer's saved toys (newest first). Hidden toys are left out.
export async function getWishlistProducts(
  supabase: SupabaseClient,
  userId: string,
  locale: Locale = "en",
): Promise<ShopProduct[]> {
  const { data } = await supabase
    .from("wishlist_items")
    .select(`created_at, products(${PRODUCT_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { products: Row | null }[])
    .map((item) => item.products)
    .filter((row): row is Row => row !== null)
    .map((row) => toShopProduct(row, locale));
}
