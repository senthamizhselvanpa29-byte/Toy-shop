import type { ReactNode } from "react";
import type { AgeGroup } from "@toyshop/shared";
import { AGE_GROUPS } from "@toyshop/shared";
import { cn } from "@/lib/cn";
import { bgColor, type ThemeColor } from "./colors";

type BadgeProps = {
  color?: ThemeColor | "ink";
  children: ReactNode;
  className?: string;
};

export function Badge({ color = "sunshine", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-sm font-bold",
        color === "ink" ? "bg-ink text-white" : cn(bgColor[color], "text-ink"),
        className,
      )}
    >
      {children}
    </span>
  );
}

const ageColor: Record<AgeGroup, ThemeColor> = {
  "0-2": "bubblegum",
  "3-5": "sunshine",
  "6-8": "mint",
  "9-12": "sky",
  "12+": "grape",
};

export function AgeBadge({ age }: { age: AgeGroup }) {
  const label = AGE_GROUPS.find((group) => group.id === age)?.label ?? age;
  return (
    <Badge color={ageColor[age]}>
      <span aria-hidden>🎂</span>
      {label}
    </Badge>
  );
}
