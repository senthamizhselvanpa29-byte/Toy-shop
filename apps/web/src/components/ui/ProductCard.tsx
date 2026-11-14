import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AgeGroup } from "@toyshop/shared";
import { cn } from "@/lib/cn";
import { AgeBadge, Badge } from "./Badge";
import { Button, buttonClasses } from "./Button";
import { PriceTag } from "./PriceTag";
import { bgColor, type ThemeColor } from "./colors";

export type ProductCardData = {
  name: string;
  categoryName: string;
  ageGroup: AgeGroup;
  pricePaise: number;
  mrpPaise?: number;
  stock: number;
  imageUrl?: string;
  // Shown when there is no photo yet.
  placeholderIcon?: string;
  placeholderColor?: ThemeColor;
  isNew?: boolean;
};

// Words on the card; the shop passes them in the shopper's language.
export type CardLabels = {
  new: string;
  soldOut: string;
  seeToy: string;
  onlyLeft: string; // "{count}" is replaced
  addToCart: string;
  outOfStock: string;
  off: string; // "{percent}" is replaced
  mrp: string;
  ages: Partial<Record<AgeGroup, string>>;
};

export const DEFAULT_CARD_LABELS: CardLabels = {
  new: "New",
  soldOut: "Sold out",
  seeToy: "See toy →",
  onlyLeft: "Only {count} left!",
  addToCart: "Add to cart 🛒",
  outOfStock: "Out of stock",
  off: "{percent}% off",
  mrp: "MRP",
  ages: {},
};

// With `href`, the whole card links to the toy's page (shop). Without it, the
// card shows its own buttons (previews in the owner area and style guide).
export function ProductCard({
  product,
  href,
  topRight,
  labels = DEFAULT_CARD_LABELS,
  className,
}: {
  product: ProductCardData;
  labels?: CardLabels;
  href?: string;
  // Extra control over the photo's top-right corner (e.g. the wishlist heart).
  topRight?: ReactNode;
  className?: string;
}) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-bubble border-2 border-ink/10 bg-white shadow-soft transition hover:-translate-y-1",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center",
          bgColor[product.placeholderColor ?? "sky"],
        )}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span
            className="text-7xl transition-transform group-hover:scale-110"
            aria-hidden
          >
            {product.placeholderIcon ?? "🧸"}
          </span>
        )}
        {product.isNew && (
          <Badge color="ink" className="absolute top-3 left-3">
            {labels.new}
          </Badge>
        )}
        {topRight && <div className="absolute top-3 right-3 z-10">{topRight}</div>}
        {!href && !topRight && (
          <button
            type="button"
            aria-label={`Add ${product.name} to wishlist`}
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-soft transition hover:scale-110 focus-visible:outline-3 focus-visible:outline-sky-dark"
          >
            🤍
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
          {product.categoryName}
        </p>
        <h3 className="line-clamp-2 text-lg leading-snug">
          {href ? (
            <Link
              href={href}
              className="after:absolute after:inset-0 after:rounded-bubble focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-sky-dark"
            >
              {product.name}
            </Link>
          ) : (
            product.name
          )}
        </h3>
        <div>
          <AgeBadge age={product.ageGroup} label={labels.ages[product.ageGroup]} />
        </div>
        <PriceTag
          pricePaise={product.pricePaise}
          mrpPaise={product.mrpPaise}
          offLabel={labels.off}
          mrpLabel={labels.mrp}
          className="mt-auto pt-1"
        />
        {lowStock && (
          <p className="text-sm font-bold text-orange-dark">
            {labels.onlyLeft.replace("{count}", String(product.stock))}
          </p>
        )}
        {href ? (
          <span
            aria-hidden
            className={cn(
              buttonClasses(outOfStock ? "ghost" : "primary", "sm"),
              "mt-1 w-full group-hover:animate-wiggle",
            )}
          >
            {outOfStock ? labels.soldOut : labels.seeToy}
          </span>
        ) : (
          <Button
            variant={outOfStock ? "ghost" : "primary"}
            size="sm"
            disabled={outOfStock}
            className="mt-1 w-full hover:animate-wiggle"
          >
            {outOfStock ? labels.outOfStock : labels.addToCart}
          </Button>
        )}
      </div>
    </article>
  );
}
