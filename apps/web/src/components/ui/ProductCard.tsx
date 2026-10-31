import Image from "next/image";
import type { AgeGroup } from "@toyshop/shared";
import { cn } from "@/lib/cn";
import { AgeBadge, Badge } from "./Badge";
import { Button } from "./Button";
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

export function ProductCard({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-bubble border-2 border-ink/10 bg-white shadow-soft transition hover:-translate-y-1",
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
            New
          </Badge>
        )}
        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-soft transition hover:scale-110 focus-visible:outline-3 focus-visible:outline-sky-dark"
        >
          🤍
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-bold tracking-wide text-ink-soft uppercase">
          {product.categoryName}
        </p>
        <h3 className="line-clamp-2 text-lg leading-snug">{product.name}</h3>
        <div>
          <AgeBadge age={product.ageGroup} />
        </div>
        <PriceTag
          pricePaise={product.pricePaise}
          mrpPaise={product.mrpPaise}
          className="mt-auto pt-1"
        />
        {lowStock && (
          <p className="text-sm font-bold text-orange-dark">
            Only {product.stock} left!
          </p>
        )}
        <Button
          variant={outOfStock ? "ghost" : "primary"}
          size="sm"
          disabled={outOfStock}
          className="mt-1 w-full hover:animate-wiggle"
        >
          {outOfStock ? "Out of stock" : "Add to cart 🛒"}
        </Button>
      </div>
    </article>
  );
}
