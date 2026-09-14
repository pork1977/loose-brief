import { z } from "zod";
import { BRAND_FONTS, brandFont, type BrandFontId } from "./brand-fonts";

/*
 * The brand token model.
 *
 * Every visual decision a brand makes lives here under a semantic name
 * (what it's for, not what it looks like). compileTokens() turns it into CSS
 * custom properties, which are set on a BrandScope wrapper so they only affect
 * the brand preview and never the Loose Brief interface around it.
 *
 * The schema is strict on purpose. Tokens end up inside style attributes, and
 * in live mode they come from a model, so every value is checked against a
 * narrow pattern before it's allowed anywhere near the page.
 */

const hex = z.string().regex(/^#[0-9A-F]{6}$/, "Colours must be six-digit hex values like #083B66.");
const length = z.string().regex(/^\d+(\.\d+)?(px|rem)$/, "Lengths must be px or rem values.");
const duration = z.string().regex(/^\d{2,4}ms$/, "Durations must be in milliseconds.");
const easing = z
  .string()
  .regex(/^(ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier\((-?\d*\.?\d+,\s*){3}-?\d*\.?\d+\))$/, "Unsupported easing.");
const letterSpacing = z.string().regex(/^-?\d*\.?\d+em$/, "Letter spacing must be an em value.");
// Shadows are free-form CSS, so only the characters a box-shadow needs are allowed.
const shadow = z.string().max(160).regex(/^[\d\s.,()a-z#%-]+$/i, "Unsupported shadow.").refine((v) => !/url\(/i.test(v));

const BRAND_FONT_IDS = BRAND_FONTS.map((f) => f.id) as [BrandFontId, ...BrandFontId[]];
const fontId = z.enum(BRAND_FONT_IDS);
const weight = z.number().int().min(100).max(1000);

export const RADIUS_STEPS = ["none", "small", "medium", "large", "pill"] as const;
export type RadiusStep = (typeof RADIUS_STEPS)[number];

export const brandTokensSchema = z.object({
  color: z.object({
    brand: z.object({ primary: hex, secondary: hex, accent: hex }),
    surface: z.object({ page: hex, card: hex, inverse: hex }),
    text: z.object({ primary: hex, secondary: hex, inverse: hex }),
    button: z.object({ primary: hex, primaryText: hex }),
    border: z.object({ subtle: hex }),
  }),
  typography: z.object({
    display: z.object({ family: fontId, weight, lineHeight: z.number().min(0.8).max(1.6), letterSpacing }),
    body: z.object({ family: fontId, weight, lineHeight: z.number().min(1.2).max(2) }),
    label: z.object({ family: fontId, weight, letterSpacing, transform: z.enum(["none", "uppercase"]) }),
  }),
  radius: z.object({
    small: length,
    medium: length,
    large: length,
    button: z.enum(RADIUS_STEPS),
    card: z.enum(RADIUS_STEPS),
  }),
  shadow: z.object({ card: shadow }),
  motion: z.object({ fast: duration, normal: duration, slow: duration, easing }),
});

export type BrandTokens = z.infer<typeof brandTokensSchema>;
export type Hex = `#${string}`;

function resolveRadius(tokens: BrandTokens, step: RadiusStep): string {
  if (step === "none") return "0px";
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

/** Read one value by dotted path, e.g. getToken(t, "color.brand.primary"). */
export function getToken(tokens: BrandTokens, path: string): unknown {
  let node: unknown = tokens;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null || !(key in node)) throw new Error(`Unknown token path: ${path}`);
    node = (node as Record<string, unknown>)[key];
  }
  return node;
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
