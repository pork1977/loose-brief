/*
 * The curated fonts a brand can use. Each one is loaded in lib/fonts.ts and
 * exposes a --face-* CSS variable; the stack adds a system fallback so text
 * still reads properly before the face arrives or if it fails to load.
 *
 * Free text font names are deliberately not supported. A name outside this
 * list can't be loaded, licensed or exported reliably.
 */

export type FontCategory = "serif" | "sans" | "rounded" | "mono";

export type BrandFont = {
  id: string;
  name: string;
  category: FontCategory;
  stack: string;
};

export const BRAND_FONTS = [
  {
    id: "instrument-serif",
    name: "Instrument Serif",
    category: "serif",
    stack: "var(--face-instrument-serif), Georgia, 'Times New Roman', serif",
  },
  {
    id: "inter",
    name: "Inter",
    category: "sans",
    stack: "var(--face-inter), system-ui, sans-serif",
  },
  {
    id: "ibm-plex-sans",
    name: "IBM Plex Sans",
    category: "sans",
    stack: "var(--face-ibm-plex-sans), system-ui, sans-serif",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    category: "sans",
    stack: "var(--face-space-grotesk), system-ui, sans-serif",
  },
  {
    id: "nunito",
    name: "Nunito",
    category: "rounded",
    stack: "var(--face-nunito), ui-rounded, system-ui, sans-serif",
  },
  {
    id: "nunito-sans",
    name: "Nunito Sans",
    category: "sans",
    stack: "var(--face-nunito-sans), system-ui, sans-serif",
  },
  {
    id: "ibm-plex-mono",
    name: "IBM Plex Mono",
    category: "mono",
    stack: "var(--face-ibm-plex-mono), ui-monospace, monospace",
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    category: "mono",
    stack: "var(--face-jetbrains-mono), ui-monospace, monospace",
  },
] as const satisfies readonly BrandFont[];

export type BrandFontId = (typeof BRAND_FONTS)[number]["id"];

export function brandFont(id: BrandFontId): BrandFont {
  const font = BRAND_FONTS.find((f) => f.id === id);
  if (!font) throw new Error(`Unknown brand font: ${id}`);
  return font;
}
