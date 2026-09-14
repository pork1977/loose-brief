"use client";

import { useSyncExternalStore } from "react";
import { INITIAL_PROJECT, projectReducer, restoreProject, type ProjectAction, type ProjectState } from "./project";

/*
 * A tiny external store around the project reducer.
 *
 * Why not React state in a provider: the project has to survive a refresh,
 * stay in step across tabs, and be readable by the studio bar and every
 * screen without prop drilling. useSyncExternalStore gives all of that, and
 * its server snapshot (null) lets screens show a skeleton until the saved
 * project has been read, instead of flashing an empty form.
 */

export const STORAGE_KEY = "loose-brief:project";

export type SaveStatus = "idle" | "saved" | "failed";

export type ProjectSnapshot = {
  state: ProjectState;
  saveStatus: SaveStatus;
  /** True when a saved project existed but couldn't be read, so it was replaced. */
  restoreFailed: boolean;
};

let snapshot: ProjectSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function load(): ProjectSnapshot {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked. The project still works for this visit.
  }
  const { state, problem } = restoreProject(raw);
  return { state, saveStatus: "idle", restoreFailed: problem === "unreadable" };
}

function getSnapshot(): ProjectSnapshot {
  if (!snapshot) snapshot = load();
  return snapshot;
}

function getServerSnapshot(): null {
  return null;
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  // Another tab changed the project. Adopt its version.
  snapshot = { ...load(), restoreFailed: false };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/*
 * Saving waits for a short pause. Dragging a colour picker dispatches dozens
 * of edits a second, and writing the whole project to storage for each one
 * would make the drag stutter. Anything pending is written straight away if
 * the page is hidden or closed.
 */
const SAVE_DELAY_MS = 300;
let saveTimer: number | null = null;

function writeNow() {
  if (saveTimer !== null) {
    window.clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!snapshot) return;
  let saveStatus: SaveStatus = "saved";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.state));
  } catch {
    saveStatus = "failed";
  }
  if (saveStatus !== snapshot.saveStatus) {
    snapshot = { ...snapshot, saveStatus };
    emit();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", writeNow);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") writeNow();
  });
}

export function dispatch(action: ProjectAction) {
  const current = getSnapshot();
  const next = projectReducer(current.state, action);
  if (next === current.state) return;

  snapshot = {
    state: next,
    saveStatus: current.saveStatus === "failed" ? "failed" : "saved",
    restoreFailed: current.restoreFailed && action.type !== "project/reset",
  };
  emit();
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(writeNow, SAVE_DELAY_MS);
}

/** Write any pending change immediately, e.g. before navigating to another page. */
export const flushProject = writeNow;

export function dismissRestoreNotice() {
  const current = getSnapshot();
  if (!current.restoreFailed) return;
  snapshot = { ...current, restoreFailed: false };
  emit();
}

/** The project as it is right now, for event handlers that shouldn't subscribe to it. */
export function getProjectState(): ProjectState {
  return getSnapshot().state;
}

/** The whole project, or null while it's still being read on first render. */
export function useProject(): ProjectSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { INITIAL_PROJECT };
