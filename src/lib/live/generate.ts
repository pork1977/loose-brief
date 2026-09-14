import { z } from "zod";
import type { BriefDraft } from "../brief";
import { directionSetSchema, type Direction } from "../direction";
import { CHANGE_TYPES, areaFor } from "../refinement";
import { applyBrandChanges, type BrandChange } from "../../state/project";
import { SECTION_ORDER } from "../website";
import { DraftError, assembleDirection, assignVisuals, directionDraftSchema, leadMode, planSchema } from "./draft";
import { DIRECTIONS_SYSTEM, PLAN_INSTRUCTION, REFINE_SYSTEM, briefBlock, directionInstruction, type ImageNote } from "./prompts";
import type { DirectionsEvent, RefineRequest, RefineResponse } from "./protocol";

/*
 * The steps of a live run, written against a `ModelCall` function rather than
 * the Anthropic SDK directly. The route passes in the real call; the tests
 * pass in a fake one, so this logic is checked without spending anything.
 */

export type Block = { type: "text"; text: string; cache?: boolean } | { type: "image"; mediaType: string; data: string };

export type ModelCall = <T>(request: { step: "plan" | "direction" | "refine"; system: string; blocks: Block[]; schema: z.ZodType<T>; maxTokens: number }) => Promise<T>;

/** A failure worth telling the visitor about in plain words. */
export class LiveError extends Error {}

type DirectionsInput = {
  brief: BriefDraft;
  images: { mediaType: string; data: string; note: ImageNote }[];
  call: ModelCall;
  emit: (event: DirectionsEvent) => void;
};

export async function runDirections({ brief, images, call, emit }: DirectionsInput): Promise<Direction[]> {
  // Images first, then the brief: the same opening blocks on every call, so they're cached after the first.
  const shared: Block[] = [
    ...images.map((img) => ({ type: "image" as const, mediaType: img.mediaType, data: img.data })),
    { type: "text", text: briefBlock(brief, images.map((i) => i.note)), cache: true },
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

  const writeOne = async (index: number): Promise<Direction> => {
    const route = routes[index];
    const others = routes.filter((_, i) => i !== index);
    const instruction = directionInstruction(route, others, letters[index], mode);
    const ask = (extra = "") =>
      call({ step: "direction", system: DIRECTIONS_SYSTEM, blocks: [...shared, { type: "text", text: instruction + extra }], schema: directionDraftSchema, maxTokens: 12000 });

    let draft = await ask();
    try {
      return assembleDirection({ draft, letter: letters[index], visual: visuals[index], brief });
    } catch (error) {
      if (!(error instanceof DraftError)) throw error;
      // One more go, telling Claude exactly what didn't pass.
      emit({ type: "retry", index });
      draft = await ask(`\n\nA previous attempt at this direction had these problems. Fix all of them:\n- ${error.problems.join("\n- ")}`);
      try {
        return assembleDirection({ draft, letter: letters[index], visual: visuals[index], brief });
      } catch (second) {
        if (second instanceof DraftError) throw new LiveError(`Direction ${letters[index]} still didn't pass the checks after a second try.`);
        throw second;
      }
    }
  };

  const directions = await Promise.all(
    routes.map(async (_, index) => {
      const direction = await writeOne(index);
      emit({ type: "direction", index, direction });
      return direction;
    }),
  );

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
  const { visual, strategy, sample, voice, imagery, motion, tokens, website } = direction;
  return { visual, strategy, sample, voice, imagery, motion, tokens, website };
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // A bare string without quotes is the most common slip; take it as the string it was meant to be.
    return raw;
  }
}

/** Which proposed changes fail on their own, so a retry can be told exactly what to fix. */
function diagnose(direction: Direction, changes: BrandChange[]): string[] {
  return changes.flatMap((change) => (applyBrandChanges(direction, [change]) ? [] : [`"${change.path}" set to ${JSON.stringify(change.value).slice(0, 80)} isn't allowed (the path doesn't exist, isn't editable, or the value breaks a rule)`]));
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

  let changes: BrandChange[] = draft.changes.map((c) => ({ path: c.path.trim(), value: parseValue(c.value) }));
  let applied = applyBrandChanges(direction, changes);
  if (!applied) {
    const problems = diagnose(direction, changes);
    draft = await call({
      step: "refine",
      system: REFINE_SYSTEM,
      blocks: blocks(`\n\nYour previous answer couldn't be used:\n- ${(problems.length ? problems : ["the changes together broke a rule, such as a length or format"]).join("\n- ")}\nTry again.`),
      schema: refineDraftSchema,
      maxTokens: 6000,
    });
    if (!draft.possible || !draft.changes.length) return { ok: true, possible: false, text: draft.summary || "I can't do that one by changing this brand." };
    changes = draft.changes.map((c) => ({ path: c.path.trim(), value: parseValue(c.value) }));
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
