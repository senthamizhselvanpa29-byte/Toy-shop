import { ProductCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import { cardLabels, type Translator } from "@/lib/i18n";
import { toCardData, type ShopProduct } from "@/lib/shop";
import { WishlistButton } from "./WishlistButton";

export function ProductGrid({
  products,
  t,
  className,
}: {
  products: ShopProduct[];
  t: Translator;
  className?: string;
}) {
  const labels = cardLabels(t);
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <li key={product.id} className="flex">
          <ProductCard
            product={toCardData(product)}
            href={`/toys/${product.slug}`}
            labels={labels}
            topRight={<WishlistButton productId={product.id} productName={product.name} />}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
