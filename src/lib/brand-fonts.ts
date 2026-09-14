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
  /** Weights the face supports, lowest to highest. */
  weights: readonly number[];
};

const VARIABLE = [300, 400, 500, 600, 700, 800] as const;

export const BRAND_FONTS = [
  { id: "instrument-serif", name: "Instrument Serif", category: "serif", weights: [400], stack: "var(--face-instrument-serif), Georgia, 'Times New Roman', serif" },
  { id: "fraunces", name: "Fraunces", category: "serif", weights: VARIABLE, stack: "var(--face-fraunces), Georgia, serif" },
  { id: "source-serif-4", name: "Source Serif 4", category: "serif", weights: VARIABLE, stack: "var(--face-source-serif-4), Georgia, serif" },
  { id: "inter", name: "Inter", category: "sans", weights: VARIABLE, stack: "var(--face-inter), system-ui, sans-serif" },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", category: "sans", weights: VARIABLE, stack: "var(--face-ibm-plex-sans), system-ui, sans-serif" },
  { id: "space-grotesk", name: "Space Grotesk", category: "sans", weights: [300, 400, 500, 600, 700], stack: "var(--face-space-grotesk), system-ui, sans-serif" },
  { id: "dm-sans", name: "DM Sans", category: "sans", weights: VARIABLE, stack: "var(--face-dm-sans), system-ui, sans-serif" },
  { id: "manrope", name: "Manrope", category: "sans", weights: VARIABLE, stack: "var(--face-manrope), system-ui, sans-serif" },
  { id: "sora", name: "Sora", category: "sans", weights: VARIABLE, stack: "var(--face-sora), system-ui, sans-serif" },
  { id: "nunito", name: "Nunito", category: "rounded", weights: VARIABLE, stack: "var(--face-nunito), ui-rounded, system-ui, sans-serif" },
  { id: "nunito-sans", name: "Nunito Sans", category: "sans", weights: VARIABLE, stack: "var(--face-nunito-sans), system-ui, sans-serif" },
  { id: "quicksand", name: "Quicksand", category: "rounded", weights: [300, 400, 500, 600, 700], stack: "var(--face-quicksand), ui-rounded, system-ui, sans-serif" },
  { id: "ibm-plex-mono", name: "IBM Plex Mono", category: "mono", weights: [400, 500], stack: "var(--face-ibm-plex-mono), ui-monospace, monospace" },
  { id: "jetbrains-mono", name: "JetBrains Mono", category: "mono", weights: VARIABLE, stack: "var(--face-jetbrains-mono), ui-monospace, monospace" },
] as const satisfies readonly BrandFont[];

export type BrandFontId = (typeof BRAND_FONTS)[number]["id"];

export function brandFont(id: BrandFontId): BrandFont {
  const font = BRAND_FONTS.find((f) => f.id === id);
  if (!font) throw new Error(`Unknown brand font: ${id}`);
  return font;
}

/** The nearest weight a face actually has, so a swap never asks for a weight that doesn't exist. */
export function nearestWeight(id: BrandFontId, wanted: number): number {
  return [...brandFont(id).weights].reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best));
}
