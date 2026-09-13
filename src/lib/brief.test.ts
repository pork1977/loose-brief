import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF, isDemoBrief } from "../data/demo-brief";
import { BRIEF_STEPS, EMPTY_BRIEF, briefDraftSchema, firstInvalidStep, summaryLine, validateStep } from "./brief";
import { readPersonality } from "./personality";

test("the demo brief passes every step", () => {
  assert.equal(firstInvalidStep(DEMO_BRIEF), -1);
  assert.ok(briefDraftSchema.safeParse(DEMO_BRIEF).success);
});

test("an empty brief is a valid draft but fails the first step", () => {
  assert.ok(briefDraftSchema.safeParse(EMPTY_BRIEF).success);
  assert.equal(firstInvalidStep(EMPTY_BRIEF), 0);
  const errors = validateStep(0, EMPTY_BRIEF);
  assert.equal(errors.name, "Give the brand a name.");
  assert.ok(errors.description);
  assert.equal(errors.oneLiner, undefined, "the one-liner is optional");
});

test("whitespace-only answers don't count", () => {
  const errors = validateStep(0, { ...DEMO_BRIEF, name: "    " });
  assert.equal(errors.name, "Give the brand a name.");
});

test("long names are rejected with a clear message", () => {
  const errors = validateStep(0, { ...DEMO_BRIEF, name: "A".repeat(41) });
  assert.match(errors.name ?? "", /40 characters/);
});

test("personality needs three to five traits", () => {
  assert.match(validateStep(2, { ...DEMO_BRIEF, personality: ["Bold", "Warm"] }).personality ?? "", /at least 3/);
  assert.match(
    validateStep(2, { ...DEMO_BRIEF, personality: ["Bold", "Warm", "Calm", "Clear", "Honest", "Precise"] }).personality ?? "",
    /5 traits at most/,
  );
});

test("references may be descriptions, but anything starting http must be a real address", () => {
  const visual = BRIEF_STEPS.findIndex((s) => s.id === "visual");
  assert.deepEqual(validateStep(visual, { ...DEMO_BRIEF, references: ["Old railway posters", "https://example.com"] }), {});
  assert.ok(validateStep(visual, { ...DEMO_BRIEF, references: ["https://not a url"] }).references);
});

test("the theme must be chosen", () => {
  const visual = BRIEF_STEPS.findIndex((s) => s.id === "visual");
  assert.ok(validateStep(visual, { ...DEMO_BRIEF, theme: "" }).theme);
});

test("summary line prefers the one-liner, then the first sentence", () => {
  assert.equal(summaryLine(DEMO_BRIEF), "Climate intelligence for coastal communities");
  assert.equal(
    summaryLine({ ...DEMO_BRIEF, oneLiner: "" }),
    "Ebbfield is an AI-powered coastal conservation startup.",
  );
});

test("isDemoBrief spots an edited demo", () => {
  assert.ok(isDemoBrief(DEMO_BRIEF));
  assert.ok(isDemoBrief({ ...DEMO_BRIEF, name: " Ebbfield " }));
  assert.equal(isDemoBrief({ ...DEMO_BRIEF, name: "Tidewise" }), false);
});

test("personality reading places known traits and counts custom ones", () => {
  const reading = readPersonality(["Scientific", "Clear", "Sea-salty"]);
  assert.equal(reading.placed, 2);
  assert.equal(reading.custom, 1);
  const character = reading.axes.find((a) => a.id === "character");
  assert.ok(character && character.value < -0.5, "scientific and clear lean technical");
});
