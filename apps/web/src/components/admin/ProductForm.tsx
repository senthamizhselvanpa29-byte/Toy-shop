"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  AGE_GROUPS,
  GST_RATES,
  parseRupeesToPaise,
  type AgeGroup,
  type ProductStatus,
} from "@toyshop/shared";
import {
  Button,
  Card,
  describedBy,
  Field,
  Input,
  ProductCard,
  Select,
  Textarea,
  type ThemeColor,
} from "@/components/ui";
import { saveProduct } from "@/app/admin/(panel)/products/actions";
import { cn } from "@/lib/cn";
import { productImageUrl, STATUS_LABELS, type Category } from "@/lib/catalog";
import { PhotoManager, type PhotoItem } from "./PhotoManager";

export type ProductFormState = {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  ageGroup: AgeGroup;
  brand: string;
  price: string;
  mrp: string;
  stock: string;
  sku: string;
  gstRate: string;
  weightGrams: string;
  bisLicense: string;
  isFeatured: boolean;
  images: PhotoItem[];
};

export const EMPTY_PRODUCT: ProductFormState = {
  name: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  ageGroup: "3-5",
  brand: "",
  price: "",
  mrp: "",
  stock: "1",
  sku: "",
  gstRate: "12",
  weightGrams: "",
  bisLicense: "",
  isFeatured: false,
  images: [],
};

type ProductFormProps = {
  productId: string | null;
  // Storage folder for photos; the product id when editing.
  photoFolderId: string;
  status: ProductStatus | null;
  initial: ProductFormState;
  categories: Category[];
};

export function ProductForm({
  productId,
  photoFolderId,
  status,
  initial,
  categories,
}: ProductFormProps) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initial),
    [values, initial],
  );

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty || submitting) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, submitting]);

  function set<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function submit(nextStatus: ProductStatus | "keep") {
    setErrors({});
    setSubmitting(true);
    startTransition(async () => {
      const result = await saveProduct(productId, values, nextStatus);
      // Only reached when saving failed; success navigates away.
      setSubmitting(false);
      if (result?.errors) {
        setErrors(result.errors);
        const first = Object.keys(result.errors)[0];
        document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  const category = categories.find((item) => item.id === values.categoryId);
  const busy = pending || uploading;
  const errorCount = Object.keys(errors).length;

  // Props for a text-like control bound to one form value.
  const text = (key: keyof ProductFormState, hasHint = false) => ({
    id: `field-${key}`,
    value: values[key] as string,
    onChange: (event: { target: { value: string } }) =>
      set(key, event.target.value as never),
    ...describedBy(`field-${key}`, { error: errors[key], hint: hasHint ? "yes" : undefined }),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(status ? "keep" : "draft");
      }}
      className="grid gap-6 pb-24 xl:grid-cols-[minmax(0,1fr)_320px] xl:pb-0"
      noValidate
    >
      <div className="flex flex-col gap-6">
        {errorCount > 0 && (
          <p role="alert" className="rounded-2xl bg-bubblegum/15 px-4 py-3 font-bold text-bubblegum-dark">
            {errors.form ?? `Almost there! Please fix ${errorCount === 1 ? "the highlighted field" : `the ${errorCount} highlighted fields`} below.`}
          </p>
        )}

        <Section step={1} title="The basics">
          <Field id="field-name" label="Toy name" required error={errors.name}>
            <Input {...text("name")} placeholder="e.g. Rainbow Wooden Stacking Rings" maxLength={120} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="field-categoryId" label="Category" error={errors.categoryId}>
              <Select {...text("categoryId")}>
                <option value="">No category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.icon} {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-col gap-1.5">
              <span className="font-heading text-lg">Age group</span>
              <div role="radiogroup" aria-label="Age group" className="flex flex-wrap gap-2">
                {AGE_GROUPS.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    role="radio"
                    aria-checked={values.ageGroup === group.id}
                    onClick={() => set("ageGroup", group.id)}
                    className={cn(
                      "rounded-full border-2 px-3 py-1.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-sky-dark",
                      values.ageGroup === group.id
                        ? "border-sunshine-dark bg-sunshine"
                        : "border-ink/15 bg-white hover:border-ink/30",
                    )}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-ink-soft">
            Need a new category?{" "}
            <Link href="/admin/categories" className="font-bold text-sky-dark underline underline-offset-2">
              Manage categories
            </Link>
          </p>
        </Section>

        <Section step={2} title="Photos" hint="Clear, bright photos sell toys! The first one is the cover.">
          <div id="field-images">
            <PhotoManager
              photos={values.images}
              onChange={(images) => set("images", images)}
              folderId={photoFolderId}
              onUploadingChange={setUploading}
              error={errors.images}
            />
          </div>
        </Section>

        <Section step={3} title="Price & stock">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="field-price" label="Selling price (₹)" required error={errors.price}>
              <Input {...text("price")} inputMode="decimal" placeholder="499" />
            </Field>
            <Field
              id="field-mrp"
              label="MRP (₹)"
              hint="Optional. Shown crossed out, with the % off."
              error={errors.mrp}
            >
              <Input {...text("mrp", true)} inputMode="decimal" placeholder="799" />
            </Field>
            <Field id="field-stock" label="How many in stock?" error={errors.stock}>
              <Input {...text("stock")} inputMode="numeric" placeholder="10" />
            </Field>
            <Field id="field-gstRate" label="GST rate" error={errors.gstRate}>
              <Select {...text("gstRate")}>
                {GST_RATES.map((rate) => (
                  <option key={rate} value={String(rate)}>
                    {rate}%
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Section>

        <Section step={4} title="Describe it">
          <Field
            id="field-shortDescription"
            label="One-line summary"
            hint="Shown under the name. e.g. “Soft, safe and loved by toddlers”"
            error={errors.shortDescription}
          >
            <Input {...text("shortDescription", true)} maxLength={200} />
          </Field>
          <Field id="field-description" label="Full description" error={errors.description}>
            <Textarea
              {...text("description")}
              rows={6}
              maxLength={5000}
              placeholder="What makes this toy special? What's in the box? How does it help kids learn and play?"
            />
          </Field>
        </Section>

        <Section step={5} title="More details" hint="Optional, but useful for invoices and shipping.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="field-brand" label="Brand" error={errors.brand}>
              <Input {...text("brand")} maxLength={60} />
            </Field>
            <Field id="field-sku" label="SKU / item code" error={errors.sku}>
              <Input {...text("sku")} maxLength={60} />
            </Field>
            <Field id="field-weightGrams" label="Weight with box (grams)" error={errors.weightGrams}>
              <Input {...text("weightGrams")} inputMode="numeric" placeholder="350" />
            </Field>
            <Field
              id="field-bisLicense"
              label="BIS / ISI licence number"
              hint="Toys sold in India need BIS certification."
              error={errors.bisLicense}
            >
              <Input {...text("bisLicense", true)} maxLength={60} />
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-lg">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(event) => set("isFeatured", event.target.checked)}
              className="size-5 accent-bubblegum-dark"
            />
            ⭐ Feature this toy on the home page
          </label>
        </Section>
      </div>

      <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
        <Card className="flex flex-col gap-3">
          {status && (
            <p className="text-sm text-ink-soft">
              Status:{" "}
              <strong className="text-ink">
                {STATUS_LABELS[status].icon} {STATUS_LABELS[status].label}
              </strong>
            </p>
          )}
          <div className="hidden flex-col gap-3 xl:flex">
            <SaveButtons status={status} busy={busy} onSubmit={submit} />
          </div>
          {uploading && <p className="text-sm text-ink-soft">Waiting for photos to finish uploading…</p>}
          {dirty && !busy && <p className="text-sm text-orange-dark">You have unsaved changes.</p>}
        </Card>

        <div>
          <p className="mb-2 font-heading text-lg">👀 Preview</p>
          <ProductCard
            product={{
              name: values.name || "Your toy's name",
              categoryName: category?.name ?? "Category",
              ageGroup: values.ageGroup,
              pricePaise: parseRupeesToPaise(values.price) ?? 0,
              mrpPaise: parseRupeesToPaise(values.mrp) ?? undefined,
              stock: Number(values.stock) || 0,
              imageUrl: values.images[0] ? productImageUrl(values.images[0].storagePath) : undefined,
              placeholderIcon: category?.icon,
              placeholderColor: (category?.color as ThemeColor) ?? "sky",
              isNew: !productId,
            }}
          />
        </div>
      </aside>

      {/* On phones and tablets the save buttons stay at the bottom of the screen. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t-2 border-ink/10 bg-cream/95 p-3 backdrop-blur xl:hidden [&>button]:flex-1">
        <SaveButtons status={status} busy={busy} onSubmit={submit} compact />
      </div>
    </form>
  );
}

function SaveButtons({
  status,
  busy,
  onSubmit,
  compact = false,
}: {
  status: ProductStatus | null;
  busy: boolean;
  onSubmit: (status: ProductStatus | "keep") => void;
  compact?: boolean;
}) {
  const mainSize = compact ? "md" : "lg";
  if (status === "published") {
    return (
      <>
        <Button type="button" size={mainSize} disabled={busy} onClick={() => onSubmit("keep")}>
          {busy ? "Saving…" : "Save changes ✓"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onSubmit("draft")}>
          {compact ? "Move to drafts" : "Take out of shop (move to drafts)"}
        </Button>
      </>
    );
  }
  return (
    <>
      <Button type="button" size={mainSize} disabled={busy} onClick={() => onSubmit("published")}>
        {busy ? "Saving…" : compact ? "Publish 🚀" : "Publish to shop 🚀"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => onSubmit(status ? "keep" : "draft")}
      >
        {status ? "Save" : "Save as draft"}
      </Button>
    </>
  );
}

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky font-heading text-lg"
          aria-hidden
        >
          {step}
        </span>
        <div>
          <h2 className="text-2xl">{title}</h2>
          {hint && <p className="text-ink-soft">{hint}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}
