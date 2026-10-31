import Image from "next/image";
import Link from "next/link";
import { formatPaise, PRODUCT_STATUSES, type ProductStatus } from "@toyshop/shared";
import { SavedBanner } from "@/components/admin/SavedBanner";
import { Badge, Button, buttonClasses, Card, Input, TobySays } from "@/components/ui";
import { cn } from "@/lib/cn";
import { productImageUrl, STATUS_LABELS } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { duplicateProduct, setProductStatus } from "./actions";

type Row = {
  id: string;
  name: string;
  price_paise: number;
  stock: number;
  status: ProductStatus;
  is_demo: boolean;
  categories: { name: string; icon: string } | null;
  product_images: { storage_path: string; position: number }[];
};

const statusColor = { draft: "sunshine", published: "mint", archived: "grape" } as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; deleted?: string }>;
}) {
  const { q = "", status = "", deleted } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(
      "id, name, price_paise, stock, status, is_demo, categories(name, icon), product_images(storage_path, position)",
    )
    .order("updated_at", { ascending: false })
    .order("position", { referencedTable: "product_images", ascending: true })
    .limit(1, { referencedTable: "product_images" });

  const search = q.trim();
  if (search) query = query.ilike("name", `%${search.replace(/[%_,()]/g, " ")}%`);
  if ((PRODUCT_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);

  const { data, error } = await query;
  const products = (data ?? []) as unknown as Row[];
  const filtering = Boolean(search || status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">🧸 Your toys</h1>
          <p className="text-ink-soft">Add, edit and organise everything in your shop.</p>
        </div>
        <Link href="/admin/products/new" className={buttonClasses("primary", "lg")}>
          ➕ Add a toy
        </Link>
      </div>

      <SavedBanner kind={deleted ? "deleted" : undefined} />

      <form className="flex flex-wrap items-center gap-3" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search toys by name…"
          aria-label="Search toys by name"
          className="max-w-sm flex-1"
        />
        <div className="flex flex-wrap gap-2">
          {[{ id: "", label: "All" }, ...PRODUCT_STATUSES.map((id) => ({ id, label: STATUS_LABELS[id].label }))].map(
            (option) => (
              <Link
                key={option.id}
                href={{ query: { ...(search ? { q: search } : {}), ...(option.id ? { status: option.id } : {}) } }}
                aria-current={status === option.id ? "true" : undefined}
                className={cn(
                  "rounded-full border-2 px-4 py-2 text-sm font-bold",
                  status === option.id ? "border-sunshine-dark bg-sunshine" : "border-ink/15 bg-white hover:border-ink/30",
                )}
              >
                {option.label}
              </Link>
            ),
          )}
        </div>
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      {error && (
        <p role="alert" className="font-bold text-bubblegum-dark">
          Couldn&apos;t load your toys. Please refresh the page.
        </p>
      )}

      {!error && products.length === 0 && (
        <Card>
          {filtering ? (
            <TobySays title="No toys match that search">Try a different word or filter.</TobySays>
          ) : (
            <TobySays
              title="No toys yet!"
              action={
                <Link href="/admin/products/new" className={buttonClasses("primary", "lg")}>
                  Add your first toy 🚀
                </Link>
              }
            >
              Let&apos;s fill this shelf with something fun.
            </TobySays>
          )}
        </Card>
      )}

      {products.length > 0 && (
        <ul className="flex flex-col gap-3">
          {products.map((product) => {
            const cover = product.product_images[0];
            const label = STATUS_LABELS[product.status];
            return (
              <li key={product.id}>
                <Card className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex min-w-0 flex-1 items-center gap-4"
                  >
                    <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sky/30 text-4xl">
                      {cover ? (
                        <Image src={productImageUrl(cover.storage_path)} alt="" fill sizes="80px" className="object-cover" />
                      ) : (
                        <span aria-hidden>{product.categories?.icon ?? "🧸"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-xl">{product.name}</p>
                      <p className="text-sm text-ink-soft">
                        {product.categories ? `${product.categories.icon} ${product.categories.name}` : "No category"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-heading text-lg">{formatPaise(product.price_paise)}</span>
                        <Badge color={statusColor[product.status]}>
                          {label.icon} {label.label}
                        </Badge>
                        {product.is_demo && <Badge color="grape">🎭 Demo</Badge>}
                        <span
                          className={cn(
                            "text-sm font-bold",
                            product.stock === 0 ? "text-bubblegum-dark" : product.stock <= 5 ? "text-orange-dark" : "text-ink-soft",
                          )}
                        >
                          {product.stock === 0 ? "Out of stock" : `${product.stock} in stock`}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
                    <Link href={`/admin/products/${product.id}`} className={buttonClasses("secondary", "sm")}>
                      ✏️ Edit
                    </Link>
                    <form action={duplicateProduct.bind(null, product.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        📋 Copy
                      </Button>
                    </form>
                    <form
                      action={setProductStatus.bind(
                        null,
                        product.id,
                        product.status === "published" ? "archived" : "published",
                      )}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        {product.status === "published" ? "🙈 Hide" : "🚀 Publish"}
                      </Button>
                    </form>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
