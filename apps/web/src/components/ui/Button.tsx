import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-sunshine text-ink hover:bg-sunshine-dark",
  secondary: "bg-sky text-ink hover:bg-sky-dark hover:text-white",
  success: "bg-mint text-ink hover:bg-mint-dark hover:text-white",
  danger: "bg-bubblegum-dark text-white hover:brightness-110",
  ghost: "bg-transparent text-ink shadow-none hover:bg-ink/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3 text-xl",
};

export const buttonFocusRing =
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-dark";

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-heading shadow-soft transition active:translate-y-0.5 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
    buttonFocusRing,
    variantClasses[variant],
    sizeClasses[size],
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClasses(variant, size), className)}
      {...props}
    />
  );
}
