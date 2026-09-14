import { z } from "zod";
import { brandTokensSchema } from "./tokens";
import { websiteSchema } from "./website";

/*
 * A brand direction: one complete route a brand could take.
 *
 * The built-in Ebbfield directions and anything live generation produces
 * later must both pass this schema before they're stored or shown.
 */

export const VISUAL_STYLES = ["contours", "grid", "soft"] as const;
export type VisualStyle = (typeof VISUAL_STYLES)[number];

export const DESIGN_AREAS = ["colour", "type", "voice", "imagery", "motion", "components"] as const;
export type DesignArea = (typeof DESIGN_AREAS)[number];

export const AREA_LABELS: Record<DesignArea, string> = {
  colour: "Colour",
  type: "Type",
  voice: "Voice",
  imagery: "Imagery",
  motion: "Motion",
  components: "Components",
};

const text = (max: number) => z.string().trim().min(1).max(max);

/** Where in the brief a decision came from. */
export const sourceSchema = z.object({
  kind: z.enum(["trait", "audience", "problem", "avoid", "goal", "reference", "material"]),
  value: text(120),
});
export type DecisionSource = z.infer<typeof sourceSchema>;

export const decisionSchema = z.object({
  area: z.enum(DESIGN_AREAS),
  decision: text(120),
  because: text(320),
  sources: z.array(sourceSchema).min(1).max(4),
});
export type Decision = z.infer<typeof decisionSchema>;

export const directionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  letter: z.enum(["A", "B", "C"]),
  name: text(40),
  description: text(120),
  visual: z.enum(VISUAL_STYLES),
  strategy: z.object({
    /** Who it's for, what it is, and why it's different, in a sentence or two. */
    positioning: text(280),
    /** What the brand commits to, short enough to remember. */
    promise: text(120),
  }),
  sample: z.object({
    eyebrow: text(60),
    headline: text(90),
    body: text(220),
    primaryCta: text(40),
    secondaryCta: text(40),
    nav: z.tuple([text(24), text(24), text(24)]),
  }),
  voice: z.object({
    tone: text(80),
    example: text(140),
    words: z.array(text(24)).min(2).max(5),
  }),
  imagery: z.object({
    style: text(120),
    treatment: text(120),
    illustration: text(160),
  }),
  motion: z.object({
    style: text(80),
    principle: text(160),
  }),
  /** The reasoning behind each area, shown by "Show me why" and drawn on the identity canvas. */
  decisions: z.array(decisionSchema).min(DESIGN_AREAS.length).max(10),
  /** What this route gives up, stated plainly. */
  tradeOff: text(200),
  tokens: brandTokensSchema,
  /** Homepage sections below the hero, written in this direction's voice. */
  website: websiteSchema,
});

export type Direction = z.infer<typeof directionSchema>;

export const directionSetSchema = z.array(directionSchema).length(3).refine(
  (set) => new Set(set.map((d) => d.id)).size === 3 && new Set(set.map((d) => d.letter)).size === 3,
  "Directions need unique ids and letters.",
);
