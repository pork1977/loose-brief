import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../../data/demo-brief";
import { DEMO_DIRECTIONS } from "../../data/demo-directions";
import { DEMO_DIRECTION_IDS, isDemoDirection } from "../../data/demo-ids";
import { buildStaticSite } from "../export/site";
import { runContrastChecks } from "../accessibility";
import { directionSchema } from "../direction";
import { sectionOf } from "../website";
import { DraftError, assembleDirection, assignVisuals, fit, toDraft } from "./draft";

test("every built-in direction survives the round trip through a draft", () => {
  for (const demo of DEMO_DIRECTIONS) {
    const rebuilt = assembleDirection({ draft: toDraft(demo), letter: demo.letter, visual: demo.visual, brief: DEMO_BRIEF });
    assert.ok(directionSchema.safeParse(rebuilt).success, demo.id);
    assert.equal(rebuilt.sample.headline, demo.sample.headline);
    assert.deepEqual(rebuilt.tokens.typography.display.family, demo.tokens.typography.display.family);
    assert.equal(rebuilt.tokens.motion.easing, demo.tokens.motion.easing);
    assert.equal(rebuilt.decisions.length, 6);
  }
});

test("a generated site hides the Ebbfield coastline explorer and its labels", () => {
  assert.deepEqual([...DEMO_DIRECTION_IDS], DEMO_DIRECTIONS.map((d) => d.id));
  for (const visual of ["contours", "grid", "soft"] as const) {
    const rebuilt = assembleDirection({ draft: toDraft(DEMO_DIRECTIONS[0]), letter: "A", visual, brief: DEMO_BRIEF });
    assert.equal(sectionOf(rebuilt.website, "data").hidden, true);
    assert.equal(isDemoDirection(rebuilt.id), false);
    const { "index.html": html } = buildStaticSite({ brandName: "Crumb Lane", direction: rebuilt, followSystem: false });
    const hero = /<div class="ws-hero-visual">[\s\S]*?<\/div>/.exec(html)?.[0] ?? "";
    assert.ok(hero, visual);
    assert.doesNotMatch(hero, /m\/yr|Illustrative|coastline|<text/i, visual);
  }
});

test("sloppy model output is tidied: long text, bad colours, unknown fonts and presets", () => {
  const draft = toDraft(DEMO_DIRECTIONS[0]);
  draft.sample.headline = "A headline that goes on and on — far past the ninety character limit that the layout allows for headlines";
  draft.colours.textPrimary = "not a colour";
  draft.colours.page = "#fff";
  draft.type.display.font = "Comic Sans";
  draft.type.body.font = "IBM Plex Sans";
  draft.shape.shadow = "dramatic";
  draft.shape.roundness = 400;
  const d = assembleDirection({ draft, letter: "B", visual: "grid", brief: DEMO_BRIEF });
  assert.ok(d.sample.headline.length <= 90);
  assert.doesNotMatch(d.sample.headline, /—/);
  assert.equal(d.tokens.color.surface.page, "#FFFFFF");
  assert.equal(d.tokens.typography.display.family, "inter");
  assert.equal(d.tokens.typography.body.family, "ibm-plex-sans");
  assert.equal(d.tokens.radius.medium, "24px");
  // Text colours are repaired until they pass, whatever came in.
  assert.ok(runContrastChecks(d.tokens, "light").filter((c) => c.kind === "text").every((c) => c.passes));
  assert.ok(runContrastChecks(d.tokens, "dark").filter((c) => c.kind === "text").every((c) => c.passes));
});

test("a dark brief leads with a dark colour set and derives the light one", () => {
  const d = assembleDirection({ draft: toDraft(DEMO_DIRECTIONS[0]), letter: "A", visual: "soft", brief: { ...DEMO_BRIEF, theme: "dark" } });
  assert.equal(d.tokens.mode, "dark");
  assert.ok(directionSchema.safeParse(d).success);
});

test("missing pieces the page can't do without are reported, not papered over", () => {
  const draft = toDraft(DEMO_DIRECTIONS[2]);
  draft.decisions = draft.decisions.slice(0, 3);
  draft.website.how.steps = draft.website.how.steps.slice(0, 1);
  assert.throws(() => assembleDirection({ draft, letter: "C", visual: "soft", brief: DEMO_BRIEF }), (error: unknown) => {
    assert.ok(error instanceof DraftError);
    assert.ok(error.problems.some((p) => p.startsWith("decisions")));
    return true;
  });
});

test("fit trims at a word boundary and never leaves trailing punctuation", () => {
  assert.equal(fit("Short", 10), "Short");
  assert.equal(fit("One two three four five", 12), "One two");
  assert.equal(fit("Calm — and clear", 40), "Calm, and clear");
  assert.equal(fit("Example: regulars who get their usual bake every week", 50), "Example: regulars who get their usual bake");
});

test("the three routes always get different illustration styles", () => {
  const route = (visual: string) => ({ name: "", idea: "", visual, colour: "", type: "", voice: "", differs: "" });
  assert.deepEqual(assignVisuals([route("grid"), route("grid"), route("nonsense")]), ["grid", "contours", "soft"]);
});
