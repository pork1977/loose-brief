import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../data/demo-brief";
import { DEMO_DIRECTIONS } from "../data/demo-directions";
import { briefKey } from "../lib/brief";
import { INITIAL_PROJECT, projectReducer, restoreProject, type ProjectState } from "./project";
import { directionsAreStale, stageStatuses } from "./progress";

const NOW = "2026-09-13T12:00:00.000Z";

test("setting a field updates only that field", () => {
  const next = projectReducer(INITIAL_PROJECT, { type: "brief/set", field: "name", value: "Harbourlight" }, NOW);
  assert.equal(next.brief.name, "Harbourlight");
  assert.deepEqual(next.brief.pages, INITIAL_PROJECT.brief.pages);
  assert.equal(next.updatedAt, NOW);
});

test("moving through steps records the furthest one reached", () => {
  let state = projectReducer(INITIAL_PROJECT, { type: "brief/goToStep", step: 3 }, NOW);
  state = projectReducer(state, { type: "brief/goToStep", step: 1 }, NOW);
  assert.equal(state.briefStep, 1);
  assert.equal(state.furthestStep, 3);
});

test("steps are clamped to the ones that exist", () => {
  const state = projectReducer(INITIAL_PROJECT, { type: "brief/goToStep", step: 99 }, NOW);
  assert.equal(state.briefStep, 4);
});

test("loading the demo replaces the brief and clears a previous submission", () => {
  const submitted: ProjectState = { ...INITIAL_PROJECT, briefSubmittedAt: NOW };
  const state = projectReducer(submitted, { type: "brief/loadDemo", brief: DEMO_BRIEF }, NOW);
  assert.deepEqual(state.brief, DEMO_BRIEF);
  assert.equal(state.briefSubmittedAt, null);
  assert.equal(state.briefStep, 0);
});

test("reset returns to a blank project", () => {
  const edited = projectReducer(INITIAL_PROJECT, { type: "brief/loadDemo", brief: DEMO_BRIEF }, NOW);
  const state = projectReducer(edited, { type: "project/reset" }, NOW);
  assert.deepEqual({ ...state, updatedAt: null }, INITIAL_PROJECT);
});

test("materials can be added once, updated and removed", () => {
  const material = {
    id: "m1",
    fileName: "logo.svg",
    mimeType: "image/svg+xml",
    kind: "logo" as const,
    use: "in-site" as const,
    keepColours: true,
    alt: "",
    width: 100,
    height: 100,
    palette: [],
    exactColours: ["#083B66"],
    traits: { lightness: "dark" as const, saturation: "balanced" as const, temperature: "cool" as const },
    addedAt: NOW,
  };
  let state = projectReducer(INITIAL_PROJECT, { type: "material/add", material }, NOW);
  state = projectReducer(state, { type: "material/add", material }, NOW);
  assert.equal(state.brief.materials.length, 1);
  state = projectReducer(state, { type: "material/update", id: "m1", patch: { alt: "Ebbfield logo" } }, NOW);
  assert.equal(state.brief.materials[0].alt, "Ebbfield logo");
  state = projectReducer(state, { type: "material/remove", id: "m1" }, NOW);
  assert.equal(state.brief.materials.length, 0);
});

test("restoring a good save gives it back", () => {
  const saved = projectReducer(INITIAL_PROJECT, { type: "brief/loadDemo", brief: DEMO_BRIEF }, NOW);
  const { state, problem } = restoreProject(JSON.stringify(saved));
  assert.equal(problem, "none");
  assert.deepEqual(state, saved);
});

test("a Phase 3 save (version 1) upgrades without losing the brief", () => {
  const v1 = { version: 1, brief: DEMO_BRIEF, briefStep: 2, furthestStep: 4, briefSubmittedAt: NOW, updatedAt: NOW };
  const { state, problem } = restoreProject(JSON.stringify(v1));
  assert.equal(problem, "none");
  assert.equal(state.version, 2);
  assert.deepEqual(state.brief, DEMO_BRIEF);
  assert.equal(state.directions, null);
  assert.equal(state.selectedDirectionId, null);
});

const withDirections = (): ProjectState => ({
  ...INITIAL_PROJECT,
  brief: DEMO_BRIEF,
  briefSubmittedAt: NOW,
  directions: { source: "demo", briefKey: briefKey(DEMO_BRIEF), createdAt: NOW, items: DEMO_DIRECTIONS },
});

test("a direction can only be selected if it exists", () => {
  let state = projectReducer(withDirections(), { type: "direction/select", id: "signal-coast" }, NOW);
  assert.equal(state.selectedDirectionId, "signal-coast");
  state = projectReducer(state, { type: "direction/select", id: "made-up" }, NOW);
  assert.equal(state.selectedDirectionId, "signal-coast");
});

test("choosing a direction unlocks the later stages; editing the brief marks directions stale", () => {
  let state = withDirections();
  assert.equal(stageStatuses(state)["brand-system"], "locked");
  state = projectReducer(state, { type: "direction/select", id: "shared-shore" }, NOW);
  assert.equal(stageStatuses(state)["brand-system"], "available");
  assert.equal(stageStatuses(state).directions, "done");
  assert.equal(directionsAreStale(state), false);
  state = projectReducer(state, { type: "brief/set", field: "name", value: "Tidewise" }, NOW);
  assert.equal(directionsAreStale(state), true);
});

test("applying a contrast fix changes that one token on that one direction", () => {
  const state = projectReducer(
    withDirections(),
    { type: "direction/applyTokenFix", id: "littoral-intelligence", path: "color.brand.accent", value: "#2A9A8E" },
    NOW,
  );
  assert.equal(state.directions?.items[0].tokens.color.brand.accent, "#2A9A8E");
  assert.equal(state.directions?.items[1].tokens.color.brand.accent, DEMO_DIRECTIONS[1].tokens.color.brand.accent);
  const unchanged = projectReducer(state, { type: "direction/applyTokenFix", id: "littoral-intelligence", path: "color.nope", value: "#000000" }, NOW);
  assert.equal(unchanged, state);
});

test("loading the demo again clears directions and the selection", () => {
  const chosen = projectReducer(withDirections(), { type: "direction/select", id: "signal-coast" }, NOW);
  const state = projectReducer(chosen, { type: "brief/loadDemo", brief: DEMO_BRIEF }, NOW);
  assert.equal(state.directions, null);
  assert.equal(state.selectedDirectionId, null);
});

test("restoring junk, an unknown version or a wrong shape falls back to a blank project", () => {
  for (const raw of ["not json", JSON.stringify({ version: 0 }), JSON.stringify({ ...INITIAL_PROJECT, briefStep: "two" })]) {
    const { state, problem } = restoreProject(raw);
    assert.equal(problem, "unreadable");
    assert.deepEqual(state, INITIAL_PROJECT);
  }
  assert.equal(restoreProject(null).problem, "empty");
});
