import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-bubble border-2 border-ink/10 bg-white p-5 shadow-soft",
        className,
      )}
      {...props}
    />
  );
}
