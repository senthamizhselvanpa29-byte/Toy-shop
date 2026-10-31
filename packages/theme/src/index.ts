// Design tokens shared by the web app and (later) the mobile app.
// Keep these in sync with theme.css, which exposes the same values to Tailwind.

export const colors = {
  cream: "#FFF9EE",
  ink: "#2B2A4C",
  inkSoft: "#5B5A7A",
  sunshine: "#FFC93C",
  sunshineDark: "#E0A800",
  sky: "#4FC3F7",
  skyDark: "#0288D1",
  bubblegum: "#FF7EB6",
  bubblegumDark: "#D81B72",
  mint: "#5EDCA6",
  mintDark: "#157A52",
  orange: "#FF9F43",
  orangeDark: "#B85C00",
  grape: "#9B7BFF",
  white: "#FFFFFF",
} as const;

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 9999,
} as const;

export const fonts = {
  heading: "Fredoka",
  body: "Nunito",
  // Covers Tamil, Hindi and other Indian scripts.
  indic: "Baloo 2",
} as const;

export type ColorName = keyof typeof colors;
