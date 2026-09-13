import { firstInvalidStep } from "@/lib/brief";
import type { Stage } from "@/lib/stages";
import type { ProjectState } from "./project";

export type StageStatus = "done" | "available" | "locked";

/*
 * Which stages a visitor can open. Directions needs a finished brief.
 * Later stages stay open for now because they're placeholders; Phase 4 locks
 * them behind a chosen direction.
 */
export function stageStatuses(state: ProjectState): Record<Stage["id"], StageStatus> {
  const briefDone = state.briefSubmittedAt !== null && firstInvalidStep(state.brief) === -1;
  return {
    brief: briefDone ? "done" : "available",
    directions: briefDone ? "available" : "locked",
    "brand-system": "available",
    studio: "available",
    export: "available",
  };
}
