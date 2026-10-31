// Tailwind needs full class names written out, so theme colours are mapped here
// instead of being built from strings like `bg-${color}`.

export type ThemeColor =
  | "sunshine"
  | "sky"
  | "bubblegum"
  | "mint"
  | "orange"
  | "grape";

export const bgColor: Record<ThemeColor, string> = {
  sunshine: "bg-sunshine",
  sky: "bg-sky",
  bubblegum: "bg-bubblegum",
  mint: "bg-mint",
  orange: "bg-orange",
  grape: "bg-grape",
};

export function isThemeColor(value: string): value is ThemeColor {
  return value in bgColor;
}
