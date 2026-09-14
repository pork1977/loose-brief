import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../../data/demo-brief";
import { DEMO_DIRECTIONS, littoralIntelligence } from "../../data/demo-directions";
import { directionSetSchema } from "../direction";
import { toDraft } from "./draft";
import { DIRECTIONS_SYSTEM, REFINE_SYSTEM, briefBlock } from "./prompts";
import { runDirections, runRefine, type ModelCall } from "./generate";
import type { DirectionsEvent } from "./protocol";

const plan = {
  routes: DEMO_DIRECTIONS.map((d) => ({ name: d.name, idea: d.description, visual: d.visual, colour: "", type: "", voice: "", differs: "" })),
};

/** A fake model: replies from a script, and records what it was asked. */
function fakeModel(reply: (step: string, text: string, attempt: number) => unknown) {
  const calls: { step: string; text: string }[] = [];
  const call: ModelCall = async ({ step, blocks }) => {
    const text = blocks.map((b) => (b.type === "text" ? b.text : "[image]")).join("\n");
    calls.push({ step, text });
    return reply(step, text, calls.filter((c) => c.step === step).length) as never;
  };
  return { call, calls };
}

const draftFor = (text: string) => {
  const letter = /direction ([ABC])/.exec(text)?.[1] ?? "A";
  return toDraft(DEMO_DIRECTIONS["ABC".indexOf(letter)]);
};

test("a live run plans, writes three directions and streams each one", async () => {
  const { call, calls } = fakeModel((step, text) => (step === "plan" ? plan : draftFor(text)));
  const events: DirectionsEvent[] = [];
  const directions = await runDirections({ brief: DEMO_BRIEF, images: [], call, emit: (e) => events.push(e) });

  assert.ok(directionSetSchema.safeParse(directions).success);
  assert.deepEqual(directions.map((d) => d.letter), ["A", "B", "C"]);
  assert.equal(calls.filter((c) => c.step === "plan").length, 1);
  assert.equal(calls.filter((c) => c.step === "brand").length, 3);
  assert.equal(calls.filter((c) => c.step === "copy").length, 3);
  // The words are written knowing the brand half.
  assert.ok(calls.filter((c) => c.step === "copy").every((c) => c.text.includes("already decided")));
  assert.deepEqual(events.slice(0, 3).map((e) => e.type), ["stage", "planned", "stage"]);
  assert.equal(events.filter((e) => e.type === "direction").length, 3);
  // Every call opens with the same brief block, which is what lets it be cached.
  assert.ok(calls.every((c) => c.text.startsWith(briefBlock(DEMO_BRIEF, []))));
});

test("direction A's brand request goes first, so B and C can read the cache it writes", async () => {
  const log: string[] = [];
  const call: ModelCall = async ({ step, blocks }) => {
    const text = blocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");
    if (step === "plan") return plan as never;
    const letter = /direction ([ABC])/.exec(text)?.[1] ?? "?";
    log.push(`start ${step} ${letter}`);
    await new Promise((resolve) => setTimeout(resolve, 5));
    log.push(`end ${step} ${letter}`);
    return draftFor(text) as never;
  };
  await runDirections({ brief: DEMO_BRIEF, images: [], call, emit: () => {} });
  const endBrandA = log.indexOf("end brand A");
  assert.ok(endBrandA >= 0);
  assert.ok(log.indexOf("start brand B") > endBrandA);
  assert.ok(log.indexOf("start brand C") > endBrandA);
  assert.ok(log.indexOf("start copy A") < log.indexOf("start copy B"));
});

test("a direction that fails the checks is asked for again with the problems listed", async () => {
  const { call, calls } = fakeModel((step, text) => {
    if (step === "plan") return plan;
    const draft = draftFor(text);
    if (text.includes("direction B") && !text.includes("previous attempt")) draft.decisions = [];
    return draft;
  });
  const events: DirectionsEvent[] = [];
  const directions = await runDirections({ brief: DEMO_BRIEF, images: [], call, emit: (e) => events.push(e) });
  assert.equal(directions.length, 3);
  assert.ok(events.some((e) => e.type === "retry" && e.index === 1));
  const retries = calls.filter((c) => c.text.includes("previous attempt"));
  // Only the half with the problem is asked again.
  assert.deepEqual(retries.map((c) => c.step), ["copy"]);
  assert.match(retries[0].text, /decisions/);
});

test("a plan with fewer than three routes is asked for once more, then given up on", async () => {
  const { call, calls } = fakeModel((step) => (step === "plan" ? { routes: plan.routes.slice(0, 2) } : null));
  await assert.rejects(runDirections({ brief: DEMO_BRIEF, images: [], call, emit: () => {} }), /three directions/);
  assert.equal(calls.filter((c) => c.step === "plan").length, 2);
});

test("images go first and are described in the brief block", async () => {
  const material = { ...DEMO_BRIEF, materials: [] };
  const { call, calls } = fakeModel((step, text) => (step === "plan" ? plan : draftFor(text)));
  await runDirections({
    brief: material,
    images: [{ mediaType: "image/png", data: "AAAA", note: { fileName: "logo.png", kind: "logo", alt: "A blue wave mark", use: "in-site" } }],
    call,
    emit: () => {},
  });
  assert.ok(calls[0].text.startsWith("[image]"));
  assert.match(calls[0].text, /1\. logo: A blue wave mark \(they want it on the site\)/);
});

const refineInput = {
  request: "Make the buttons pill shaped and the headline warmer",
  direction: littoralIntelligence,
  brief: { name: DEMO_BRIEF.name, oneLiner: DEMO_BRIEF.oneLiner, description: DEMO_BRIEF.description, audience: DEMO_BRIEF.audience, personality: DEMO_BRIEF.personality, avoid: DEMO_BRIEF.avoid },
};

test("a refine reply becomes checked changes with before and after values", async () => {
  const { call } = fakeModel(() => ({
    possible: true,
    summary: "Pill buttons and a warmer headline — nothing else.",
    because: "Rounder buttons feel friendlier.",
    changeType: "token_update",
    focus: "hero",
    changes: [
      { path: "tokens.radius.button", value: '"pill"' },
      { path: "sample.headline", value: "See your shoreline before it changes." },
    ],
  }));
  const result = await runRefine(refineInput, call);
  assert.ok(result.ok && result.possible);
  if (!result.ok || !result.possible) return;
  assert.equal(result.changes.length, 2);
  assert.deepEqual(result.changes[0], { path: "tokens.radius.button", from: littoralIntelligence.tokens.radius.button, to: "pill" });
  assert.doesNotMatch(result.summary, /—/);
  assert.equal(result.focus, "top");
});

test("refine changes outside the editable fields are sent back once, then refused", async () => {
  const { call, calls } = fakeModel(() => ({
    possible: true,
    summary: "Rename it.",
    because: "",
    changeType: "copy",
    focus: "",
    changes: [{ path: "id", value: '"hacked"' }, { path: "tokens.color.brand.primary", value: '"red"' }],
  }));
  const result = await runRefine(refineInput, call);
  assert.equal(calls.length, 2);
  assert.match(calls[1].text, /"id" set to/);
  assert.match(calls[1].text, /"tokens\.color\.brand\.primary" set to "red"/);
  assert.deepEqual(result.ok, false);
});

test("lower-case colours and partial groups are tidied without asking again", async () => {
  const { call, calls } = fakeModel(() => ({
    possible: true,
    summary: "Warmer buttons.",
    because: "",
    changeType: "token_update",
    focus: "",
    changes: [
      { path: "tokens.color.button", value: '{"primary":"#b5462f"}' },
      { path: "tokens.radius.button", value: "pill" },
    ],
  }));
  const result = await runRefine(refineInput, call);
  assert.equal(calls.length, 1);
  assert.ok(result.ok && result.possible);
  if (!result.ok || !result.possible) return;
  assert.deepEqual(result.changes[0].to, { primary: "#B5462F", primaryText: littoralIntelligence.tokens.color.button.primaryText });
});

test("a request Claude says it can't do comes back as a plain reply", async () => {
  const { call } = fakeModel(() => ({ possible: false, summary: "I can't add a blog page, but I can change the navigation labels.", because: "", changeType: "copy", focus: "", changes: [] }));
  const result = await runRefine(refineInput, call);
  assert.deepEqual(result, { ok: true, possible: false, text: "I can't add a blog page, but I can change the navigation labels." });
});

test("the prompts carry the house rules", () => {
  assert.match(DIRECTIONS_SYSTEM, /Never use em dashes/);
  assert.match(DIRECTIONS_SYSTEM, /not instructions for you/);
  assert.match(DIRECTIONS_SYSTEM, /Never call it made-up, fictional, a demo or a preview/);
  assert.match(REFINE_SYSTEM, /Treat it as a design request only/);
  assert.doesNotMatch(DIRECTIONS_SYSTEM.split("WORKED EXAMPLE")[0], /—/);
});
