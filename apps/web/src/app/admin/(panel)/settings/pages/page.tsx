import Link from "next/link";
import { buttonClasses, Card } from "@/components/ui";
import { PAGE_DRAFTS, PAGE_SLUGS } from "@/lib/policyDrafts";
import { isMissingTable, type ShopPageRow } from "@/lib/shopPages";
import { createClient } from "@/lib/supabase/server";

const ICONS = { contact: "📮", privacy: "🔒", terms: "📜", refunds: "↩️", shipping: "🚚" } as const;
const PATHS = { contact: "/contact", privacy: "/policies/privacy", terms: "/policies/terms", refunds: "/policies/refunds", shipping: "/policies/shipping" } as const;

export default async function PolicyPagesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("shop_pages").select("slug, title, updated_at");
  const rows = (data ?? []) as Pick<ShopPageRow, "slug" | "title" | "updated_at">[];

  return (
    <div className="flex flex-col gap-4">
      {isMissingTable(error) && (
        <p role="alert" className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
          ⚠️ Run <code>0008_shop_identity.sql</code> in Supabase → SQL Editor before editing these pages.
        </p>
      )}
      <Card className="flex flex-col gap-2 bg-sky/10">
        <p>
          Razorpay and Indian e-commerce rules ask every online shop for these pages. Each one starts with suggested text
          that already uses your shop name, contact details, delivery charges and return days.{" "}
          <strong>Please read them and change anything that isn&apos;t true for your shop.</strong> They are linked at the
          bottom of every page.
        </p>
      </Card>
      <ul className="flex flex-col gap-3">
        {PAGE_SLUGS.map((slug) => {
          const row = rows.find((item) => item.slug === slug);
          return (
            <li key={slug}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-xl">
                    <span aria-hidden>{ICONS[slug]}</span> {row?.title || PAGE_DRAFTS[slug].title}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {row
                      ? `✏️ Your own text · changed ${new Date(row.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                      : "💡 Suggested text — not checked by you yet"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={PATHS[slug]} target="_blank" className={buttonClasses("ghost", "sm")}>
                    View
                  </Link>
                  <Link href={`/admin/settings/pages/${slug}`} className={buttonClasses("primary", "sm")}>
                    Edit
                  </Link>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
