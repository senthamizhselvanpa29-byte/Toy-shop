"use client";

import { cn } from "@/lib/cn";
import { useCustomer } from "./CustomerProvider";

export function WishlistButton({
  productId,
  productName,
  variant = "icon",
}: {
  productId: string;
  productName: string;
  variant?: "icon" | "full";
}) {
  const { wishlist, toggleWishlist } = useCustomer();
  const saved = wishlist.has(productId);
  const label = saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggleWishlist(productId)}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-2.5 font-heading transition focus-visible:outline-3 focus-visible:outline-sky-dark",
          saved ? "border-bubblegum-dark bg-bubblegum/20 text-bubblegum-dark" : "border-ink/15 bg-white hover:border-bubblegum",
        )}
      >
        <span aria-hidden>{saved ? "❤️" : "🤍"}</span>
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full bg-white/90 text-xl shadow-soft transition hover:scale-110 focus-visible:outline-3 focus-visible:outline-sky-dark"
    >
      <span aria-hidden>{saved ? "❤️" : "🤍"}</span>
    </button>
  );
}
