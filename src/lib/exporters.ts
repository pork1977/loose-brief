import { brandFont } from "./brand-fonts";
import { faceVariables, plainStack } from "./export/fonts";
import { compileTokens, spaceScale, SPACE_STEPS, type BrandTokens, type ColorSet, type Mode } from "./tokens";

/*
 * Token output formats: CSS variables, W3C design token JSON and a Tailwind
 * theme. All three read the same token object, so they can't disagree with
 * each other or with the site.
 */

const block = (selector: string, vars: Record<string, string>, indent = "  ") =>
  `${selector} {\n${Object.entries(vars)
    .map(([name, value]) => `${indent}${name}: ${value};`)
    .join("\n")}\n}`;

const colourVars = (tokens: BrandTokens, mode: Mode) =>
  Object.fromEntries(Object.entries(compileTokens(tokens, mode)).filter(([name]) => name.startsWith("--color-")));

type CssOptions = {
  /** Also switch to the other colour set when the visitor's device prefers it. */
  followSystem?: boolean;
};

/**
 * CSS custom properties. The brand's leading colour set is the default; the
 * other set applies under data-theme, and optionally the device's own setting.
 */
export function toCss(tokens: BrandTokens, brandName: string, { followSystem = false }: CssOptions = {}): string {
  const other: Mode = tokens.mode === "light" ? "dark" : "light";
  const parts = [
    `/* ${brandName} design tokens. Made with Loose Brief. Leads with ${tokens.mode} mode. */`,
    block(":root", { ...faceVariables(tokens), "color-scheme": tokens.mode, ...compileTokens(tokens, tokens.mode) }),
    block(`:root[data-theme="${other}"]`, { "color-scheme": other, ...colourVars(tokens, other) }),
  ];
  if (followSystem) {
    parts.push(
      `@media (prefers-color-scheme: ${other}) {\n${block(`  :root:not([data-theme="${tokens.mode}"])`, { "color-scheme": other, ...colourVars(tokens, other) }, "    ").replace(/\n\}$/, "\n  }")}\n}`,
    );
  }
  return parts.join("\n\n");
}

type DtcgToken = { $type: string; $value: unknown; $description?: string };
type DtcgGroup = { [key: string]: DtcgToken | DtcgGroup };

const colorGroup = (set: ColorSet): DtcgGroup =>
  Object.fromEntries(
    Object.entries(set).map(([group, values]) => [
      group,
      Object.fromEntries(Object.entries(values).map(([name, hex]) => [name, { $type: "color", $value: hex }])),
    ]),
  );

/** JSON in the W3C Design Tokens Community Group format. */
export function toDesignTokensJson(tokens: BrandTokens): string {
  const t = tokens.typography;
  const scale = spaceScale(tokens);
  const json: DtcgGroup = {
    color: { light: colorGroup(tokens.color), dark: colorGroup(tokens.colorDark) },
    font: {
      display: { $type: "fontFamily", $value: brandFont(t.display.family).name },
      body: { $type: "fontFamily", $value: brandFont(t.body.family).name },
      label: { $type: "fontFamily", $value: brandFont(t.label.family).name },
    },
    typography: {
      display: {
        $type: "typography",
        $value: { fontFamily: "{font.display}", fontWeight: t.display.weight, lineHeight: t.display.lineHeight, letterSpacing: t.display.letterSpacing },
      },
      body: { $type: "typography", $value: { fontFamily: "{font.body}", fontWeight: t.body.weight, lineHeight: t.body.lineHeight } },
      label: {
        $type: "typography",
        $value: { fontFamily: "{font.label}", fontWeight: t.label.weight, letterSpacing: t.label.letterSpacing, textTransform: t.label.transform },
      },
    },
    space: Object.fromEntries(SPACE_STEPS.map((step) => [step, { $type: "dimension", $value: `${scale[step]}rem` }])),
    radius: {
      small: { $type: "dimension", $value: tokens.radius.small },
      medium: { $type: "dimension", $value: tokens.radius.medium },
      large: { $type: "dimension", $value: tokens.radius.large },
      button: { $type: "dimension", $value: stepRef(tokens.radius.button) },
      card: { $type: "dimension", $value: stepRef(tokens.radius.card) },
    },
    shadow: { card: { $type: "shadow", $value: tokens.shadow.card } },
    duration: {
      fast: { $type: "duration", $value: tokens.motion.fast },
      normal: { $type: "duration", $value: tokens.motion.normal },
      slow: { $type: "duration", $value: tokens.motion.slow },
    },
    easing: { standard: { $type: "cubicBezier", $value: tokens.motion.easing } },
  };
  return JSON.stringify(json, null, 2);
}

function stepRef(step: string) {
  if (step === "none") return "0px";
  if (step === "pill") return "999px";
  return `{radius.${step}}`;
}

/**
 * A Tailwind CSS v4 theme. Colours, fonts, radii, shadow and easing go in
 * @theme, which creates utilities like bg-brand-primary, font-display,
 * rounded-card and shadow-card. Spacing and durations are plain variables,
 * because the brand's spacing scale doesn't map one-to-one onto Tailwind's.
 */
export function toTailwindTheme(tokens: BrandTokens, brandName: string): string {
  const c = compileTokens(tokens, tokens.mode);
  const other: Mode = tokens.mode === "light" ? "dark" : "light";
  const colours = Object.fromEntries(Object.entries(c).filter(([k]) => k.startsWith("--color-")));
  const scale = spaceScale(tokens);
  const theme = {
    ...colours,
    "--font-display": plainStack(tokens.typography.display.family),
    "--font-body": plainStack(tokens.typography.body.family),
    "--font-label": plainStack(tokens.typography.label.family),
    "--radius-small": c["--radius-small"],
    "--radius-medium": c["--radius-medium"],
    "--radius-large": c["--radius-large"],
    "--radius-button": c["--radius-button"],
    "--radius-card": c["--radius-card"],
    "--shadow-card": c["--shadow-card"],
    "--ease-brand": c["--motion-easing"],
  };
  return [
    `/*`,
    ` * ${brandName} theme for Tailwind CSS v4. Made with Loose Brief.`,
    ` * Put this after @import "tailwindcss"; in your main CSS file.`,
    ` * Fonts: load ${[...new Set([tokens.typography.display.family, tokens.typography.body.family, tokens.typography.label.family])].map((id) => brandFont(id).name).join(", ")} from Google Fonts.`,
    ` */`,
    "",
    block("@theme", theme),
    "",
    `/* The ${other} colour set. Add data-theme="${other}" to <html> to use it. */`,
    block(`[data-theme="${other}"]`, colourVars(tokens, other)),
    "",
    "/* Brand spacing scale and motion timings, for use with arbitrary values, e.g. p-[var(--space-m)]. */",
    block(":root", {
      ...Object.fromEntries(SPACE_STEPS.map((step) => [`--space-${step}`, `${scale[step]}rem`])),
      "--motion-fast": c["--motion-fast"],
      "--motion-normal": c["--motion-normal"],
      "--motion-slow": c["--motion-slow"],
    }),
    "",
  ].join("\n");
}
