import { z } from "zod";
import { BRIEF_STEPS, EMPTY_BRIEF, briefDraftSchema, type BriefDraft, type Material } from "@/lib/brief";

/*
 * Project state: everything about the visitor's current project.
 *
 * The reducer is pure and has no browser code in it, so it can be unit tested
 * in Node. Saving, restoring and the React hook live in project-store.ts.
 */

export const PROJECT_VERSION = 1;

export const projectSchema = z.object({
  version: z.literal(PROJECT_VERSION),
  brief: briefDraftSchema,
  /** The step currently open in the brief. */
  briefStep: z.number().int().min(0).max(BRIEF_STEPS.length - 1),
  /** Furthest step the visitor has reached, so earlier steps stay clickable. */
  furthestStep: z.number().int().min(0).max(BRIEF_STEPS.length - 1),
  /** Set when the visitor generates directions from a complete brief. */
  briefSubmittedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});
export type ProjectState = z.infer<typeof projectSchema>;

export const INITIAL_PROJECT: ProjectState = {
  version: PROJECT_VERSION,
  brief: EMPTY_BRIEF,
  briefStep: 0,
  furthestStep: 0,
  briefSubmittedAt: null,
  updatedAt: null,
};

type SetField = {
  [K in keyof BriefDraft]: { type: "brief/set"; field: K; value: BriefDraft[K] };
}[keyof BriefDraft];

export type ProjectAction =
  | SetField
  | { type: "brief/goToStep"; step: number }
  | { type: "brief/loadDemo"; brief: BriefDraft }
  | { type: "brief/submit" }
  | { type: "material/add"; material: Material }
  | { type: "material/update"; id: string; patch: Partial<Omit<Material, "id">> }
  | { type: "material/remove"; id: string }
  | { type: "project/reset" };

export function projectReducer(state: ProjectState, action: ProjectAction, now = new Date().toISOString()): ProjectState {
  const touched = (next: Omit<ProjectState, "updatedAt">): ProjectState => ({ ...next, updatedAt: now });
  const lastStep = BRIEF_STEPS.length - 1;

  switch (action.type) {
    case "brief/set":
      return touched({ ...state, brief: { ...state.brief, [action.field]: action.value } });

    case "brief/goToStep": {
      const step = Math.max(0, Math.min(lastStep, action.step));
      return touched({ ...state, briefStep: step, furthestStep: Math.max(state.furthestStep, step) });
    }

    case "brief/loadDemo":
      return touched({
        ...state,
        brief: action.brief,
        briefStep: 0,
        furthestStep: lastStep,
        briefSubmittedAt: null,
      });

    case "brief/submit":
      return touched({ ...state, briefSubmittedAt: now, furthestStep: lastStep });

    case "material/add":
      if (state.brief.materials.some((m) => m.id === action.material.id)) return state;
      return touched({ ...state, brief: { ...state.brief, materials: [...state.brief.materials, action.material] } });

    case "material/update":
      return touched({
        ...state,
        brief: {
          ...state.brief,
          materials: state.brief.materials.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
        },
      });

    case "material/remove":
      return touched({
        ...state,
        brief: { ...state.brief, materials: state.brief.materials.filter((m) => m.id !== action.id) },
      });

    case "project/reset":
      return { ...INITIAL_PROJECT, updatedAt: now };
  }
}

/**
 * Read a saved project. Anything that fails validation is discarded rather
 * than half-trusted, and the caller is told so it can say so on screen.
 */
export function restoreProject(raw: string | null): { state: ProjectState; problem: "none" | "empty" | "unreadable" } {
  if (!raw) return { state: INITIAL_PROJECT, problem: "empty" };
  try {
    const parsed = projectSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { state: parsed.data, problem: "none" };
  } catch {
    // Fall through: not JSON.
  }
  return { state: INITIAL_PROJECT, problem: "unreadable" };
}
