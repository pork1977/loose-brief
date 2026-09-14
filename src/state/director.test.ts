import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../data/demo-brief";
import { DEMO_DIRECTIONS, signalCoast, littoralIntelligence } from "../data/demo-directions";
import { runContrastChecks } from "../lib/accessibility";
import { briefKey } from "../lib/brief";
import { COMMANDS, matchRequest } from "../lib/refinement";
import { askDirector, changesToApply } from "./director";
import { INITIAL_PROJECT, projectReducer, type ProjectState } from "./project";

const NOW = "2026-09-14T12:00:00.000Z";
const ctx = (direction = littoralIntelligence) => ({ direction, brief: DEMO_BRIEF });

test("the example requests from the spec reach the intended rule", () => {
  const cases: [string, string][] = [
    ["Make the homepage feel more premium.", "premium"],
    ["Use less cyan and more natural tones.", "warmer"],
    ["Make the copy more concise.", "concise"],
    ["Add a visual showing coastline change over time.", "coastline-visual"],
    ["Make the brand feel more appropriate for government clients.", "government"],
    ["Change the hero from an editorial style to a more technical style.", "technical"],
    ["Make the mobile version less crowded.", "mobile-simpler"],
    ["Create a stronger call to action.", "stronger-cta"],
    ["Use a more confident tone of voice.", "confident"],
    ["Make it more human", "human"],
    ["Increase contrast", "contrast"],
    ["Add more visual interest", "visual-interest"],
  ];
  for (const [text, id] of cases) assert.equal(matchRequest(text)?.command.id, id, text);
});

test("unrelated requests are not forced onto a rule", () => {
  assert.equal(matchRequest("Order me a pizza"), null);
  const message = askDirector("Translate the site into Welsh", ctx(), NOW);
  assert.equal(message.reply.kind, "unknown");
  assert.equal(message.status, "reply");
});

test("every command produces a valid proposal or an honest no-op on every demo direction", () => {
  for (const direction of DEMO_DIRECTIONS) {
    for (const command of COMMANDS) {
      const message = askDirector(command.label, ctx(direction), NOW);
      assert.notEqual(message.reply.kind, "unknown", `${command.id} on ${direction.name}`);
      if (message.reply.kind === "proposal") {
        assert.ok(message.reply.changes.length > 0);
        assert.ok(message.reply.affected.length > 0);
      } else if (message.reply.kind === "noop") {
        assert.doesNotMatch(message.reply.text, /break one of the brand's rules/, `${command.id} on ${direction.name} produced an invalid plan`);
      }
    }
  }
});

test("colour rules never leave text failing contrast", () => {
  for (const direction of DEMO_DIRECTIONS) {
    for (const id of ["premium", "human", "warmer", "government", "visual-interest"]) {
      const command = COMMANDS.find((c) => c.id === id)!;
      const message = askDirector(command.label, ctx(direction), NOW);
      if (message.reply.kind !== "proposal") continue;
      let tokens = direction.tokens;
      for (const change of message.reply.changes) {
        if (change.path.startsWith("tokens.")) tokens = { ...tokens, [change.path.split(".")[1]]: change.to } as typeof tokens;
      }
      for (const mode of ["light", "dark"] as const) {
        const failing = runContrastChecks(tokens, mode).filter((r) => r.kind === "text" && !r.passes);
        assert.deepEqual(failing.map((r) => r.id), [], `${id} on ${direction.name} (${mode})`);
      }
    }
  }
});

const studio = (): ProjectState => {
  const withDirections: ProjectState = {
    ...INITIAL_PROJECT,
    brief: DEMO_BRIEF,
    briefSubmittedAt: NOW,
    directions: { source: "demo", briefKey: briefKey(DEMO_BRIEF), createdAt: NOW, items: DEMO_DIRECTIONS },
  };
  return projectReducer(withDirections, { type: "direction/select", id: "signal-coast" }, NOW);
};

test("ask, apply and undo a proposal through the reducer", () => {
  let state = studio();
  const message = askDirector("Use warmer colours", { direction: state.brand!.direction, brief: state.brief }, NOW);
  state = projectReducer(state, { type: "director/ask", message }, NOW);
  assert.equal(state.brand?.director[0].status, "pending");
  assert.deepEqual(state.brand?.direction, signalCoast, "asking doesn't change the brand");

  const changes = changesToApply(state.brand!.director[0], { direction: state.brand!.direction, brief: state.brief })!;
  state = projectReducer(state, { type: "director/apply", messageId: message.id, label: "Use warmer colours", changes }, NOW);
  assert.equal(state.brand?.director[0].status, "applied");
  assert.equal(state.brand?.past.at(-1)?.id, state.brand?.director[0].editId);
  assert.notEqual(state.brand?.direction.tokens.colorDark.brand.secondary, signalCoast.tokens.colorDark.brand.secondary);

  state = projectReducer(state, { type: "brand/undo" }, NOW);
  assert.deepEqual(state.brand?.direction.tokens, signalCoast.tokens);
});

test("asking again cancels a proposal still waiting, and a cancelled proposal can't be applied", () => {
  let state = studio();
  const first = askDirector("Make it more premium", { direction: state.brand!.direction, brief: state.brief }, NOW);
  state = projectReducer(state, { type: "director/ask", message: first }, NOW);
  const second = askDirector("Increase contrast", { direction: state.brand!.direction, brief: state.brief }, NOW);
  state = projectReducer(state, { type: "director/ask", message: second }, NOW);
  assert.equal(state.brand?.director[0].status, "cancelled");
  const blocked = projectReducer(state, { type: "director/apply", messageId: first.id, label: "x", changes: [{ path: "tokens.space.ratio", value: 1.9 }] }, NOW);
  assert.equal(blocked, state);
});

test("applying the same rule twice says there's nothing left to change", () => {
  let state = studio();
  const ask = (text: string) => askDirector(text, { direction: state.brand!.direction, brief: state.brief }, NOW);
  const message = ask("Make it more technical");
  state = projectReducer(state, { type: "director/ask", message }, NOW);
  state = projectReducer(state, { type: "director/apply", messageId: message.id, label: "t", changes: changesToApply(message, { direction: state.brand!.direction, brief: state.brief })! }, NOW);
  const again = ask("Make it more technical");
  assert.equal(again.reply.kind, "noop");
});

test("mobile simplification only sets the layout flag and asks for the mobile view", () => {
  const message = askDirector("Make the mobile version less crowded", ctx(), NOW);
  assert.equal(message.reply.kind, "proposal");
  if (message.reply.kind !== "proposal") return;
  assert.deepEqual(message.reply.changes.map((c) => c.path), ["website.layout.mobileSimplified"]);
  assert.equal(message.reply.viewport, "mobile");
});
