/** Typefaces from docs/design-spec.md §3, self-hosted by Next.js at build time. */
import {
  Cormorant_Garamond,
  EB_Garamond,
  Libre_Caslon_Display,
  Libre_Caslon_Text,
} from "next/font/google";

export const caslonDisplay = Libre_Caslon_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caslon-display",
  display: "swap",
});

export const caslonText = Libre_Caslon_Text({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-caslon-text",
  display: "swap",
});

export const garamond = EB_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

export const fontVariables = [caslonDisplay, caslonText, garamond, cormorant]
  .map((f) => f.variable)
  .join(" ");
