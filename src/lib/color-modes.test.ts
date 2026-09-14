import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_DIRECTIONS, littoralIntelligence, signalCoast } from "../data/demo-directions";
import { contrastRatio, runContrastChecks } from "./accessibility";
import { deriveColorSet, shiftContrast } from "./color-modes";
import { hexToOklch, oklchToHex } from "./palette";
import { spaceScale } from "./tokens";

test("OKLCH round-trips ordinary colours", () => {
  for (const hex of ["#083B66", "#D8B982", "#22D3EE", "#FBF6EE"]) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});

test("out-of-gamut OKLCH keeps its hue by losing chroma instead of clipping", () => {
  const hex = oklchToHex({ l: 0.9, c: 0.4, h: 265 });
  const back = hexToOklch(hex);
  assert.ok(Math.abs(back.h - 265) < 12, `hue drifted to ${back.h}`);
  assert.ok(Math.abs(back.l - 0.9) < 0.02);
});

test("every derived colour set passes all text contrast checks", () => {
  for (const direction of DEMO_DIRECTIONS) {
    for (const mode of ["light", "dark"] as const) {
      const failing = runContrastChecks(direction.tokens, mode).filter((c) => !c.passes && c.kind === "text");
      assert.deepEqual(failing.map((c) => c.id), [], `${direction.name} (${mode})`);
    }
  }
});

test("a derived dark set really is dark, and a derived light set really is light", () => {
  const dark = deriveColorSet(littoralIntelligence.tokens.color, "dark");
  assert.ok(hexToOklch(dark.surface.page).l < 0.3);
  assert.ok(hexToOklch(dark.text.primary).l > 0.85);
  const light = deriveColorSet(signalCoast.tokens.colorDark, "light");
  assert.ok(hexToOklch(light.surface.page).l > 0.9);
  assert.ok(hexToOklch(light.text.primary).l < 0.4);
});

test("derived sets keep the brand's hue family", () => {
  const dark = deriveColorSet(littoralIntelligence.tokens.color, "dark");
  const before = hexToOklch(littoralIntelligence.tokens.color.brand.primary).h;
  const after = hexToOklch(dark.brand.primary).h;
  assert.ok(Math.abs(before - after) < 15, `${before} vs ${after}`);
});

test("more contrast pushes text away from the page; less contrast stops before failing", () => {
  const set = littoralIntelligence.tokens.color;
  const up = shiftContrast(set, 1);
  assert.ok(up);
  assert.ok(contrastRatio(up.text.secondary, set.surface.page) > contrastRatio(set.text.secondary, set.surface.page));

  let current = set;
  let steps = 0;
  for (;;) {
    const down = shiftContrast(current, -1);
    if (!down) break;
    current = down;
    if (++steps > 50) assert.fail("never stopped");
  }
  assert.ok(runContrastChecks({ ...littoralIntelligence.tokens, color: current }, "light").filter((c) => c.kind === "text").every((c) => c.passes));
});

test("more contrast works on dark pages too", () => {
  const set = signalCoast.tokens.colorDark;
  const up = shiftContrast(set, 1);
  assert.ok(up);
  assert.ok(hexToOklch(up.text.secondary).l > hexToOklch(set.text.secondary).l);
});

test("the spacing scale grows by the ratio from the base step", () => {
  const scale = spaceScale(littoralIntelligence.tokens);
  assert.equal(scale.s, 1);
  assert.equal(scale.m, 1.6);
  assert.equal(scale.xs, 0.625);
  assert.ok(scale["3xl"] > scale["2xl"]);
});
