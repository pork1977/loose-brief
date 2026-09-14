import { CONTRAST_CHECKS, contrastRatio, suggestContrastFix } from "./accessibility";
import { hexToOklch, oklchToHex } from "./palette";
import { getPath, setPath, type ColorSet, type Mode } from "./tokens";

/*
 * Rules for working with a brand's light and dark colour sets.
 *
 * deriveColorSet builds the opposite mode from an existing set: surfaces flip
 * lightness but keep a trace of the brand hue, brand colours keep their hue
 * and move to a lightness that shows up on the new background, and a final
 * pass nudges anything that still fails a contrast check. It's a starting
 * point people can edit, not a claim about the "right" dark palette.
 */

const withL = (hex: string, l: number, chromaScale = 1, maxChroma = 1) => {
  const c = hexToOklch(hex);
  return oklchToHex({ l, c: Math.min(maxChroma, c.c * chromaScale), h: c.h });
};

const tint = (hueFrom: string, l: number, chroma: number) => oklchToHex({ l, c: chroma, h: hexToOklch(hueFrom).h });

/** Pick near-black or near-white for text on a colour, whichever reads better. */
function labelOn(background: string, dark: string, light: string): string {
  return contrastRatio(dark, background) >= contrastRatio(light, background) ? dark : light;
}

/** Nudge any failing foreground in the set until every contrast check passes (where that's possible). */
export function repairContrast(set: ColorSet): ColorSet {
  let next = set;
  for (let pass = 0; pass < 3; pass++) {
    for (const check of CONTRAST_CHECKS) {
      const fgPath = check.foreground.replace(/^color\./, "");
      const bgPath = check.background.replace(/^color\./, "");
      const fg = getPath(next, fgPath) as string;
      const bg = getPath(next, bgPath) as string;
      if (contrastRatio(fg, bg) >= check.minimum) continue;
      const fix = suggestContrastFix(fg, bg, check.minimum);
      if (fix) next = setPath(next, fgPath, fix);
    }
  }
  return next;
}

export function deriveColorSet(from: ColorSet, target: Mode): ColorSet {
  const hue = from.brand.primary;

  if (target === "dark") {
    const page = tint(hue, 0.17, 0.025);
    const card = tint(hue, 0.215, 0.028);
    const buttonPrimary = withL(from.button.primary, Math.max(0.74, hexToOklch(from.button.primary).l), 1, 0.16);
    return repairContrast({
      brand: {
        primary: withL(from.brand.primary, Math.max(0.72, hexToOklch(from.brand.primary).l), 1, 0.16),
        secondary: withL(from.brand.secondary, 0.78, 1, 0.14),
        accent: withL(from.brand.accent, Math.max(0.72, hexToOklch(from.brand.accent).l), 1, 0.2),
      },
      surface: { page, card, inverse: from.surface.page },
      text: {
        primary: tint(hue, 0.95, 0.012),
        secondary: tint(hue, 0.78, 0.02),
        inverse: from.text.primary,
      },
      button: { primary: buttonPrimary, primaryText: labelOn(buttonPrimary, page, "#FFFFFF") },
      border: { subtle: tint(hue, 0.32, 0.025) },
    });
  }

  const page = tint(hue, 0.975, 0.008);
  const buttonPrimary = withL(from.button.primary, Math.min(0.48, hexToOklch(from.button.primary).l), 1, 0.16);
  return repairContrast({
    brand: {
      primary: withL(from.brand.primary, Math.min(0.45, hexToOklch(from.brand.primary).l), 1, 0.16),
      secondary: withL(from.brand.secondary, 0.62, 1, 0.14),
      accent: withL(from.brand.accent, Math.min(0.62, hexToOklch(from.brand.accent).l), 1, 0.2),
    },
    surface: { page, card: "#FFFFFF", inverse: from.surface.page },
    text: {
      primary: tint(hue, 0.24, 0.03),
      secondary: tint(hue, 0.46, 0.025),
      inverse: from.text.primary,
    },
    button: { primary: buttonPrimary, primaryText: labelOn(buttonPrimary, tint(hue, 0.2, 0.03), "#FFFFFF") },
    border: { subtle: tint(hue, 0.88, 0.015) },
  });
}

/**
 * Raise or lower contrast by moving text and borders away from (or towards)
 * the page's lightness. Lowering never goes below the contrast minimums: it
 * returns null instead, so the interface can say why nothing happened.
 */
export function shiftContrast(set: ColorSet, step: 1 | -1): ColorSet | null {
  const pageL = hexToOklch(set.surface.page).l;
  const darkPage = pageL < 0.5;
  // Moving "away" from the page means darker text on a light page, lighter text on a dark one.
  const away = (hex: string, amount: number) => {
    const c = hexToOklch(hex);
    const direction = (darkPage ? 1 : -1) * step;
    return oklchToHex({ ...c, l: Math.max(0, Math.min(1, c.l + direction * amount)) });
  };

  const next: ColorSet = {
    ...set,
    text: { ...set.text, primary: away(set.text.primary, 0.06), secondary: away(set.text.secondary, 0.07) },
    border: { subtle: away(set.border.subtle, 0.05) },
  };

  if (JSON.stringify(next) === JSON.stringify(set)) return null;
  if (step === -1) {
    const fails = CONTRAST_CHECKS.some((check) => {
      const fg = getPath(next, check.foreground.replace(/^color\./, "")) as string;
      const bg = getPath(next, check.background.replace(/^color\./, "")) as string;
      return contrastRatio(fg, bg) < check.minimum;
    });
    if (fails) return null;
  }
  return next;
}
