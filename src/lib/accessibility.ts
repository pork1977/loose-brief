import { hexToRgb, oklabToRgb, rgbToHex, rgbToOklab } from "./palette";
import { colorPath, getPath, setPath, type BrandTokens, type Mode } from "./tokens";

/*
 * Contrast checks for a brand's tokens, using the WCAG 2 contrast formula.
 *
 * Each check pairs two tokens the way the website actually uses them. Text
 * needs 4.5:1. Buttons against the page, and accent colours used for icons
 * and chart lines, need 3:1 (WCAG's rule for non-text graphics).
 */

function channel(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) throw new Error(`Not a hex colour: ${hex}`);
  const [r, g, b] = rgb.map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

export type ContrastCheckDefinition = {
  id: string;
  label: string;
  /** Mode-neutral token path that gets adjusted if the check fails. */
  foreground: string;
  background: string;
  minimum: 4.5 | 3;
  kind: "text" | "graphic";
};

export const CONTRAST_CHECKS: ContrastCheckDefinition[] = [
  { id: "body", label: "Body text on the page", foreground: "color.text.primary", background: "color.surface.page", minimum: 4.5, kind: "text" },
  { id: "secondary", label: "Secondary text on the page", foreground: "color.text.secondary", background: "color.surface.page", minimum: 4.5, kind: "text" },
  { id: "card", label: "Text on cards", foreground: "color.text.secondary", background: "color.surface.card", minimum: 4.5, kind: "text" },
  { id: "button", label: "Button labels", foreground: "color.button.primaryText", background: "color.button.primary", minimum: 4.5, kind: "text" },
  { id: "inverse", label: "Text on dark or inverse sections", foreground: "color.text.inverse", background: "color.surface.inverse", minimum: 4.5, kind: "text" },
  { id: "button-edge", label: "Buttons stand out from the page", foreground: "color.button.primary", background: "color.surface.page", minimum: 3, kind: "graphic" },
  { id: "accent", label: "Accent colour for icons and chart lines", foreground: "color.brand.accent", background: "color.surface.card", minimum: 3, kind: "graphic" },
];

export type ContrastResult = Omit<ContrastCheckDefinition, "foreground" | "background"> & {
  mode: Mode;
  /** Stored token paths for this mode, e.g. "colorDark.text.primary". */
  foreground: string;
  background: string;
  ratio: number;
  passes: boolean;
  foregroundHex: string;
  backgroundHex: string;
  /** A nearby colour for the foreground token that passes, when this check fails. */
  suggestion: string | null;
};

export function runContrastChecks(tokens: BrandTokens, mode: Mode = tokens.mode): ContrastResult[] {
  return CONTRAST_CHECKS.map((check) => {
    const foreground = colorPath(check.foreground, mode);
    const background = colorPath(check.background, mode);
    const fg = getPath(tokens, foreground) as string;
    const bg = getPath(tokens, background) as string;
    const ratio = contrastRatio(fg, bg);
    const passes = ratio >= check.minimum;
    return {
      ...check,
      mode,
      foreground,
      background,
      ratio,
      passes,
      foregroundHex: fg,
      backgroundHex: bg,
      suggestion: passes ? null : suggestContrastFix(fg, bg, check.minimum),
    };
  });
}

/**
 * The closest colour to `foreground` that reaches `minimum` against
 * `background`. Only lightness moves (in OKLab), so the hue stays recognisably
 * the same colour. Tries whichever direction needs the smaller change.
 */
export function suggestContrastFix(foreground: string, background: string, minimum: number): string | null {
  const rgb = hexToRgb(foreground);
  if (!rgb) return null;
  const [L, a, b] = rgbToOklab(...rgb);
  const target = minimum + 0.05; // a little headroom so rounding can't tip it back under

  let best: { hex: string; delta: number } | null = null;
  for (const step of [-0.005, 0.005]) {
    // Chroma fades as lightness nears black or white, or the colour falls out of gamut and shifts hue.
    for (let next = L + step; next >= 0 && next <= 1; next += step) {
      const distance = Math.abs(next - L);
      const fade = Math.max(0, 1 - Math.max(0, Math.abs(next - 0.5) - 0.35) / 0.15);
      const hex = rgbToHex(...oklabToRgb([next, a * fade, b * fade]));
      if (contrastRatio(hex, background) >= target) {
        if (!best || distance < best.delta) best = { hex, delta: distance };
        break;
      }
    }
  }
  return best?.hex ?? null;
}

export function applySuggestion(tokens: BrandTokens, result: ContrastResult): BrandTokens {
  if (!result.suggestion) return tokens;
  return setPath(tokens, result.foreground, result.suggestion);
}

export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}
