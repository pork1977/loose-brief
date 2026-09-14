import { briefKey, firstInvalidStep } from "@/lib/brief";
import type { Direction } from "@/lib/direction";
import type { Stage } from "@/lib/stages";
import type { ProjectState } from "./project";

export type StageStatus = "done" | "available" | "locked";

export function isBriefDone(state: ProjectState): boolean {
  return state.briefSubmittedAt !== null && firstInvalidStep(state.brief) === -1;
}

/** True when the stored directions were made from an older version of the brief. */
export function directionsAreStale(state: ProjectState): boolean {
  return state.directions !== null && state.directions.briefKey !== briefKey(state.brief);
}

export function selectedDirection(state: ProjectState): Direction | null {
  return state.directions?.items.find((d) => d.id === state.selectedDirectionId) ?? null;
}

/*
 * Which stages a visitor can open. Directions needs a finished brief; every
 * stage after it needs a chosen direction.
 */
export function stageStatuses(state: ProjectState): Record<Stage["id"], StageStatus> {
  const briefDone = isBriefDone(state);
  const chosen = briefDone && selectedDirection(state) !== null;
  return {
    brief: briefDone ? "done" : "available",
    directions: !briefDone ? "locked" : chosen ? "done" : "available",
    "brand-system": chosen ? "available" : "locked",
    studio: chosen ? "available" : "locked",
    export: chosen ? "available" : "locked",
  };
}
