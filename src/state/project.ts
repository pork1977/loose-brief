import { z } from "zod";
import { DEMO_DIRECTIONS } from "@/data/demo-directions";
import { BRIEF_STEPS, EMPTY_BRIEF, briefDraftSchema, type BriefDraft, type Material } from "@/lib/brief";
import { directionSchema, directionSetSchema, type Direction } from "@/lib/direction";
import { MODES, getPath, setPath, type Mode } from "@/lib/tokens";

/*
 * Project state: everything about the visitor's current project.
 *
 * The reducer is pure and has no browser code in it, so it can be unit tested
 * in Node. Saving, restoring and the React hook live in project-store.ts.
 */

export const PROJECT_VERSION = 5;

const directionsStateSchema = z.object({
  /** "demo" for the built-in Ebbfield set, "live" once generation exists. */
  source: z.enum(["demo", "live"]),
  /** briefKey() of the brief these were made from. */
  briefKey: z.string(),
  createdAt: z.string(),
  items: directionSetSchema,
});
export type DirectionsState = z.infer<typeof directionsStateSchema>;

/** One step in the brand's edit history. Each change records its value before and after, so it can be undone. */
const editSchema = z.object({
  id: z.string(),
  label: z.string().max(120),
  at: z.string(),
  /** Consecutive edits with the same key (dragging a colour picker, say) merge into one history step. */
  coalesceKey: z.string().nullable(),
  changes: z.array(z.object({ path: z.string().max(120), from: z.unknown(), to: z.unknown() })).max(40),
});
export type BrandEdit = z.infer<typeof editSchema>;

export const HISTORY_LIMIT = 60;
const COALESCE_MS = 1500;

export const DIRECTOR_LIMIT = 30;

/** One exchange with the Creative Director: what was asked and what it proposed. */
const directorMessageSchema = z.object({
  id: z.string().max(80),
  at: z.string(),
  request: z.string().max(300),
  reply: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("proposal"),
      commandId: z.string().max(40),
      changeType: z.string().max(40),
      summary: z.string().max(240),
      because: z.string().max(400),
      affected: z.array(z.string().max(80)).max(20),
      changes: z.array(z.object({ path: z.string().max(120), from: z.unknown(), to: z.unknown() })).min(1).max(40),
      match: z.number().min(0).max(1),
      focus: z.string().max(20).nullable(),
      viewport: z.enum(["desktop", "tablet", "mobile"]).nullable(),
    }),
    z.object({ kind: z.literal("noop"), commandId: z.string().max(40), text: z.string().max(400), focus: z.string().max(20).nullable() }),
    z.object({ kind: z.literal("unknown"), text: z.string().max(400) }),
  ]),
  status: z.enum(["pending", "applied", "cancelled", "reply"]),
  /** The history entry created by applying, so the panel can tell whether it's since been undone. */
  editId: z.string().nullable(),
});
export type DirectorMessage = z.infer<typeof directorMessageSchema>;

const brandStateSchema = z.object({
  /** The direction this brand was started from. Reset goes back to it. */
  sourceId: z.string(),
  /** The working copy everything after Directions reads and edits. */
  direction: directionSchema,
  /** Which colour set the preview is showing. A viewing choice, so not part of the history. */
  previewMode: z.enum(MODES),
  past: z.array(editSchema).max(HISTORY_LIMIT),
  future: z.array(editSchema).max(HISTORY_LIMIT),
  /** Creative Director conversation, newest last. */
  director: z.array(directorMessageSchema).max(DIRECTOR_LIMIT),
});
export type BrandState = z.infer<typeof brandStateSchema>;

export const projectSchema = z.object({
  version: z.literal(PROJECT_VERSION),
  brief: briefDraftSchema,
  /** The step currently open in the brief. */
  briefStep: z.number().int().min(0).max(BRIEF_STEPS.length - 1),
  /** Furthest step the visitor has reached, so earlier steps stay clickable. */
  furthestStep: z.number().int().min(0).max(BRIEF_STEPS.length - 1),
  /** Set when the visitor generates directions from a complete brief. */
  briefSubmittedAt: z.string().nullable(),
  directions: directionsStateSchema.nullable(),
  selectedDirectionId: z.string().nullable(),
  brand: brandStateSchema.nullable(),
  updatedAt: z.string().nullable(),
});
export type ProjectState = z.infer<typeof projectSchema>;

export const INITIAL_PROJECT: ProjectState = {
  version: PROJECT_VERSION,
  brief: EMPTY_BRIEF,
  briefStep: 0,
  furthestStep: 0,
  briefSubmittedAt: null,
  directions: null,
  selectedDirectionId: null,
  brand: null,
  updatedAt: null,
};

type SetField = {
  [K in keyof BriefDraft]: { type: "brief/set"; field: K; value: BriefDraft[K] };
}[keyof BriefDraft];

export type BrandChange = { path: string; value: unknown };

export type ProjectAction =
  | SetField
  | { type: "brief/goToStep"; step: number }
  | { type: "brief/loadDemo"; brief: BriefDraft }
  | { type: "brief/submit" }
  | { type: "material/add"; material: Material }
  | { type: "material/update"; id: string; patch: Partial<Omit<Material, "id">> }
  | { type: "material/remove"; id: string }
  | { type: "directions/set"; directions: DirectionsState }
  | { type: "direction/select"; id: string }
  | { type: "direction/applyTokenFix"; id: string; path: string; value: string }
  | { type: "brand/edit"; label: string; changes: BrandChange[]; coalesceKey?: string }
  | { type: "brand/undo" }
  | { type: "brand/redo" }
  | { type: "brand/reset" }
  | { type: "brand/setPreviewMode"; mode: Mode }
  | { type: "director/ask"; message: DirectorMessage }
  | { type: "director/apply"; messageId: string; label: string; changes: BrandChange[] }
  | { type: "director/cancel"; messageId: string }
  | { type: "director/clear" }
  | { type: "project/reset" };

/** Parts of a direction the brand editor may change. Ids, letters and the original reasoning stay fixed. */
const EDITABLE = /^(tokens|strategy|sample|voice|imagery|motion|website)(\.|$)|^visual$/;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function newBrand(direction: Direction): BrandState {
  return { sourceId: direction.id, direction: structuredClone(direction), previewMode: direction.tokens.mode, past: [], future: [], director: [] };
}

/** Apply changes to a direction, recording before and after. Null if nothing changed or the result is invalid. */
export function applyBrandChanges(direction: Direction, changes: BrandChange[], allowRoot = false) {
  let next = direction;
  const recorded: BrandEdit["changes"] = [];
  for (const { path, value } of changes) {
    if (!(allowRoot && path === "") && !EDITABLE.test(path)) return null;
    let from: unknown;
    try {
      from = getPath(next, path);
    } catch {
      return null;
    }
    if (same(from, value)) continue;
    next = setPath(next, path, value);
    recorded.push({ path, from, to: value });
  }
  if (!recorded.length) return null;
  // Everything the preview renders comes from here, so nothing unvalidated gets through.
  if (!directionSchema.safeParse(next).success) return null;
  return { direction: next, recorded };
}

function pushEdit(brand: BrandState, edit: BrandEdit, direction: Direction): BrandState {
  const last = brand.past.at(-1);
  const canMerge =
    last &&
    edit.coalesceKey !== null &&
    last.coalesceKey === edit.coalesceKey &&
    Date.parse(edit.at) - Date.parse(last.at) < COALESCE_MS;

  if (canMerge) {
    const merged = [...last.changes];
    for (const change of edit.changes) {
      const existing = merged.findIndex((c) => c.path === change.path);
      if (existing >= 0) merged[existing] = { ...merged[existing], to: change.to };
      else merged.push(change);
    }
    return { ...brand, direction, past: [...brand.past.slice(0, -1), { ...last, at: edit.at, changes: merged }], future: [] };
  }
  return { ...brand, direction, past: [...brand.past, edit].slice(-HISTORY_LIMIT), future: [] };
}

function replay(direction: Direction, changes: BrandEdit["changes"], use: "from" | "to"): Direction {
  const ordered = use === "from" ? [...changes].reverse() : changes;
  return ordered.reduce((d, change) => setPath(d, change.path, change[use]), direction);
}

export function projectReducer(state: ProjectState, action: ProjectAction, now = new Date().toISOString()): ProjectState {
  const touched = (next: Omit<ProjectState, "updatedAt">): ProjectState => ({ ...next, updatedAt: now });
  const lastStep = BRIEF_STEPS.length - 1;
  const editId = () => `${now}-${state.brand?.past.length ?? 0}`;

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
        directions: null,
        selectedDirectionId: null,
        brand: null,
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

    case "directions/set": {
      // A new set replaces the old one. Keep the selection only if that direction is still in it.
      const stillThere = action.directions.items.some((d) => d.id === state.selectedDirectionId);
      return touched({
        ...state,
        directions: action.directions,
        selectedDirectionId: stillThere ? state.selectedDirectionId : null,
        brand: stillThere ? state.brand : null,
      });
    }

    case "direction/select": {
      const direction = state.directions?.items.find((d) => d.id === action.id);
      if (!direction) return state;
      // Choosing the direction you're already building on keeps your edits.
      const brand = state.brand?.sourceId === action.id ? state.brand : newBrand(direction);
      return touched({ ...state, selectedDirectionId: action.id, brand });
    }

    case "direction/applyTokenFix": {
      if (!state.directions) return state;
      const target = state.directions.items.find((d) => d.id === action.id);
      if (!target) return state;
      const applied = applyBrandChanges(target, [{ path: `tokens.${action.path}`, value: action.value }]);
      if (!applied) return state;
      const items = state.directions.items.map((d) => (d.id === action.id ? applied.direction : d));

      // If this is the direction being built on, the fix lands in its history too, so it can be undone.
      let brand = state.brand;
      if (brand && brand.sourceId === action.id) {
        const onBrand = applyBrandChanges(brand.direction, [{ path: `tokens.${action.path}`, value: action.value }]);
        if (onBrand) {
          brand = pushEdit(brand, { id: editId(), label: "Contrast fix", at: now, coalesceKey: null, changes: onBrand.recorded }, onBrand.direction);
        }
      }
      return touched({ ...state, directions: { ...state.directions, items }, brand });
    }

    case "brand/edit": {
      if (!state.brand) return state;
      const applied = applyBrandChanges(state.brand.direction, action.changes);
      if (!applied) return state;
      const edit: BrandEdit = {
        id: editId(),
        label: action.label.slice(0, 120),
        at: now,
        coalesceKey: action.coalesceKey ?? null,
        changes: applied.recorded,
      };
      return touched({ ...state, brand: pushEdit(state.brand, edit, applied.direction) });
    }

    case "brand/undo": {
      const brand = state.brand;
      const edit = brand?.past.at(-1);
      if (!brand || !edit) return state;
      return touched({
        ...state,
        brand: {
          ...brand,
          direction: replay(brand.direction, edit.changes, "from"),
          past: brand.past.slice(0, -1),
          future: [edit, ...brand.future].slice(0, HISTORY_LIMIT),
        },
      });
    }

    case "brand/redo": {
      const brand = state.brand;
      const edit = brand?.future[0];
      if (!brand || !edit) return state;
      return touched({
        ...state,
        brand: {
          ...brand,
          direction: replay(brand.direction, edit.changes, "to"),
          past: [...brand.past, edit].slice(-HISTORY_LIMIT),
          future: brand.future.slice(1),
        },
      });
    }

    case "brand/reset": {
      const brand = state.brand;
      const source = state.directions?.items.find((d) => d.id === brand?.sourceId);
      if (!brand || !source) return state;
      // Reset is one history step, so it can be undone like anything else.
      const applied = applyBrandChanges(brand.direction, [{ path: "", value: source }], true);
      if (!applied) return state;
      const edit: BrandEdit = { id: editId(), label: `Reset to ${source.name}`, at: now, coalesceKey: null, changes: applied.recorded };
      return touched({ ...state, brand: { ...pushEdit(brand, edit, applied.direction), previewMode: source.tokens.mode } });
    }

    case "brand/setPreviewMode":
      if (!state.brand || state.brand.previewMode === action.mode) return state;
      return touched({ ...state, brand: { ...state.brand, previewMode: action.mode } });

    case "director/ask": {
      if (!state.brand) return state;
      // Asking again replaces any proposal still waiting for an answer.
      const earlier = state.brand.director.map((m) => (m.status === "pending" ? { ...m, status: "cancelled" as const } : m));
      return touched({ ...state, brand: { ...state.brand, director: [...earlier, action.message].slice(-DIRECTOR_LIMIT) } });
    }

    case "director/apply": {
      const brand = state.brand;
      const message = brand?.director.find((m) => m.id === action.messageId);
      if (!brand || !message || message.status !== "pending") return state;
      const applied = applyBrandChanges(brand.direction, action.changes);
      if (!applied) return state;
      const edit: BrandEdit = { id: editId(), label: action.label.slice(0, 120), at: now, coalesceKey: null, changes: applied.recorded };
      const withEdit = pushEdit(brand, edit, applied.direction);
      return touched({
        ...state,
        brand: {
          ...withEdit,
          director: withEdit.director.map((m) => (m.id === action.messageId ? { ...m, status: "applied" as const, editId: edit.id } : m)),
        },
      });
    }

    case "director/cancel": {
      const brand = state.brand;
      if (!brand?.director.some((m) => m.id === action.messageId && m.status === "pending")) return state;
      return touched({
        ...state,
        brand: { ...brand, director: brand.director.map((m) => (m.id === action.messageId ? { ...m, status: "cancelled" as const } : m)) },
      });
    }

    case "director/clear":
      if (!state.brand?.director.length) return state;
      return touched({ ...state, brand: { ...state.brand, director: [] } });

    case "project/reset":
      return { ...INITIAL_PROJECT, updatedAt: now };
  }
}

/** Earlier saved versions, upgraded one step at a time. */
function migrate(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data;
  let saved = data as Record<string, unknown>;

  if (saved.version === 1) {
    saved = { ...saved, version: 2, directions: null, selectedDirectionId: null };
  }

  if (saved.version === 2) {
    // Directions gained strategy, dark colours and spacing. Demo sets are swapped for the current
    // built-in versions; anything else can't be upgraded, so it's dropped.
    const directions = saved.directions as { source?: string; items?: { id: string }[] } | null;
    const upgraded =
      directions?.source === "demo" && Array.isArray(directions.items)
        ? { ...directions, items: directions.items.map((d) => DEMO_DIRECTIONS.find((demo) => demo.id === d.id)) }
        : null;
    const valid = upgraded && upgraded.items.every(Boolean) ? upgraded : null;
    const selected = valid?.items.find((d) => d?.id === saved.selectedDirectionId) ?? null;
    saved = {
      ...saved,
      version: 3,
      directions: valid,
      selectedDirectionId: selected ? saved.selectedDirectionId : null,
      brand: selected ? newBrand(selected as Direction) : null,
    };
  }

  if (saved.version === 3) {
    // Directions gained website sections. Add each demo direction's copy, keeping any edits already made.
    const withWebsite = (d: unknown) => {
      if (typeof d !== "object" || d === null) return d;
      const demo = DEMO_DIRECTIONS.find((x) => x.id === (d as { id?: string }).id);
      return demo ? { ...d, website: structuredClone(demo.website) } : d;
    };
    const directions = saved.directions as { items?: unknown[] } | null;
    const brand = saved.brand as { direction?: unknown } | null;
    saved = {
      ...saved,
      version: 4,
      directions: directions?.items ? { ...directions, items: directions.items.map(withWebsite) } : directions,
      brand: brand?.direction ? { ...brand, direction: withWebsite(brand.direction) } : brand,
    };
  }

  if (saved.version === 4) {
    // Websites gained a layout setting, and the brand gained the Creative Director conversation.
    const withLayout = (d: unknown) => {
      if (typeof d !== "object" || d === null) return d;
      const website = (d as { website?: Record<string, unknown> }).website;
      return website && !website.layout ? { ...d, website: { ...website, layout: { mobileSimplified: false } } } : d;
    };
    const directions = saved.directions as { items?: unknown[] } | null;
    const brand = saved.brand as { direction?: unknown } | null;
    saved = {
      ...saved,
      version: 5,
      directions: directions?.items ? { ...directions, items: directions.items.map(withLayout) } : directions,
      brand: brand ? { ...brand, direction: withLayout(brand.direction), director: [] } : brand,
    };
  }

  return saved;
}

/**
 * Read a saved project. Anything that fails validation is discarded rather
 * than half-trusted, and the caller is told so it can say so on screen.
 */
export function restoreProject(raw: string | null): { state: ProjectState; problem: "none" | "empty" | "unreadable" } {
  if (!raw) return { state: INITIAL_PROJECT, problem: "empty" };
  try {
    const parsed = projectSchema.safeParse(migrate(JSON.parse(raw)));
    if (parsed.success) return { state: parsed.data, problem: "none" };
  } catch {
    // Fall through: not JSON.
  }
  return { state: INITIAL_PROJECT, problem: "unreadable" };
}
