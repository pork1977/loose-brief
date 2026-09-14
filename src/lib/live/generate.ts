import { z } from "zod";
import type { BriefDraft } from "../brief";
import { directionSchema, directionSetSchema, type Direction } from "../direction";
import { getPath, setPath } from "../tokens";
import { isDemoDirection } from "../../data/demo-ids";
import { CHANGE_TYPES, areaFor } from "../refinement";
import { applyBrandChanges, type BrandChange } from "../../state/project";
import { SECTION_ORDER } from "../website";
import {
  BRAND_KEYS,
  COPY_KEYS,
  DraftError,
  assembleDirection,
  assignVisuals,
  brandPartSchema,
  copyPartSchema,
  isCopyProblem,
  leadMode,
  planSchema,
  type BrandPart,
} from "./draft";
import { BRAND_PART_INSTRUCTION, DIRECTIONS_SYSTEM, PLAN_INSTRUCTION, REFINE_SYSTEM, briefBlock, copyPartInstruction, directionInstruction, type ImageNote, type SiteSummary } from "./prompts";

import type { DirectionsEvent, RefineRequest, RefineResponse } from "./protocol";

/** Keep only the expected keys, so a reply can't smuggle fields in from the other half. */
function pick<T extends object, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((k) => [k, value[k]])) as Pick<T, K>;
}

/*
 * The steps of a live run, written against a `ModelCall` function rather than
 * the Anthropic SDK directly. The route passes in the real call; the tests
 * pass in a fake one, so this logic is checked without spending anything.
 */

export type Block = { type: "text"; text: string; cache?: boolean } | { type: "image"; mediaType: string; data: string } | { type: "document"; data: string };

export type ModelCall = <T>(request: { step: "plan" | "brand" | "copy" | "refine"; system: string; blocks: Block[]; schema: z.ZodType<T>; maxTokens: number }) => Promise<T>;

/** A failure worth telling the visitor about in plain words. */
export class LiveError extends Error {}

type DirectionsInput = {
  brief: BriefDraft;
  /** Images and PDFs the visitor chose to share. */
  images: { mediaType: string; data: string; note: ImageNote }[];
  /** What was read from their current website, when they gave one and it could be fetched. */
  site?: SiteSummary | null;
  call: ModelCall;
  emit: (event: DirectionsEvent) => void;
};

export async function runDirections({ brief, images, site = null, call, emit }: DirectionsInput): Promise<Direction[]> {
  // Files first, then the brief: the same opening blocks on every call, so they're cached after the first.
  const shared: Block[] = [
    ...images.map((f): Block => (f.mediaType === "application/pdf" ? { type: "document", data: f.data } : { type: "image", mediaType: f.mediaType, data: f.data })),
    { type: "text", text: briefBlock(brief, images.map((i) => i.note), site), cache: true },
  ];

  emit({ type: "stage", stage: "planning" });
  let plan = await call({ step: "plan", system: DIRECTIONS_SYSTEM, blocks: [...shared, { type: "text", text: PLAN_INSTRUCTION }], schema: planSchema, maxTokens: 4000 });
  if (plan.routes.length < 3) {
    plan = await call({ step: "plan", system: DIRECTIONS_SYSTEM, blocks: [...shared, { type: "text", text: `${PLAN_INSTRUCTION}\n\nThere must be exactly three routes.` }], schema: planSchema, maxTokens: 4000 });
  }
  const routes = plan.routes.slice(0, 3);
  if (routes.length < 3) throw new LiveError("Claude didn't come back with three directions.");

  emit({ type: "planned", names: routes.map((r) => r.name) });
  emit({ type: "stage", stage: "writing" });

  const letters = ["A", "B", "C"] as const;
  const visuals = assignVisuals(routes);
  const mode = leadMode(brief);

  const writeOne = async (index: number, onBrand?: () => void): Promise<Direction> => {
    const route = routes[index];
    const others = routes.filter((_, i) => i !== index);
    const instruction = directionInstruction(route, others, letters[index], mode);
    const fix = (problems: string[]) => (problems.length ? `\n\nA previous attempt had these problems. Fix all of them:\n- ${problems.join("\n- ")}` : "");

    const askBrand = async (problems: string[] = []) =>
      pick(
        await call({ step: "brand", system: DIRECTIONS_SYSTEM, blocks: [...shared, { type: "text", text: `${instruction}\n\n${BRAND_PART_INSTRUCTION}${fix(problems)}` }], schema: brandPartSchema, maxTokens: 8000 }),
        BRAND_KEYS,
      );
    const askCopy = async (brand: BrandPart, problems: string[] = []) =>
      pick(
        await call({
          step: "copy",
          system: DIRECTIONS_SYSTEM,
          blocks: [...shared, { type: "text", text: `${instruction}\n\n${copyPartInstruction(brand)}${fix(problems)}` }],
          schema: copyPartSchema,
          maxTokens: 10000,
        }),
        COPY_KEYS,
      );

    let brand = await askBrand();
    onBrand?.();
    let copy = await askCopy(brand);
    const assemble = () => assembleDirection({ draft: { ...brand, ...copy }, letter: letters[index], visual: visuals[index], brief });
    try {
      return assemble();
    } catch (error) {
      if (!(error instanceof DraftError)) throw error;
      // One more go at whichever half failed, telling Claude exactly what didn't pass.
      emit({ type: "retry", index });
      const brandProblems = error.problems.filter((p) => !isCopyProblem(p));
      if (brandProblems.length) brand = await askBrand(brandProblems);
      copy = await askCopy(brand, error.problems.filter(isCopyProblem));
      try {
        return assemble();
      } catch (second) {
        if (second instanceof DraftError) throw new LiveError(`Direction ${letters[index]} still didn't pass the checks after a second try.`);
        throw second;
      }
    }
  };

  const finish = async (index: number, onBrand?: () => void) => {
    const direction = await writeOne(index, onBrand);
    emit({ type: "direction", index, direction });
    return direction;
  };

  /*
   * Each kind of request caches its own prefix (the reply schema counts as part
   * of it), and requests that start at the same moment all pay to write the
   * cache rather than read it. So direction A's brand request goes first, and B
   * and C start once it's back, reading what A wrote. Their word requests then
   * start after A's has begun, so they read its cache too. It costs a few
   * seconds and cuts the input cost of a run by about two thirds.
   */
  let brandDone!: () => void;
  const firstBrand = new Promise<void>((resolve) => (brandDone = resolve));
  const first = finish(0, brandDone);
  // If A fails outright, don't leave B and C waiting; Promise.all below reports the failure.
  first.catch(() => brandDone());
  await firstBrand;
  const directions = await Promise.all([first, finish(1), finish(2)]);

  const set = directionSetSchema.safeParse(directions);
  if (!set.success) throw new LiveError("The three directions didn't fit together (two came back the same).");
  return set.data;
}

/* -------------------------------------------------------------- refining */

const s = (hint: string) => z.string().describe(hint);

export const refineDraftSchema = z.object({
  possible: z.boolean().describe("False if the request can't be done by changing the fields described"),
  summary: s("One sentence saying what you'll change, or what you can do instead if it isn't possible. At most 240 characters"),
  because: s("Why this answers the request, one or two sentences. At most 320 characters"),
  changeType: s(`One of: ${CHANGE_TYPES.join(", ")}`),
  focus: s(`The homepage section most affected, one of: hero, ${SECTION_ORDER.join(", ")}. Empty if none`),
  changes: z
    .array(z.object({ path: s("Dot path of an existing value"), value: s("The new value as JSON") }))
    .describe("Every value to change. Empty if not possible"),
});

/** The parts of a direction Claude may change, with website sections labelled by index. */
function editableView(direction: Direction) {
  const { visual, illustration, strategy, sample, voice, imagery, motion, tokens, website } = direction;
  return { visual, illustration, strategy, sample, voice, imagery, motion, tokens, website };
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // A bare string without quotes is the most common slip; take it as the string it was meant to be.
    return raw;
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function mergeInto(current: unknown, next: unknown): unknown {
  if (!isPlainObject(current) || !isPlainObject(next)) return next;
  return Object.fromEntries(Object.keys(current).map((k) => [k, k in next ? mergeInto(current[k], next[k]) : current[k]]));
}

const upperHex = (v: unknown): unknown =>
  typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : Array.isArray(v) ? v.map(upperHex) : isPlainObject(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, upperHex(x)])) : v;

/**
 * Tidy the slips that aren't worth a second request: colours in lower case, and
 * a group given with only some of its values (which fills in from what's there).
 */
export function normaliseChange(direction: Direction, path: string, raw: string): BrandChange {
  let value = upperHex(parseValue(raw));
  try {
    value = mergeInto(getPath(direction, path), value);
  } catch {
    // The path doesn't exist; applyBrandChanges will say so.
  }
  return { path, value };
}

/** Which proposed changes fail on their own, so a retry can be told exactly what to fix. */
function diagnose(direction: Direction, changes: BrandChange[]): string[] {
  return changes.flatMap((change) => {
    if (applyBrandChanges(direction, [change])) return [];
    const shown = `"${change.path}" set to ${JSON.stringify(change.value).slice(0, 80)}`;
    let reason = "the path doesn't exist or can't be edited";
    try {
      getPath(direction, change.path);
      const issue = directionSchema.safeParse(setPath(direction, change.path, change.value)).error?.issues[0];
      reason = issue ? `${issue.path.join(".")}: ${issue.message}` : "it's the same as the current value";
    } catch {
      // keep the default reason
    }
    return [`${shown} isn't allowed (${reason})`];
  });
}

export async function runRefine({ request, direction, brief }: RefineRequest, call: ModelCall): Promise<RefineResponse> {
  const context = [
    `THE BRAND: ${brief.name}${brief.oneLiner ? `, ${brief.oneLiner}` : ""}. ${brief.description}`,
    `Audience: ${brief.audience.join(", ")}. Personality: ${brief.personality.join(", ")}.${brief.avoid.length ? ` Avoid: ${brief.avoid.join(", ")}.` : ""}`,
    "",
    "THE DIRECTION AS IT IS NOW (the values you can change):",
    JSON.stringify(editableView(direction)),
  ].join("\n");
  const blocks = (extra = ""): Block[] => [
    { type: "text", text: context },
    { type: "text", text: `THE VISITOR'S REQUEST:\n${request}${extra}` },
  ];

  let draft = await call({ step: "refine", system: REFINE_SYSTEM, blocks: blocks(), schema: refineDraftSchema, maxTokens: 6000 });
  if (!draft.possible || !draft.changes.length) return { ok: true, possible: false, text: draft.summary || "I can't do that one by changing this brand." };

  // The coastline explorer section belongs to the Ebbfield demo; a generated brand keeps it switched off.
  const allowed = (path: string) => isDemoDirection(direction.id) || !path.startsWith(`website.sections.${SECTION_ORDER.indexOf("data")}`);
  let changes: BrandChange[] = draft.changes.filter((c) => allowed(c.path.trim())).map((c) => normaliseChange(direction, c.path.trim(), c.value));
  let applied = applyBrandChanges(direction, changes);
  if (!applied) {
    const problems = diagnose(direction, changes);
    console.warn(`[live/refine] first answer rejected: ${problems.join(" | ") || "the changes only fail together"}`);
    draft = await call({
      step: "refine",
      system: REFINE_SYSTEM,
      blocks: blocks(`\n\nYour previous answer couldn't be used:\n- ${(problems.length ? problems : ["the changes together broke a rule, such as a length or format"]).join("\n- ")}\nTry again.`),
      schema: refineDraftSchema,
      maxTokens: 6000,
    });
    if (!draft.possible || !draft.changes.length) return { ok: true, possible: false, text: draft.summary || "I can't do that one by changing this brand." };
    changes = draft.changes.filter((c) => allowed(c.path.trim())).map((c) => normaliseChange(direction, c.path.trim(), c.value));
    applied = applyBrandChanges(direction, changes);
  }
  if (!applied) return { ok: false, message: "Claude suggested changes that didn't pass the brand's checks, so nothing was changed. Try wording it differently." };
  // A saved Creative Director message holds up to 40 changes; anything bigger is better asked for in parts.
  if (applied.recorded.length > 40) return { ok: false, message: "That would change too much in one go. Try asking for it in smaller steps." };

  const changeType = (CHANGE_TYPES as readonly string[]).includes(draft.changeType) ? draft.changeType : "token_update";
  // The Studio calls the hero "top" when it scrolls to it.
  const focus = draft.focus === "hero" ? "top" : (SECTION_ORDER as readonly string[]).includes(draft.focus) ? draft.focus : null;
  return {
    ok: true,
    possible: true,
    changeType,
    summary: draft.summary.replace(/\s*[—–]\s*/g, ", ").slice(0, 240),
    because: draft.because.replace(/\s*[—–]\s*/g, ", ").slice(0, 320),
    changes: applied.recorded,
    affected: [...new Set(applied.recorded.map((c) => areaFor(c.path)))],
    focus,
  };
}
