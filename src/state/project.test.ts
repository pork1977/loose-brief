import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../data/demo-brief";
import { INITIAL_PROJECT, projectReducer, restoreProject, type ProjectState } from "./project";

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

test("restoring junk, an old version or a wrong shape falls back to a blank project", () => {
  for (const raw of ["not json", JSON.stringify({ version: 0 }), JSON.stringify({ ...INITIAL_PROJECT, briefStep: "two" })]) {
    const { state, problem } = restoreProject(raw);
    assert.equal(problem, "unreadable");
    assert.deepEqual(state, INITIAL_PROJECT);
  }
  assert.equal(restoreProject(null).problem, "empty");
});
