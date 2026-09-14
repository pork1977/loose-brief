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
 * Colours come in two sets, light and dark, with the same semantic names, so
 * a component written once works in both. `mode` says which the brand leads
 * with.
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
const shadow = z.string().max(200).regex(/^[\d\s.,()a-z#%-]+$/i, "Unsupported shadow.").refine((v) => !/url\(/i.test(v));

const BRAND_FONT_IDS = BRAND_FONTS.map((f) => f.id) as [BrandFontId, ...BrandFontId[]];
const fontId = z.enum(BRAND_FONT_IDS);
const weight = z.number().int().min(100).max(1000);

export const RADIUS_STEPS = ["none", "small", "medium", "large", "pill"] as const;
export type RadiusStep = (typeof RADIUS_STEPS)[number];

export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export const colorSetSchema = z.object({
  brand: z.object({ primary: hex, secondary: hex, accent: hex }),
  surface: z.object({ page: hex, card: hex, inverse: hex }),
  text: z.object({ primary: hex, secondary: hex, inverse: hex }),
  button: z.object({ primary: hex, primaryText: hex }),
  border: z.object({ subtle: hex }),
});
export type ColorSet = z.infer<typeof colorSetSchema>;

export const brandTokensSchema = z.object({
  /** Which colour set the brand leads with. */
  mode: z.enum(MODES),
  /** Light colour set. */
  color: colorSetSchema,
  /** Dark colour set. */
  colorDark: colorSetSchema,
  typography: z.object({
    display: z.object({ family: fontId, weight, lineHeight: z.number().min(0.8).max(1.6), letterSpacing }),
    body: z.object({ family: fontId, weight, lineHeight: z.number().min(1.2).max(2) }),
    label: z.object({ family: fontId, weight, letterSpacing, transform: z.enum(["none", "uppercase"]) }),
  }),
  /** Spacing is a scale: a base step, multiplied or divided by the ratio for each size up or down. */
  space: z.object({
    base: z.string().regex(/^(0\.\d+|1(\.\d+)?)rem$/, "The base step must be a rem value between 0.5rem and 2rem."),
    ratio: z.number().min(1.2).max(2),
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

/** The storage key for a mode's colour set. */
export function colorKey(mode: Mode): "color" | "colorDark" {
  return mode === "dark" ? "colorDark" : "color";
}

/** Turn a mode-neutral colour path ("color.text.primary") into the stored one for a mode. */
export function colorPath(path: string, mode: Mode): string {
  return path.replace(/^color\./, `${colorKey(mode)}.`);
}

export function colorsFor(tokens: BrandTokens, mode: Mode = tokens.mode): ColorSet {
  return tokens[colorKey(mode)];
}

function resolveRadius(tokens: BrandTokens, step: RadiusStep): string {
  if (step === "none") return "0px";
  if (step === "pill") return "999px";
  return tokens.radius[step];
}

export const SPACE_STEPS = ["3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl"] as const;

/** Each spacing step in rem. "s" is the base; each step up multiplies by the ratio. */
export function spaceScale(tokens: BrandTokens): Record<(typeof SPACE_STEPS)[number], number> {
  const base = parseFloat(tokens.space.base);
  const out = {} as Record<(typeof SPACE_STEPS)[number], number>;
  SPACE_STEPS.forEach((step, i) => {
    out[step] = Math.round(base * tokens.space.ratio ** (i - 3) * 1000) / 1000;
  });
  return out;
}

export type CompiledTokens = Record<`--${string}`, string>;

export function compileTokens(t: BrandTokens, mode: Mode = t.mode): CompiledTokens {
  const c = colorsFor(t, mode);
  const space = spaceScale(t);
  return {
    "--color-brand-primary": c.brand.primary,
    "--color-brand-secondary": c.brand.secondary,
    "--color-brand-accent": c.brand.accent,
    "--color-background": c.surface.page,
    "--color-surface": c.surface.card,
    "--color-surface-inverse": c.surface.inverse,
    "--color-text-primary": c.text.primary,
    "--color-text-secondary": c.text.secondary,
    "--color-text-inverse": c.text.inverse,
    "--color-button-primary": c.button.primary,
    "--color-button-primary-text": c.button.primaryText,
    "--color-border": c.border.subtle,

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

    ...(Object.fromEntries(SPACE_STEPS.map((step) => [`--space-${step}`, `${space[step]}rem`])) as CompiledTokens),

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

/** Read one value by dotted path, e.g. getPath(t, "color.brand.primary"). */
export function getPath(root: unknown, path: string): unknown {
  if (path === "") return root;
  let node: unknown = root;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null || !(key in node)) throw new Error(`Unknown path: ${path}`);
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/** A copy with one value replaced by dotted path. The empty path replaces the whole thing. */
export function setPath<T>(root: T, path: string, value: unknown): T {
  if (path === "") return structuredClone(value) as T;
  const next = structuredClone(root);
  const keys = path.split(".");
  let node = next as unknown as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) {
    const child = node[key];
    if (typeof child !== "object" || child === null) throw new Error(`Unknown path: ${path}`);
    node = child as Record<string, unknown>;
  }
  const last = keys[keys.length - 1];
  if (!(last in node)) throw new Error(`Unknown path: ${path}`);
  node[last] = value;
  return next;
}

export const getToken = (tokens: BrandTokens, path: string) => getPath(tokens, path);
export const withToken = (tokens: BrandTokens, path: string, value: unknown) => setPath(tokens, path, value);
