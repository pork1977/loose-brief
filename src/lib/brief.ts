import { z } from "zod";

/*
 * The brief: what a visitor tells Loose Brief about their business.
 *
 * Two levels of checking:
 *   - briefDraftSchema is lenient. A half-finished brief is still valid, so a
 *     saved draft always restores. It only guards against nonsense (wrong
 *     types, absurd lengths) from a corrupt or hand-edited save.
 *   - The step schemas are strict and run when a visitor moves on from a
 *     step or generates directions.
 */

export const LIMITS = {
  name: 40,
  oneLiner: 90,
  description: 600,
  problem: 400,
  audience: 6,
  tag: 60,
  traitsMin: 3,
  traitsMax: 5,
  avoid: 8,
  references: 5,
  reference: 200,
  pages: 8,
  materials: 8,
  alt: 160,
} as const;

export const MATERIAL_KINDS = ["logo", "photo", "texture", "screenshot", "other"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

const swatchSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/),
  share: z.number().min(0).max(1),
  l: z.number(),
  c: z.number(),
  h: z.number(),
});

export const materialSchema = z.object({
  id: z.string().min(1).max(64),
  fileName: z.string().max(200),
  mimeType: z.string().max(60),
  kind: z.enum(MATERIAL_KINDS),
  use: z.enum(["in-site", "inspiration"]),
  keepColours: z.boolean(),
  alt: z.string().max(LIMITS.alt),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  palette: z.array(swatchSchema).max(8),
  /** Colours written into an SVG file, most-used first. Empty for raster images. */
  exactColours: z.array(z.string().regex(/^#[0-9A-F]{6}$/)).max(12),
  traits: z.object({
    lightness: z.enum(["light", "mid", "dark"]),
    saturation: z.enum(["muted", "balanced", "vivid"]),
    temperature: z.enum(["warm", "cool", "neutral"]),
  }),
  addedAt: z.string(),
  /** The visitor agreed to send this image to Claude when generating directions. Off unless they tick it. */
  shareWithClaude: z.boolean().default(false),
});
export type Material = z.infer<typeof materialSchema>;

export const THEMES = ["light", "dark", "both"] as const;
export type ThemePreference = (typeof THEMES)[number];

export const briefDraftSchema = z.object({
  name: z.string().max(LIMITS.name * 2),
  oneLiner: z.string().max(LIMITS.oneLiner * 2),
  description: z.string().max(LIMITS.description * 2),
  audience: z.array(z.string().max(LIMITS.tag * 2)).max(LIMITS.audience * 2),
  problem: z.string().max(LIMITS.problem * 2),
  personality: z.array(z.string().max(LIMITS.tag * 2)).max(LIMITS.traitsMax * 2),
  avoid: z.array(z.string().max(LIMITS.tag * 2)).max(LIMITS.avoid * 2),
  references: z.array(z.string().max(LIMITS.reference * 2)).max(LIMITS.references * 2),
  theme: z.union([z.enum(THEMES), z.literal("")]),
  primaryAction: z.string().max(LIMITS.tag * 2),
  pages: z.array(z.string().max(LIMITS.tag * 2)).max(LIMITS.pages * 2),
  materials: z.array(materialSchema).max(LIMITS.materials),
});
export type BriefDraft = z.infer<typeof briefDraftSchema>;
export type BriefField = keyof BriefDraft;

export const EMPTY_BRIEF: BriefDraft = {
  name: "",
  oneLiner: "",
  description: "",
  audience: [],
  problem: "",
  personality: [],
  avoid: [],
  references: [],
  theme: "",
  primaryAction: "",
  pages: ["Home"],
  materials: [],
};

const trimmed = (min: number, max: number, tooShort: string, tooLong: string) =>
  z.string().trim().min(min, tooShort).max(max, tooLong);

const looksLikeUrl = (value: string) => /^https?:\/\//i.test(value.trim());
const isValidUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
};

export const BRIEF_STEPS = [
  {
    id: "context",
    number: "01",
    label: "Context",
    title: "What's the business?",
    fields: ["name", "oneLiner", "description"],
    schema: z.object({
      name: trimmed(1, LIMITS.name, "Give the brand a name.", `Keep the name to ${LIMITS.name} characters or fewer.`),
      oneLiner: z.string().trim().max(LIMITS.oneLiner, `Keep the one-liner to ${LIMITS.oneLiner} characters or fewer.`),
      description: trimmed(
        20,
        LIMITS.description,
        "Say a bit more about what the business does (at least 20 characters).",
        `Keep this to ${LIMITS.description} characters or fewer.`,
      ),
    }),
  },
  {
    id: "audience",
    number: "02",
    label: "Audience",
    title: "Who is it for?",
    fields: ["audience", "problem"],
    schema: z.object({
      audience: z
        .array(z.string().trim().min(1).max(LIMITS.tag))
        .min(1, "Add at least one audience.")
        .max(LIMITS.audience, `Add ${LIMITS.audience} audiences at most.`),
      problem: trimmed(
        10,
        LIMITS.problem,
        "Describe the problem you solve for them (at least 10 characters).",
        `Keep this to ${LIMITS.problem} characters or fewer.`,
      ),
    }),
  },
  {
    id: "personality",
    number: "03",
    label: "Personality",
    title: "How should it feel?",
    fields: ["personality"],
    schema: z.object({
      personality: z
        .array(z.string().trim().min(1).max(LIMITS.tag))
        .min(LIMITS.traitsMin, `Pick at least ${LIMITS.traitsMin} traits.`)
        .max(LIMITS.traitsMax, `Pick ${LIMITS.traitsMax} traits at most.`),
    }),
  },
  {
    id: "visual",
    number: "04",
    label: "Visual direction",
    title: "What should it look like?",
    fields: ["theme", "avoid", "references", "materials"],
    schema: z.object({
      theme: z.enum(THEMES, "Choose light, dark or both."),
      avoid: z.array(z.string().trim().min(1).max(LIMITS.tag)).max(LIMITS.avoid, `Add ${LIMITS.avoid} things at most.`),
      references: z
        .array(z.string().trim().min(1).max(LIMITS.reference, "Keep each reference to 200 characters or fewer."))
        .max(LIMITS.references, `Add ${LIMITS.references} references at most.`)
        .refine((refs) => refs.every((r) => !looksLikeUrl(r) || isValidUrl(r)), "One of the web addresses isn't valid."),
      materials: z.array(materialSchema).max(LIMITS.materials, `Add ${LIMITS.materials} files at most.`),
    }),
  },
  {
    id: "goals",
    number: "05",
    label: "Website goals",
    title: "What should the website do?",
    fields: ["primaryAction", "pages"],
    schema: z.object({
      primaryAction: trimmed(2, LIMITS.tag, "Choose what visitors should do.", `Keep this to ${LIMITS.tag} characters or fewer.`),
      pages: z
        .array(z.string().trim().min(1).max(LIMITS.tag))
        .min(1, "Choose at least one page.")
        .max(LIMITS.pages, `Choose ${LIMITS.pages} pages at most.`),
    }),
  },
] as const;

export type BriefStepId = (typeof BRIEF_STEPS)[number]["id"];
export type FieldErrors = Partial<Record<BriefField, string>>;

/** Check one step. Returns the first message for each field that fails. */
export function validateStep(index: number, brief: BriefDraft): FieldErrors {
  const step = BRIEF_STEPS[index];
  const result = step.schema.safeParse(brief);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as BriefField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

export function isStepValid(index: number, brief: BriefDraft): boolean {
  return Object.keys(validateStep(index, brief)).length === 0;
}

/** Index of the first step that fails, or -1 when the whole brief is ready. */
export function firstInvalidStep(brief: BriefDraft): number {
  return BRIEF_STEPS.findIndex((_, i) => !isStepValid(i, brief));
}

/** Short line for the summary: the one-liner if given, else the description's first sentence. */
export function summaryLine(brief: BriefDraft): string {
  if (brief.oneLiner.trim()) return brief.oneLiner.trim();
  const first = brief.description.trim().split(/(?<=[.!?])\s/)[0] ?? "";
  return first.length > 120 ? `${first.slice(0, 117).trimEnd()}...` : first;
}

/**
 * A short fingerprint of a brief (FNV-1a over its JSON, whitespace trimmed).
 * Directions store the key of the brief they were made from, so the studio can
 * tell when the brief has changed underneath them.
 */
export function briefKey(brief: BriefDraft): string {
  const json = JSON.stringify(brief, (_, v) => (typeof v === "string" ? v.trim() : v));
  let hash = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** How many of the questions have an answer, for the summary's progress line. */
export function answeredCount(brief: BriefDraft): { answered: number; total: number } {
  const checks = [
    brief.name.trim(),
    brief.oneLiner.trim(),
    brief.description.trim(),
    brief.audience.length,
    brief.problem.trim(),
    brief.personality.length >= LIMITS.traitsMin,
    brief.theme,
    brief.avoid.length,
    brief.references.length,
    brief.materials.length,
    brief.primaryAction.trim(),
    // Pages aren't counted: Home is pre-selected, so it would always read as answered.
  ];
  return { answered: checks.filter(Boolean).length, total: checks.length };
}
