import { brandFont } from "./brand-fonts";
import { compileTokens, type BrandTokens, type ColorSet } from "./tokens";

/*
 * Token output formats. The Tokens tab shows these now; the Export stage adds
 * downloads, a Tailwind theme and DESIGN.md on top of the same functions.
 */

/** CSS custom properties, with the dark set under a data attribute and the OS preference. */
export function toCss(tokens: BrandTokens, brandName: string): string {
  const lines = (vars: Record<string, string>, indent = "  ") =>
    Object.entries(vars)
      .map(([name, value]) => `${indent}${name}: ${value};`)
      .join("\n");

  const lead = compileTokens(tokens, tokens.mode);
  const other = tokens.mode === "light" ? "dark" : "light";
  const otherColours = Object.fromEntries(
    Object.entries(compileTokens(tokens, other)).filter(([name]) => name.startsWith("--color-")),
  );

  return [
    `/* ${brandName} design tokens. Leads with ${tokens.mode} mode. */`,
    `:root {\n${lines(lead)}\n}`,
    `[data-theme="${other}"] {\n${lines(otherColours)}\n}`,
  ].join("\n\n");
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
    space: {
      base: { $type: "dimension", $value: tokens.space.base },
      ratio: { $type: "number", $value: tokens.space.ratio, $description: "Each step up the scale multiplies by this." },
    },
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
