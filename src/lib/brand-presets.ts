import { nearestWeight, type BrandFontId } from "./brand-fonts";
import { hexToRgb } from "./palette";
import type { BrandTokens, ColorSet } from "./tokens";

/*
 * One-click starting points in the brand system editor. Each preset is a set
 * of token values; applying one is an ordinary edit, so it can be undone.
 */

type Typography = BrandTokens["typography"];

export const TYPE_PRESETS: { id: string; label: string; description: string; typography: Typography }[] = [
  {
    id: "editorial",
    label: "Editorial",
    description: "Serif headlines, plain sans text, mono labels",
    typography: {
      display: { family: "instrument-serif", weight: 400, lineHeight: 0.95, letterSpacing: "-0.01em" },
      body: { family: "inter", weight: 400, lineHeight: 1.6 },
      label: { family: "ibm-plex-mono", weight: 500, letterSpacing: "0.08em", transform: "uppercase" },
    },
  },
  {
    id: "technical",
    label: "Technical",
    description: "Grotesk headlines, precise sans, mono data",
    typography: {
      display: { family: "space-grotesk", weight: 600, lineHeight: 1, letterSpacing: "-0.03em" },
      body: { family: "ibm-plex-sans", weight: 400, lineHeight: 1.55 },
      label: { family: "jetbrains-mono", weight: 500, letterSpacing: "0.04em", transform: "uppercase" },
    },
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "Rounded headlines and soft sans text",
    typography: {
      display: { family: "nunito", weight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" },
      body: { family: "nunito-sans", weight: 400, lineHeight: 1.6 },
      label: { family: "nunito-sans", weight: 700, letterSpacing: "0.01em", transform: "none" },
    },
  },
  {
    id: "classic",
    label: "Classic",
    description: "A warm serif pairing with a clean label face",
    typography: {
      display: { family: "fraunces", weight: 600, lineHeight: 1.05, letterSpacing: "-0.02em" },
      body: { family: "source-serif-4", weight: 400, lineHeight: 1.6 },
      label: { family: "dm-sans", weight: 600, letterSpacing: "0.06em", transform: "uppercase" },
    },
  },
  {
    id: "modern",
    label: "Modern",
    description: "Geometric headlines with a crisp sans",
    typography: {
      display: { family: "sora", weight: 600, lineHeight: 1.05, letterSpacing: "-0.035em" },
      body: { family: "manrope", weight: 400, lineHeight: 1.6 },
      label: { family: "manrope", weight: 700, letterSpacing: "0.05em", transform: "uppercase" },
    },
  },
];

/*
 * Corner roundness. The token model keeps a three-step scale (small parts like
 * inputs and tags want tighter corners than large cards), but editing three
 * sliders separately was confusing, because a step only shows if something
 * uses it. One roundness value sets all three in proportion instead.
 */
export const ROUNDNESS_MAX = 24;

export function radiusScale(medium: number): Pick<BrandTokens["radius"], "small" | "medium" | "large"> {
  const m = Math.max(0, Math.min(ROUNDNESS_MAX, Math.round(medium)));
  return { small: `${Math.round(m / 2)}px`, medium: `${m}px`, large: `${m * 2}px` };
}

/** Change one role's face, keeping its weight as close as the new face allows. */
export function withFamily(typography: Typography, role: keyof Typography, family: BrandFontId): Typography {
  return { ...typography, [role]: { ...typography[role], family, weight: nearestWeight(family, typography[role].weight) } };
}

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex) ?? [0, 0, 0];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Shadows are tinted with the brand's own text colour, so they never look grey and unrelated. */
export const SHADOW_PRESETS: { id: string; label: string; build: (c: ColorSet) => string }[] = [
  { id: "none", label: "None", build: () => "none" },
  { id: "hairline", label: "Hairline", build: (c) => `0 0 0 1px ${rgba(c.text.primary, 0.08)}` },
  { id: "soft", label: "Soft", build: (c) => `0 18px 40px -24px ${rgba(c.text.primary, 0.35)}` },
  { id: "crisp", label: "Crisp", build: (c) => `0 1px 0 ${rgba(c.text.primary, 0.08)}, 0 4px 12px -4px ${rgba(c.text.primary, 0.18)}` },
  { id: "lifted", label: "Lifted", build: (c) => `0 2px 4px ${rgba(c.text.primary, 0.06)}, 0 24px 48px -16px ${rgba(c.text.primary, 0.3)}` },
];

export const MOTION_PRESETS: { id: string; label: string; description: string; motion: BrandTokens["motion"] }[] = [
  { id: "calm", label: "Calm", description: "Slow and smooth, settles gently", motion: { fast: "200ms", normal: "500ms", slow: "900ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" } },
  { id: "snappy", label: "Snappy", description: "Quick and exact, no lingering", motion: { fast: "120ms", normal: "240ms", slow: "480ms", easing: "cubic-bezier(0.2, 0, 0, 1)" } },
  { id: "springy", label: "Springy", description: "Friendly, with a little overshoot", motion: { fast: "180ms", normal: "380ms", slow: "700ms", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" } },
  { id: "steady", label: "Steady", description: "Even speed, purely functional", motion: { fast: "150ms", normal: "300ms", slow: "600ms", easing: "ease-in-out" } },
];
