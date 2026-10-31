import type { AgeGroup, CategoryColor, ProductStatus } from "@toyshop/shared";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: CategoryColor;
  position: number;
};

export type ProductImage = {
  id: string;
  storage_path: string;
  alt_text: string;
  position: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string | null;
  age_group: AgeGroup;
  brand: string;
  price_paise: number;
  mrp_paise: number | null;
  stock: number;
  sku: string | null;
  gst_rate: number;
  weight_grams: number | null;
  bis_license: string;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export function productImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}

export const STATUS_LABELS: Record<ProductStatus, { label: string; icon: string }> = {
  draft: { label: "Draft", icon: "📝" },
  published: { label: "Live in shop", icon: "🟢" },
  archived: { label: "Hidden", icon: "🙈" },
};
