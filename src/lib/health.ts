import { runContrastChecks } from "./accessibility";
import { hexToOklch } from "./palette";
import { colorsFor, type BrandTokens } from "./tokens";

/*
 * The identity health meter. Every point comes from a check that can be
 * explained in a sentence and fixed by changing a token; there's no judgement
 * of taste in here. Contrast counts for most of the score because it's the
 * part that stops people being able to use the site.
 */

export type HealthCheck = {
  id: string;
  label: string;
  passes: boolean;
  detail: string;
  weight: number;
};

const px = (value: string) => (value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value));

export function healthChecks(tokens: BrandTokens): HealthCheck[] {
  const light = runContrastChecks(tokens, "light");
  const dark = runContrastChecks(tokens, "dark");
  const failing = (results: typeof light) => results.filter((r) => !r.passes).map((r) => r.label.toLowerCase());

  const { body, display } = tokens.typography;
  const c = colorsFor(tokens);
  const accent = hexToOklch(c.brand.accent);
  const primary = hexToOklch(c.button.primary);
  const hueGap = Math.min(Math.abs(accent.h - primary.h), 360 - Math.abs(accent.h - primary.h));
  const accentDistinct = hueGap > 25 || Math.abs(accent.l - primary.l) > 0.15;

  const [small, medium, large] = [tokens.radius.small, tokens.radius.medium, tokens.radius.large].map(px);

  return [
    {
      id: "contrast-light",
      label: "Contrast in light mode",
      passes: failing(light).length === 0,
      detail: failing(light).length ? `Failing: ${failing(light).join(", ")}.` : "All seven checks pass.",
      weight: 3,
    },
    {
      id: "contrast-dark",
      label: "Contrast in dark mode",
      passes: failing(dark).length === 0,
      detail: failing(dark).length ? `Failing: ${failing(dark).join(", ")}.` : "All seven checks pass.",
      weight: 3,
    },
    {
      id: "body-readable",
      label: "Comfortable body text",
      passes: body.lineHeight >= 1.4 && body.weight >= 300 && body.weight <= 500,
      detail: `Line height ${body.lineHeight}, weight ${body.weight}. Running text reads best at 1.4 or more, between 300 and 500.`,
      weight: 1,
    },
    {
      id: "headline-tight",
      label: "Headlines hold together",
      passes: display.lineHeight <= 1.25,
      detail: `Line height ${display.lineHeight}. Big headlines look loose above about 1.25.`,
      weight: 1,
    },
    {
      id: "accent-distinct",
      label: "Accent stands apart from the button colour",
      passes: accentDistinct,
      detail: accentDistinct ? "Different enough that highlights don't look like buttons." : "Accent and button colours are so close that highlights could be mistaken for buttons.",
      weight: 1,
    },
    {
      id: "radius-order",
      label: "Corner sizes go small to large",
      passes: small <= medium && medium <= large,
      detail: `${tokens.radius.small}, ${tokens.radius.medium}, ${tokens.radius.large}.`,
      weight: 1,
    },
  ];
}

export function healthScore(checks: HealthCheck[]): number {
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.filter((c) => c.passes).reduce((sum, c) => sum + c.weight, 0);
  return Math.round((earned / total) * 100);
}
