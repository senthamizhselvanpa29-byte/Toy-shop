import type { MetadataRoute } from "next";
import { LOCALES, localePath } from "@/lib/locales";
import { POLICY_SLUGS } from "@/lib/policyDrafts";
import { getAllProductSlugs, getCategories } from "@/lib/shop";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories()]);

  // Each page is listed once, with its Tamil and Hindi versions as alternates.
  const page = (path: string, extra: Omit<MetadataRoute.Sitemap[number], "url">): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((locale) => [locale, `${base}${localePath(locale, path)}`])),
    },
    ...extra,
  });

  return [
    page("/", { changeFrequency: "daily", priority: 1 }),
    page("/toys", { changeFrequency: "daily", priority: 0.9 }),
    page("/contact", { changeFrequency: "monthly", priority: 0.4 }),
    ...POLICY_SLUGS.map((slug) => page(`/policies/${slug}`, { changeFrequency: "monthly", priority: 0.3 })),
    ...categories.map((category) =>
      page(`/toys?category=${category.slug}`, { changeFrequency: "weekly", priority: 0.7 }),
    ),
    ...products.map((product) =>
      page(`/toys/${product.slug}`, { lastModified: product.updatedAt, changeFrequency: "weekly", priority: 0.8 }),
    ),
  ];
}
