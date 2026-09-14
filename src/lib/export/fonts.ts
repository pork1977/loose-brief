import { brandFont, nearestWeight, type BrandFontId } from "../brand-fonts";
import type { BrandTokens } from "../tokens";

/*
 * Fonts for exported files. Inside Loose Brief, fonts come through next/font
 * and are referred to by --face-* variables. An exported file has neither, so
 * it links the same families from Google Fonts and defines those variables
 * with plain family names.
 */

/** Every family the tokens use, with the weights the site actually needs from it. */
export function fontsInUse(tokens: BrandTokens): Map<BrandFontId, number[]> {
  const { display, body, label } = tokens.typography;
  const wanted: [BrandFontId, number][] = [
    [display.family, display.weight],
    [body.family, body.weight],
    // Buttons, form labels and emphasis are set in the body face at 600.
    [body.family, 600],
    [label.family, label.weight],
    [label.family, 600],
  ];
  const map = new Map<BrandFontId, number[]>();
  for (const [family, weight] of wanted) {
    const actual = nearestWeight(family, weight);
    const list = map.get(family) ?? [];
    if (!list.includes(actual)) list.push(actual);
    map.set(family, list.sort((a, b) => a - b));
  }
  return map;
}

export function googleFontsUrl(tokens: BrandTokens): string {
  const families = [...fontsInUse(tokens)].map(([id, weights]) => {
    const font = brandFont(id);
    const name = font.name.replace(/ /g, "+");
    // Single-weight faces take no weight axis in the request.
    return font.weights.length === 1 ? `family=${name}` : `family=${name}:wght@${weights.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/** --face-* variables pointing at the real family names, so the token font stacks resolve. */
export function faceVariables(tokens: BrandTokens): Record<string, string> {
  return Object.fromEntries([...fontsInUse(tokens).keys()].map((id) => [`--face-${id}`, `"${brandFont(id).name}"`]));
}

/** A brand font stack with the variable replaced by the family name, for files that don't define the variables. */
export function plainStack(id: BrandFontId): string {
  return brandFont(id).stack.replace(/var\(--face-[a-z0-9-]+\)/, `"${brandFont(id).name}"`);
}
