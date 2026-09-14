import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_DIRECTIONS, littoralIntelligence } from "../data/demo-directions";
import { contrastRatio, runContrastChecks, suggestContrastFix } from "./accessibility";
import { directionSchema, directionSetSchema, DESIGN_AREAS } from "./direction";
import { rgbToOklab, hexToRgb } from "./palette";
import { brandTokensSchema, colorsFor, compileTokens, withToken } from "./tokens";

test("every demo direction passes the schema live generation will use", () => {
  for (const direction of DEMO_DIRECTIONS) {
    const result = directionSchema.safeParse(direction);
    assert.ok(result.success, `${direction.name}: ${result.success ? "" : result.error.message}`);
  }
  assert.ok(directionSetSchema.safeParse(DEMO_DIRECTIONS).success);
});

test("every direction explains every design area", () => {
  for (const direction of DEMO_DIRECTIONS) {
    for (const area of DESIGN_AREAS) {
      assert.ok(direction.decisions.some((d) => d.area === area), `${direction.name} has no ${area} decision`);
    }
  }
});

test("the three directions are genuinely different, not three shades of one idea", () => {
  const [a, b, c] = DEMO_DIRECTIONS;
  const labDistance = (x: string, y: string) => {
    const [p, q] = [x, y].map((h) => rgbToOklab(...(hexToRgb(h) as [number, number, number])));
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  };
  for (const [x, y] of [[a, b], [a, c], [b, c]]) {
    assert.notEqual(x.tokens.typography.display.family, y.tokens.typography.display.family, `${x.name} and ${y.name} share a display face`);
    assert.notEqual(x.visual, y.visual);
    // Pages differ clearly (a dark page against a light one, or two clearly different light tones).
    assert.ok(labDistance(colorsFor(x.tokens).button.primary, colorsFor(y.tokens).button.primary) > 0.1, `${x.name} and ${y.name} buttons look alike`);
  }
  assert.notEqual(a.tokens.radius.button, c.tokens.radius.button);
});

test("the token schema rejects values that could break out of a style attribute", () => {
  const bad = [
    ["color.brand.primary", "red; background: url(x)"],
    ["shadow.card", "url(https://example.com/x.png)"],
    ["motion.easing", "steps(4); }"],
    ["radius.small", "calc(100vw)"],
    ["typography.display.family", "Comic Sans MS"],
  ] as const;
  for (const [path, value] of bad) {
    const tokens = withToken(littoralIntelligence.tokens, path, value);
    assert.equal(brandTokensSchema.safeParse(tokens).success, false, `${path} accepted ${value}`);
  }
});

test("compileTokens resolves radius steps and font stacks", () => {
  const vars = compileTokens(littoralIntelligence.tokens);
  assert.equal(vars["--radius-button"], "2px");
  assert.match(vars["--font-display"], /--face-instrument-serif/);
  const pill = compileTokens(withToken(littoralIntelligence.tokens, "radius.button", "pill"));
  assert.equal(pill["--radius-button"], "999px");
});

test("contrast ratio matches known WCAG values", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF").toFixed(1), "21.0");
  assert.equal(contrastRatio("#FFFFFF", "#FFFFFF").toFixed(1), "1.0");
  assert.equal(contrastRatio("#767676", "#FFFFFF").toFixed(2), "4.54");
});

test("all text checks pass on the demo directions", () => {
  for (const direction of DEMO_DIRECTIONS) {
    const failing = runContrastChecks(direction.tokens).filter((c) => c.kind === "text" && !c.passes);
    assert.deepEqual(failing.map((c) => c.id), [], direction.name);
  }
});

test("Littoral Intelligence's pale teal accent fails as a chart colour, and the suggestion fixes it", () => {
  const accent = runContrastChecks(littoralIntelligence.tokens).find((c) => c.id === "accent");
  assert.ok(accent && !accent.passes);
  assert.ok(accent.suggestion);
  assert.ok(contrastRatio(accent.suggestion, accent.backgroundHex) >= 3);
  const fixed = withToken(littoralIntelligence.tokens, accent.foreground, accent.suggestion);
  assert.ok(runContrastChecks(fixed).find((c) => c.id === "accent")?.passes);
});

test("suggestions keep the hue and move lightness only as far as needed", () => {
  const suggestion = suggestContrastFix("#53D6C7", "#FFFFFF", 3);
  assert.ok(suggestion);
  const before = rgbToOklab(...(hexToRgb("#53D6C7") as [number, number, number]));
  const after = rgbToOklab(...(hexToRgb(suggestion) as [number, number, number]));
  const hue = (lab: number[]) => (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  assert.ok(Math.abs(hue(before) - hue(after)) < 8, "hue drifted");
  assert.ok(after[0] < before[0], "should darken against white");
  assert.ok(contrastRatio(suggestion, "#FFFFFF") < 3.6, "went further than needed");
});

test("light text on a light background gets a darker suggestion; dark text on dark gets lighter", () => {
  const dark = suggestContrastFix("#CCCCCC", "#FFFFFF", 4.5);
  const light = suggestContrastFix("#333333", "#000000", 4.5);
  assert.ok(dark && contrastRatio(dark, "#FFFFFF") >= 4.5);
  assert.ok(light && contrastRatio(light, "#000000") >= 4.5);
});
