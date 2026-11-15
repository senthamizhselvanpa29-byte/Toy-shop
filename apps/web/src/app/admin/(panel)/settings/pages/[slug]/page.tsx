import Link from "next/link";
import { notFound } from "next/navigation";
import { PageEditor } from "@/components/admin/settings/PageEditor";
import { emptyPlaceholders, isPageSlug, PAGE_DRAFTS, PLACEHOLDERS } from "@/lib/policyDrafts";
import { placeholderValues, type ShopPageRow } from "@/lib/shopPages";
import { readShopSettings, toShopProfile } from "@/lib/shopProfile";
import { createClient } from "@/lib/supabase/server";

export default async function EditPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPageSlug(slug)) notFound();
  const supabase = await createClient();
  const [{ data }, settings] = await Promise.all([
    supabase.from("shop_pages").select("*").eq("slug", slug).maybeSingle(),
    readShopSettings(supabase),
  ]);
  const row = data as ShopPageRow | null;
  const draft = PAGE_DRAFTS[slug];
  const values = placeholderValues(toShopProfile(settings, "en"));
  const body = row?.body || draft.body;
  const missing = emptyPlaceholders(body, values);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/settings/pages" className="self-start font-bold text-sky-dark hover:underline">
        ← All policy pages
      </Link>
      {missing.length > 0 && (
        <p role="status" className="rounded-2xl bg-sunshine/30 px-4 py-3">
          ⚠️ This page uses details you haven&apos;t filled in yet:{" "}
          <strong>{missing.map((key) => PLACEHOLDERS.find((p) => p.key === key)?.label).join(", ")}</strong>. Add them in{" "}
          <Link href="/admin/settings/shop" className="font-bold underline">
            Shop &amp; contact
          </Link>{" "}
          so the page doesn&apos;t show gaps.
        </p>
      )}
      <PageEditor
        slug={slug}
        isDraft={!row}
        draft={draft}
        placeholders={PLACEHOLDERS.map((p) => ({ ...p, value: values[p.key] }))}
        initial={{
          slug,
          title: { en: row?.title || draft.title, ta: row?.translations?.ta?.title ?? "", hi: row?.translations?.hi?.title ?? "" },
          body: { en: body, ta: row?.translations?.ta?.body ?? "", hi: row?.translations?.hi?.body ?? "" },
        }}
      />
    </div>
  );
}
