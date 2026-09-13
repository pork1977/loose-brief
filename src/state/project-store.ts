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

export function dispatch(action: ProjectAction) {
  const current = getSnapshot();
  const next = projectReducer(current.state, action);
  if (next === current.state) return;

  let saveStatus: SaveStatus = "saved";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    saveStatus = "failed";
  }
  snapshot = { state: next, saveStatus, restoreFailed: current.restoreFailed && action.type !== "project/reset" };
  emit();
}

export function dismissRestoreNotice() {
  const current = getSnapshot();
  if (!current.restoreFailed) return;
  snapshot = { ...current, restoreFailed: false };
  emit();
}

/** The whole project, or null while it's still being read on first render. */
export function useProject(): ProjectSnapshot | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export { INITIAL_PROJECT };
