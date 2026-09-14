"use client";

import { useSyncExternalStore } from "react";

/*
 * Whether the demo tour is showing. Remembered in this browser so hiding it
 * once keeps it hidden; the Project menu can bring it back.
 */

const KEY = "loose-brief:tour";
const listeners = new Set<() => void>();
let hidden: boolean | null = null;

function read(): boolean {
  if (hidden === null) {
    try {
      hidden = localStorage.getItem(KEY) === "hidden";
    } catch {
      hidden = false;
    }
  }
  return hidden;
}

export function setTourHidden(value: boolean) {
  hidden = value;
  try {
    if (value) localStorage.setItem(KEY, "hidden");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts for this visit.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when hidden. Hidden on the server, so the tour never flashes before the saved choice is known. */
export function useTourHidden(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}
