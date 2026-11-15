import { cn } from "@/lib/cn";

type Props = {
  name: string;
  logoUrl: string | null;
  logoEmoji: string;
  showNameWithLogo: boolean;
  // "light" for dark backgrounds (the footer).
  tone?: "dark" | "light";
  className?: string;
};

// The shop's logo (or emoji) and name, as the owner set them in Settings.
// The last word of the name is coloured, like "Toy Shop" → "Toy" + pink "Shop".
export function ShopLogo({ name, logoUrl, logoEmoji, showNameWithLogo, tone = "dark", className }: Props) {
  const words = name.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : null;
  const showName = !logoUrl || showNameWithLogo;
  return (
    <span className={cn("flex min-w-0 items-center gap-2 font-heading", className)}>
      {logoUrl ? (
        // Logos come in any shape; a plain image keeps their proportions at a fixed height.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={showName ? "" : name} height={40} className="h-10 w-auto max-w-40 object-contain" />
      ) : (
        <span className="text-[1.2em]" aria-hidden>
          {logoEmoji}
        </span>
      )}
      {showName && (
        <span className="truncate">
          {words.join(" ")}
          {last && (
            <>
              {" "}
              <span className={tone === "dark" ? "text-bubblegum-dark" : "text-bubblegum"}>{last}</span>
            </>
          )}
        </span>
      )}
    </span>
  );
}
