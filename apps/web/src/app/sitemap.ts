import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/shop";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/toys`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${base}/toys?category=${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/toys/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
