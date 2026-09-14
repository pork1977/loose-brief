import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../data/demo-brief";
import { DEMO_DIRECTIONS } from "../data/demo-directions";
import { briefKey } from "../lib/brief";
import { INITIAL_PROJECT, PROJECT_VERSION, projectReducer, restoreProject, type ProjectState } from "./project";
import { directionsAreStale, selectedDirection, stageStatuses } from "./progress";

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
  assert.equal(state.version, PROJECT_VERSION);
  assert.deepEqual(state.brief, DEMO_BRIEF);
  assert.equal(state.directions, null);
  assert.equal(state.selectedDirectionId, null);
  assert.equal(state.brand, null);
});

test("a Phase 4 save (version 2) with a selected demo direction upgrades and gets a brand to edit", () => {
  // Phase 4 directions had no strategy, dark colours or spacing.
  const oldItems = DEMO_DIRECTIONS.map((d) => ({ id: d.id, letter: d.letter, name: d.name }));
  const v2 = {
    version: 2,
    brief: DEMO_BRIEF,
    briefStep: 0,
    furthestStep: 4,
    briefSubmittedAt: NOW,
    directions: { source: "demo", briefKey: briefKey(DEMO_BRIEF), createdAt: NOW, items: oldItems },
    selectedDirectionId: "signal-coast",
    updatedAt: NOW,
  };
  const { state, problem } = restoreProject(JSON.stringify(v2));
  assert.equal(problem, "none");
  assert.equal(state.directions?.items.length, 3);
  assert.equal(state.selectedDirectionId, "signal-coast");
  assert.equal(state.brand?.sourceId, "signal-coast");
  assert.equal(state.brand?.previewMode, "dark");
});

const selected = (id = "littoral-intelligence") => projectReducer(withDirections(), { type: "direction/select", id }, NOW);
const later = (ms: number) => new Date(Date.parse(NOW) + ms).toISOString();

test("selecting a direction starts a brand from a copy of it", () => {
  const state = selected();
  assert.equal(state.brand?.sourceId, "littoral-intelligence");
  assert.deepEqual(state.brand?.direction, DEMO_DIRECTIONS[0]);
  assert.notEqual(state.brand?.direction, DEMO_DIRECTIONS[0], "should be a copy, not the same object");
});

test("brand edits apply, undo and redo", () => {
  let state = selected();
  state = projectReducer(state, { type: "brand/edit", label: "Primary colour", changes: [{ path: "tokens.color.brand.primary", value: "#1F5E52" }] }, NOW);
  assert.equal(state.brand?.direction.tokens.color.brand.primary, "#1F5E52");
  assert.equal(state.brand?.past.length, 1);

  state = projectReducer(state, { type: "brand/undo" }, later(1));
  assert.equal(state.brand?.direction.tokens.color.brand.primary, "#083B66");
  assert.equal(state.brand?.future.length, 1);

  state = projectReducer(state, { type: "brand/redo" }, later(2));
  assert.equal(state.brand?.direction.tokens.color.brand.primary, "#1F5E52");
  assert.equal(state.brand?.future.length, 0);
});

test("edits that would break the schema are refused", () => {
  const state = selected();
  for (const change of [
    { path: "tokens.color.brand.primary", value: "blue" },
    { path: "sample.headline", value: "" },
    { path: "tokens.typography.display.family", value: "Papyrus" },
    { path: "id", value: "hijack" },
    { path: "decisions", value: [] },
  ]) {
    assert.equal(projectReducer(state, { type: "brand/edit", label: "x", changes: [change] }, NOW), state, JSON.stringify(change));
  }
});

test("rapid edits with the same key merge into one undo step, but not after a pause", () => {
  let state = selected();
  const drag = (value: string, at: string) =>
    projectReducer(state, { type: "brand/edit", label: "Primary colour", coalesceKey: "primary", changes: [{ path: "tokens.color.brand.primary", value }] }, at);
  state = drag("#111111", later(0));
  state = drag("#222222", later(200));
  state = drag("#333333", later(400));
  assert.equal(state.brand?.past.length, 1);
  assert.equal(state.brand?.past[0].changes[0].from, "#083B66");
  assert.equal(state.brand?.past[0].changes[0].to, "#333333");

  state = drag("#444444", later(5000));
  assert.equal(state.brand?.past.length, 2);

  state = projectReducer(state, { type: "brand/undo" }, later(6000));
  state = projectReducer(state, { type: "brand/undo" }, later(6001));
  assert.equal(state.brand?.direction.tokens.color.brand.primary, "#083B66");
});

test("a new edit after undoing clears the redo stack", () => {
  let state = selected();
  state = projectReducer(state, { type: "brand/edit", label: "a", changes: [{ path: "strategy.promise", value: "One" }] }, later(0));
  state = projectReducer(state, { type: "brand/undo" }, later(10));
  state = projectReducer(state, { type: "brand/edit", label: "b", changes: [{ path: "strategy.promise", value: "Two" }] }, later(20));
  assert.equal(state.brand?.future.length, 0);
});

test("reset returns to the source direction and can itself be undone", () => {
  let state = selected();
  state = projectReducer(state, { type: "brand/edit", label: "Radius", changes: [{ path: "tokens.radius.button", value: "pill" }] }, later(0));
  state = projectReducer(state, { type: "brand/setPreviewMode", mode: "dark" }, later(5));
  state = projectReducer(state, { type: "brand/reset" }, later(10));
  assert.deepEqual(state.brand?.direction, DEMO_DIRECTIONS[0]);
  assert.equal(state.brand?.previewMode, "light");
  state = projectReducer(state, { type: "brand/undo" }, later(20));
  assert.equal(state.brand?.direction.tokens.radius.button, "pill");
});

test("re-selecting the same direction keeps edits; choosing another starts afresh", () => {
  let state = selected();
  state = projectReducer(state, { type: "brand/edit", label: "Promise", changes: [{ path: "strategy.promise", value: "Kept" }] }, NOW);
  state = projectReducer(state, { type: "direction/select", id: "littoral-intelligence" }, NOW);
  assert.equal(state.brand?.direction.strategy.promise, "Kept");
  state = projectReducer(state, { type: "direction/select", id: "shared-shore" }, NOW);
  assert.equal(state.brand?.sourceId, "shared-shore");
  assert.equal(state.brand?.past.length, 0);
});

test("the working copy is what later stages build on", () => {
  let state = selected();
  state = projectReducer(state, { type: "brand/edit", label: "Headline", changes: [{ path: "sample.headline", value: "Know your coast." }] }, NOW);
  assert.equal(selectedDirection(state)?.sample.headline, "Know your coast.");
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

test("a Phase 5 save (version 3) gains website sections and keeps brand edits", () => {
  const withoutWebsite = (d: (typeof DEMO_DIRECTIONS)[number]) => {
    const copy: Partial<typeof d> = { ...d };
    delete copy.website;
    return copy;
  };
  let chosen = projectReducer(withDirections(), { type: "direction/select", id: "shared-shore" }, NOW);
  chosen = projectReducer(chosen, { type: "brand/edit", label: "Promise", changes: [{ path: "strategy.promise", value: "Kept after upgrade" }] }, NOW);
  const v3 = {
    ...chosen,
    version: 3,
    directions: chosen.directions && { ...chosen.directions, items: chosen.directions.items.map(withoutWebsite) },
    brand: chosen.brand && { ...chosen.brand, direction: withoutWebsite(chosen.brand.direction) },
  };
  const { state, problem } = restoreProject(JSON.stringify(v3));
  assert.equal(problem, "none");
  assert.equal(state.brand?.direction.strategy.promise, "Kept after upgrade");
  assert.equal(state.brand?.direction.website.sections.length, 8);
  assert.equal(state.brand?.past.length, 1);
});

test("website copy and section visibility are editable, but the call to action can't be hidden", () => {
  const state = projectReducer(withDirections(), { type: "direction/select", id: "littoral-intelligence" }, NOW);
  const hidden = projectReducer(state, { type: "brand/edit", label: "Hide", changes: [{ path: "website.sections.0.hidden", value: true }] }, NOW);
  assert.equal(hidden.brand?.direction.website.sections[0].hidden, true);
  const cta = projectReducer(state, { type: "brand/edit", label: "Hide CTA", changes: [{ path: "website.sections.6.hidden", value: true }] }, NOW);
  assert.equal(cta, state);
  const retitled = projectReducer(state, { type: "brand/edit", label: "Title", changes: [{ path: "website.sections.1.title", value: "New title" }] }, NOW);
  assert.equal((retitled.brand?.direction.website.sections[1] as { title: string }).title, "New title");
});