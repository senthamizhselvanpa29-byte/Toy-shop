import { discountPercent, formatPaise } from "@toyshop/shared";
import { cn } from "@/lib/cn";

type PriceTagProps = {
  pricePaise: number;
  mrpPaise?: number;
  size?: "md" | "lg";
  className?: string;
};

export function PriceTag({
  pricePaise,
  mrpPaise,
  size = "md",
  className,
}: PriceTagProps) {
  const off = mrpPaise ? discountPercent(pricePaise, mrpPaise) : 0;

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span
        className={cn(
          "font-heading font-semibold text-ink",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
      >
        {formatPaise(pricePaise)}
      </span>
      {off > 0 && mrpPaise && (
        <>
          <span className="text-sm text-ink-soft line-through">
            <span className="sr-only">MRP </span>
            {formatPaise(mrpPaise)}
          </span>
          <span className="text-sm font-bold text-mint-dark">{off}% off</span>
        </>
      )}
    </div>
  );
}
