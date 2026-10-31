import { cn } from "@/lib/cn";
import { bgColor, isThemeColor } from "./colors";

type CategoryTileProps = {
  name: string;
  icon: string;
  color: string;
  className?: string;
};

export function CategoryTile({ name, icon, color, className }: CategoryTileProps) {
  return (
    <div
      className={cn(
        isThemeColor(color) ? bgColor[color] : "bg-sunshine",
        "flex flex-col items-center gap-2 rounded-bubble px-4 py-6 font-heading text-lg text-ink shadow-soft transition-transform hover:-translate-y-1",
        className,
      )}
    >
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      {name}
    </div>
  );
}
