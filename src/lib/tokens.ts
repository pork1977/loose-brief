import { brandFont, type BrandFontId } from "./brand-fonts";

/*
 * The brand token model.
 *
 * Every visual decision a brand makes lives here under a semantic name
 * (what it's for, not what it looks like). compileTokens() turns it into CSS
 * custom properties, which are set on a BrandScope wrapper so they only affect
 * the brand preview and never the Loose Brief interface around it.
 *
 * The exporters in a later phase read this same object, which is why the
 * website preview, the CSS file and the JSON file can't disagree.
 */

export type Hex = `#${string}`;

/** Radius tokens for components refer to a step on the scale, not a raw value. */
export type RadiusStep = "none" | "small" | "medium" | "large" | "pill";

export type BrandTokens = {
  color: {
    brand: { primary: Hex; secondary: Hex; accent: Hex };
    surface: { page: Hex; card: Hex; inverse: Hex };
    text: { primary: Hex; secondary: Hex; inverse: Hex };
    button: { primary: Hex; primaryText: Hex };
    border: { subtle: Hex };
  };
  typography: {
    display: { family: BrandFontId; weight: number; lineHeight: number; letterSpacing: string };
    body: { family: BrandFontId; weight: number; lineHeight: number };
    label: {
      family: BrandFontId;
      weight: number;
      letterSpacing: string;
      transform: "none" | "uppercase";
    };
  };
  radius: {
    small: string;
    medium: string;
    large: string;
    button: RadiusStep;
    card: RadiusStep;
  };
  shadow: { card: string };
  motion: { fast: string; normal: string; slow: string; easing: string };
};

function resolveRadius(tokens: BrandTokens, step: RadiusStep): string {
  if (step === "none") return "0";
  if (step === "pill") return "999px";
  return tokens.radius[step];
}

export type CompiledTokens = Record<`--${string}`, string>;

export function compileTokens(t: BrandTokens): CompiledTokens {
  return {
    "--color-brand-primary": t.color.brand.primary,
    "--color-brand-secondary": t.color.brand.secondary,
    "--color-brand-accent": t.color.brand.accent,
    "--color-background": t.color.surface.page,
    "--color-surface": t.color.surface.card,
    "--color-surface-inverse": t.color.surface.inverse,
    "--color-text-primary": t.color.text.primary,
    "--color-text-secondary": t.color.text.secondary,
    "--color-text-inverse": t.color.text.inverse,
    "--color-button-primary": t.color.button.primary,
    "--color-button-primary-text": t.color.button.primaryText,
    "--color-border": t.color.border.subtle,

    "--font-display": brandFont(t.typography.display.family).stack,
    "--font-display-weight": String(t.typography.display.weight),
    "--font-display-leading": String(t.typography.display.lineHeight),
    "--font-display-tracking": t.typography.display.letterSpacing,
    "--font-body": brandFont(t.typography.body.family).stack,
    "--font-body-weight": String(t.typography.body.weight),
    "--font-body-leading": String(t.typography.body.lineHeight),
    "--font-label": brandFont(t.typography.label.family).stack,
    "--font-label-weight": String(t.typography.label.weight),
    "--font-label-tracking": t.typography.label.letterSpacing,
    "--font-label-transform": t.typography.label.transform,

    "--radius-small": t.radius.small,
    "--radius-medium": t.radius.medium,
    "--radius-large": t.radius.large,
    "--radius-button": resolveRadius(t, t.radius.button),
    "--radius-card": resolveRadius(t, t.radius.card),

    "--shadow-card": t.shadow.card,

    "--motion-fast": t.motion.fast,
    "--motion-normal": t.motion.normal,
    "--motion-slow": t.motion.slow,
    "--motion-easing": t.motion.easing,
  };
}

/** Replace one value by dotted path, e.g. withToken(t, "color.brand.primary", "#1F5E52"). */
export function withToken(tokens: BrandTokens, path: string, value: unknown): BrandTokens {
  const next = structuredClone(tokens);
  const keys = path.split(".");
  let node = next as unknown as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    const child = node[key];
    if (typeof child !== "object" || child === null) throw new Error(`Unknown token path: ${path}`);
    node = child as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (!(last in node)) throw new Error(`Unknown token path: ${path}`);
  node[last] = value;
  return next;
}
