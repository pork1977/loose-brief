import { z } from "zod";
import { BRAND_FONTS, brandFont, nearestWeight, type BrandFontId } from "../brand-fonts";
import { MOTION_PRESETS, SHADOW_PRESETS, radiusScale } from "../brand-presets";
import type { BriefDraft } from "../brief";
import { deriveColorSet, repairContrast } from "../color-modes";
import { DESIGN_AREAS, VISUAL_STYLES, directionSchema, type Direction, type VisualStyle } from "../direction";
import { RADIUS_STEPS, type ColorSet, type Mode } from "../tokens";
import { SECTION_ORDER, type Website } from "../website";

/*
 * What Claude is asked to write for one direction, and how that becomes a
 * Direction the app can use.
 *
 * The draft is deliberately looser and smaller than a Direction. Claude makes
 * the creative choices (words, colours, fonts, how round, how it moves) and
 * this file does the mechanical parts: ids and letters, the second colour set,
 * contrast repair, line heights, radius and spacing values, shadows from a
 * preset. Then the result goes through the same strict schema as the built-in
 * directions, so nothing a model writes reaches the page unchecked.
 *
 * Length limits are described to the model rather than enforced in this
 * schema, because the API can't enforce them. `fit` trims anything that runs
 * over at a word boundary as a last resort.
 */

const s = (hint: string) => z.string().describe(hint);
const FONT_IDS = BRAND_FONTS.map((f) => f.id);
const SHADOW_IDS = SHADOW_PRESETS.map((p) => p.id);
const MOTION_IDS = MOTION_PRESETS.map((p) => p.id);
export const SPACING = { compact: { base: "0.875rem", ratio: 1.4 }, regular: { base: "1rem", ratio: 1.5 }, airy: { base: "1.125rem", ratio: 1.6 } } as const;

const item = z.object({ title: s("At most 40 characters"), body: s("At most 160 characters") });

export const directionDraftSchema = z.object({
  name: s("The direction's name, two or three words, at most 40 characters"),
  description: s("One sentence summing up the route, at most 120 characters"),
  strategy: z.object({
    positioning: s("Who it's for, what it is and why it's different, at most 280 characters"),
    promise: s("What the brand commits to, short enough to remember, at most 120 characters"),
  }),
  sample: z.object({
    eyebrow: s("Small label above the headline, at most 60 characters"),
    headline: s("Homepage headline, at most 90 characters"),
    body: s("Line under the headline, at most 220 characters"),
    primaryCta: s("Main button, based on the brief's primary action, at most 40 characters"),
    secondaryCta: s("Second button, at most 40 characters"),
    nav: z.array(s("A navigation link, at most 24 characters")).describe("Exactly three links"),
  }),
  voice: z.object({
    tone: s("The tone in a few words, at most 80 characters"),
    example: s("A sentence written in this voice, at most 140 characters"),
    words: z.array(s("At most 24 characters")).describe("Two to five words that sum up the voice"),
  }),
  imagery: z.object({
    style: s("What the imagery is, at most 120 characters"),
    treatment: s("How it's treated, at most 120 characters"),
    illustration: s("What any illustration shows, at most 160 characters"),
  }),
  motion: z.object({
    style: s("How it moves in a few words, at most 80 characters"),
    principle: s("The rule behind the movement, at most 160 characters"),
    preset: s(`One of: ${MOTION_IDS.join(", ")}`),
  }),
  decisions: z
    .array(
      z.object({
        area: s(`One of: ${DESIGN_AREAS.join(", ")}`),
        decision: s("The decision, at most 120 characters"),
        because: s("Why, tied to the brief, at most 320 characters"),
        sources: z
          .array(z.object({ kind: s("One of: trait, audience, problem, avoid, goal, reference, material"), value: s("The words from the brief this came from, at most 120 characters") }))
          .describe("One to four parts of the brief this decision came from"),
      }),
    )
    .describe("Exactly one decision for each of the six areas, in this order: colour, type, voice, imagery, motion, components"),
  tradeOff: s("What this route gives up, stated plainly, at most 200 characters"),
  colours: z
    .object({
      brandPrimary: s("Hex like #0A3D62"),
      brandSecondary: s("Hex"),
      brandAccent: s("Hex, for highlights and icons"),
      page: s("Hex, the page background"),
      card: s("Hex, cards and panels"),
      inverse: s("Hex, background of dark or inverse sections"),
      textPrimary: s("Hex, main text on the page"),
      textSecondary: s("Hex, secondary text on the page"),
      textInverse: s("Hex, text on the inverse background"),
      buttonPrimary: s("Hex, main button background"),
      buttonText: s("Hex, main button label"),
      border: s("Hex, subtle borders"),
    })
    .describe("The colour set for the brand's lead mode (light or dark, as given in the request)"),
  type: z.object({
    display: z.object({ font: s(`Font id, one of: ${FONT_IDS.join(", ")}`), weight: z.number().describe("Font weight, e.g. 400 or 600") }),
    body: z.object({ font: s("Font id"), weight: z.number() }),
    label: z.object({ font: s("Font id"), weight: z.number(), uppercase: z.boolean() }),
  }),
  shape: z.object({
    roundness: z.number().describe("Corner size in pixels from 0 (square) to 24 (very round)"),
    buttons: s(`Button corners, one of: ${RADIUS_STEPS.join(", ")}`),
    cards: s(`Card corners, one of: ${RADIUS_STEPS.join(", ")}`),
    shadow: s(`Card shadow, one of: ${SHADOW_IDS.join(", ")}`),
  }),
  spacing: s("One of: compact, regular, airy"),
  website: z.object({
    credibility: z.object({ label: s("Label for the strip, at most 60 characters"), items: z.array(s("At most 40 characters")).describe("Three to six") }),
    problem: z.object({
      eyebrow: s("At most 40 characters"),
      title: s("At most 90 characters"),
      body: s("At most 320 characters"),
      points: z.array(s("At most 120 characters")).describe("Two to four"),
    }),
    how: z.object({ eyebrow: s("At most 40 characters"), title: s("At most 90 characters"), steps: z.array(item).describe("Three or four steps") }),
    features: z.object({ eyebrow: s("At most 40 characters"), title: s("At most 90 characters"), items: z.array(item).describe("Three to six") }),
    impact: z.object({
      eyebrow: s("At most 40 characters"),
      title: s("At most 90 characters"),
      figures: z.array(z.object({ value: s("At most 12 characters"), label: s("At most 50 characters") })).describe("Exactly three"),
      quote: s("At most 240 characters"),
      attribution: s("At most 80 characters"),
    }),
    cta: z.object({
      eyebrow: s("At most 40 characters"),
      title: s("At most 80 characters"),
      body: s("At most 200 characters"),
      success: s("Shown after the form is sent, at most 160 characters"),
    }),
    footer: z.object({ tagline: s("At most 120 characters"), links: z.array(s("At most 24 characters")).describe("Two to six"), note: s("At most 160 characters") }),
  }),
});
export type DirectionDraft = z.infer<typeof directionDraftSchema>;

/*
 * The API limits how complex one structured reply can be, and a whole draft is
 * over it. So a direction is written in two requests: the brand itself first,
 * then the words, which are given the brand so the reasoning explains the real
 * choices and the copy is in its voice.
 */
export const BRAND_KEYS = ["name", "description", "strategy", "voice", "imagery", "motion", "tradeOff", "colours", "type", "shape", "spacing"] as const;
export const COPY_KEYS = ["sample", "decisions", "website"] as const;
export const brandPartSchema = directionDraftSchema.pick({ name: true, description: true, strategy: true, voice: true, imagery: true, motion: true, tradeOff: true, colours: true, type: true, shape: true, spacing: true });
export const copyPartSchema = directionDraftSchema.pick({ sample: true, decisions: true, website: true });
export type BrandPart = z.infer<typeof brandPartSchema>;
export type CopyPart = z.infer<typeof copyPartSchema>;

/** Which half of the draft a problem from assembleDirection belongs to. */
export const isCopyProblem = (problem: string) => /^(sample|decisions|website)\b/.test(problem);

/** The first step: three clearly different routes, planned together so they don't overlap. */
export const planSchema = z.object({
  routes: z
    .array(
      z.object({
        name: s("Working name, two or three words"),
        idea: s("The idea behind this route in one or two sentences"),
        visual: s(`Illustration style, one of: ${VISUAL_STYLES.join(", ")}. Each route uses a different one`),
        colour: s("The colour idea in a short phrase"),
        type: s("The type idea in a short phrase"),
        voice: s("The voice in a short phrase"),
        differs: s("What makes it different from the other two"),
      }),
    )
    .describe("Exactly three routes"),
});
export type Plan = z.infer<typeof planSchema>;
export type PlannedRoute = Plan["routes"][number];

/* ------------------------------------------------------------ assembling */

/** Trim text to a limit at a word boundary, and swap dashes used as punctuation for commas (house style). */
export function fit(text: string, max: number): string {
  const clean = text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  return (space >= max * 0.5 ? cut.slice(0, space) : clean.slice(0, max)).replace(/[\s,;:.-]+$/, "");
}

const HEX = /^#[0-9A-F]{6}$/;
function hex(value: string, fallback: string): string {
  const v = value.trim().toUpperCase();
  if (HEX.test(v)) return v;
  if (/^#[0-9A-F]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return fallback;
}

function font(value: string, fallback: BrandFontId): BrandFontId {
  const id = value.trim().toLowerCase().replace(/\s+/g, "-");
  return (FONT_IDS as string[]).includes(id) ? (id as BrandFontId) : fallback;
}

function oneOf<T extends string>(value: string, options: readonly T[], fallback: T): T {
  const v = value.trim().toLowerCase();
  return (options as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** Line height and tracking follow from the face chosen, so they aren't left to the model. */
function displayMetrics(id: BrandFontId) {
  const category = brandFont(id).category;
  if (category === "serif") return { lineHeight: 1, letterSpacing: "-0.01em" };
  if (category === "rounded") return { lineHeight: 1.05, letterSpacing: "-0.02em" };
  if (category === "mono") return { lineHeight: 1.1, letterSpacing: "-0.02em" };
  return { lineHeight: 1.02, letterSpacing: "-0.03em" };
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "direction";

const list = <T>(items: T[], min: number, max: number, pad: (i: number) => T) => {
  const out = items.slice(0, max);
  while (out.length < min) out.push(pad(out.length));
  return out;
};

/** The lead mode a brief asks for. "Both" and no preference lead with light. */
export function leadMode(brief: BriefDraft): Mode {
  return brief.theme === "dark" ? "dark" : "light";
}

type AssembleInput = { draft: DirectionDraft; letter: "A" | "B" | "C"; visual: VisualStyle; brief: BriefDraft };

/**
 * Build a Direction from a draft. Throws a readable error listing what's wrong
 * when the result still fails the strict schema, so the caller can ask again.
 */
export function assembleDirection({ draft, letter, visual, brief }: AssembleInput): Direction {
  const mode = leadMode(brief);
  const c = draft.colours;
  const fallback = mode === "dark" ? { page: "#12151A", text: "#F2F2F2" } : { page: "#FAF8F4", text: "#1C1C1C" };
  const lead: ColorSet = repairContrast({
    brand: { primary: hex(c.brandPrimary, "#1F4E79"), secondary: hex(c.brandSecondary, "#C9B28A"), accent: hex(c.brandAccent, "#2A9D8F") },
    surface: { page: hex(c.page, fallback.page), card: hex(c.card, mode === "dark" ? "#1B2027" : "#FFFFFF"), inverse: hex(c.inverse, fallback.text) },
    text: { primary: hex(c.textPrimary, fallback.text), secondary: hex(c.textSecondary, mode === "dark" ? "#B8BEC6" : "#5A5A5A"), inverse: hex(c.textInverse, fallback.page) },
    button: { primary: hex(c.buttonPrimary, "#1F4E79"), primaryText: hex(c.buttonText, "#FFFFFF") },
    border: { subtle: hex(c.border, mode === "dark" ? "#2C333C" : "#E2DDD3") },
  });
  const other = deriveColorSet(lead, mode === "dark" ? "light" : "dark");

  const displayFont = font(draft.type.display.font, "inter");
  const bodyFont = font(draft.type.body.font, "inter");
  const labelFont = font(draft.type.label.font, bodyFont);
  const shadowPreset = SHADOW_PRESETS.find((p) => p.id === draft.shape.shadow.trim().toLowerCase()) ?? SHADOW_PRESETS[2];
  const motionPreset = MOTION_PRESETS.find((p) => p.id === draft.motion.preset.trim().toLowerCase()) ?? MOTION_PRESETS[3];
  const spacing = SPACING[oneOf(draft.spacing, ["compact", "regular", "airy"] as const, "regular")];
  const w = draft.website;
  const name = fit(draft.name, 40);

  const decisions = DESIGN_AREAS.map((area) => draft.decisions.find((d) => d.area.trim().toLowerCase() === area)).filter(Boolean) as DirectionDraft["decisions"];
  const sourceKinds = ["trait", "audience", "problem", "avoid", "goal", "reference", "material"] as const;

  const website: Website = {
    layout: { mobileSimplified: false },
    sections: [
      { id: "credibility", type: "credibility", hidden: false, label: fit(w.credibility.label, 60), items: list(w.credibility.items.map((x) => fit(x, 40)), 3, 6, () => "Example partner") },
      {
        id: "problem",
        type: "problem",
        hidden: false,
        eyebrow: fit(w.problem.eyebrow, 40),
        title: fit(w.problem.title, 90),
        body: fit(w.problem.body, 320),
        points: list(w.problem.points.map((x) => fit(x, 120)), 2, 4, () => fit(brief.problem, 120)),
      },
      { id: "how", type: "how", hidden: false, eyebrow: fit(w.how.eyebrow, 40), title: fit(w.how.title, 90), steps: w.how.steps.slice(0, 4).map((x) => ({ title: fit(x.title, 40), body: fit(x.body, 160) })) },
      // The coastline explorer belongs to the Ebbfield demo, so it starts hidden on a generated site.
      { id: "data", type: "data", hidden: true, eyebrow: "Explore", title: "An interactive data section", body: "This section holds the Ebbfield demo's coastline explorer, which isn't written for your brand." },
      { id: "features", type: "features", hidden: false, eyebrow: fit(w.features.eyebrow, 40), title: fit(w.features.title, 90), items: w.features.items.slice(0, 6).map((x) => ({ title: fit(x.title, 40), body: fit(x.body, 160) })) },
      {
        id: "impact",
        type: "impact",
        hidden: false,
        eyebrow: fit(w.impact.eyebrow, 40),
        title: fit(w.impact.title, 90),
        figures: w.impact.figures.slice(0, 3).map((f) => ({ value: fit(f.value, 12), label: fit(f.label, 50) })),
        quote: fit(w.impact.quote, 240),
        attribution: fit(w.impact.attribution, 80),
      },
      { id: "cta", type: "cta", hidden: false, eyebrow: fit(w.cta.eyebrow, 40), title: fit(w.cta.title, 80), body: fit(w.cta.body, 200), success: fit(w.cta.success, 160) },
      { id: "footer", type: "footer", hidden: false, tagline: fit(w.footer.tagline, 120), links: list(w.footer.links.map((x) => fit(x, 24)), 2, 6, (i) => ["Privacy", "Contact"][i] ?? "Contact"), note: fit(w.footer.note, 160) },
    ],
  };

  const candidate = {
    id: `${slugify(name)}-${letter.toLowerCase()}`,
    letter,
    name,
    description: fit(draft.description, 120),
    visual,
    strategy: { positioning: fit(draft.strategy.positioning, 280), promise: fit(draft.strategy.promise, 120) },
    sample: {
      eyebrow: fit(draft.sample.eyebrow, 60),
      headline: fit(draft.sample.headline, 90),
      body: fit(draft.sample.body, 220),
      primaryCta: fit(draft.sample.primaryCta, 40),
      secondaryCta: fit(draft.sample.secondaryCta, 40),
      nav: list(draft.sample.nav.map((x) => fit(x, 24)), 3, 3, (i) => ["About", "Services", "Contact"][i]),
    },
    voice: { tone: fit(draft.voice.tone, 80), example: fit(draft.voice.example, 140), words: draft.voice.words.slice(0, 5).map((x) => fit(x, 24)) },
    imagery: { style: fit(draft.imagery.style, 120), treatment: fit(draft.imagery.treatment, 120), illustration: fit(draft.imagery.illustration, 160) },
    motion: { style: fit(draft.motion.style, 80), principle: fit(draft.motion.principle, 160) },
    decisions: decisions.map((d) => ({
      area: d.area.trim().toLowerCase(),
      decision: fit(d.decision, 120),
      because: fit(d.because, 320),
      sources: d.sources.slice(0, 4).map((src) => ({ kind: oneOf(src.kind, sourceKinds, "trait"), value: fit(src.value, 120) })),
    })),
    tradeOff: fit(draft.tradeOff, 200),
    tokens: {
      mode,
      color: mode === "light" ? lead : other,
      colorDark: mode === "dark" ? lead : other,
      typography: {
        display: { family: displayFont, weight: nearestWeight(displayFont, draft.type.display.weight), ...displayMetrics(displayFont) },
        body: { family: bodyFont, weight: nearestWeight(bodyFont, draft.type.body.weight), lineHeight: 1.6 },
        label: {
          family: labelFont,
          weight: nearestWeight(labelFont, draft.type.label.weight),
          letterSpacing: draft.type.label.uppercase ? "0.06em" : "0.01em",
          transform: draft.type.label.uppercase ? ("uppercase" as const) : ("none" as const),
        },
      },
      space: { ...spacing },
      radius: {
        ...radiusScale(draft.shape.roundness),
        button: oneOf(draft.shape.buttons, RADIUS_STEPS, "small"),
        card: oneOf(draft.shape.cards, RADIUS_STEPS, "medium"),
      },
      shadow: { card: shadowPreset.build(lead) },
      motion: motionPreset.motion,
    },
    website,
  };

  const parsed = directionSchema.safeParse(candidate);
  if (!parsed.success) {
    const problems = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new DraftError(problems);
  }
  return parsed.data;
}

export class DraftError extends Error {
  constructor(readonly problems: string[]) {
    super(`The direction didn't pass the checks: ${problems.join("; ")}`);
  }
}

/** Pick the three illustration styles, one each, keeping the plan's choices where they don't clash. */
export function assignVisuals(routes: PlannedRoute[]): VisualStyle[] {
  const out: VisualStyle[] = [];
  for (const route of routes) {
    const wanted = oneOf(route.visual, VISUAL_STYLES, VISUAL_STYLES[0]);
    out.push(out.includes(wanted) ? VISUAL_STYLES.find((v) => !out.includes(v))! : wanted);
  }
  return out;
}

/** The reverse of assembling: a built-in direction as a draft, used as the worked example in the prompt. */
export function toDraft(d: Direction): DirectionDraft {
  const lead = d.tokens.mode === "dark" ? d.tokens.colorDark : d.tokens.color;
  const section = <T extends (typeof SECTION_ORDER)[number]>(type: T) => d.website.sections.find((x) => x.type === type) as Extract<Website["sections"][number], { type: T }>;
  const shadow = SHADOW_PRESETS.find((p) => p.build(lead) === d.tokens.shadow.card)?.id ?? "soft";
  const motion = MOTION_PRESETS.find((p) => JSON.stringify(p.motion) === JSON.stringify(d.tokens.motion))?.id ?? "steady";
  const spacing = (Object.entries(SPACING).find(([, v]) => v.base === d.tokens.space.base && v.ratio === d.tokens.space.ratio)?.[0] ?? "regular") as keyof typeof SPACING;
  const { credibility, problem, how, features, impact, cta, footer } = {
    credibility: section("credibility"),
    problem: section("problem"),
    how: section("how"),
    features: section("features"),
    impact: section("impact"),
    cta: section("cta"),
    footer: section("footer"),
  };
  return {
    name: d.name,
    description: d.description,
    strategy: d.strategy,
    sample: { ...d.sample, nav: [...d.sample.nav] },
    voice: d.voice,
    imagery: d.imagery,
    motion: { ...d.motion, preset: motion },
    decisions: d.decisions,
    tradeOff: d.tradeOff,
    colours: {
      brandPrimary: lead.brand.primary,
      brandSecondary: lead.brand.secondary,
      brandAccent: lead.brand.accent,
      page: lead.surface.page,
      card: lead.surface.card,
      inverse: lead.surface.inverse,
      textPrimary: lead.text.primary,
      textSecondary: lead.text.secondary,
      textInverse: lead.text.inverse,
      buttonPrimary: lead.button.primary,
      buttonText: lead.button.primaryText,
      border: lead.border.subtle,
    },
    type: {
      display: { font: d.tokens.typography.display.family, weight: d.tokens.typography.display.weight },
      body: { font: d.tokens.typography.body.family, weight: d.tokens.typography.body.weight },
      label: { font: d.tokens.typography.label.family, weight: d.tokens.typography.label.weight, uppercase: d.tokens.typography.label.transform === "uppercase" },
    },
    shape: { roundness: parseFloat(d.tokens.radius.medium), buttons: d.tokens.radius.button, cards: d.tokens.radius.card, shadow },
    spacing,
    website: {
      credibility: { label: credibility.label, items: credibility.items },
      problem: { eyebrow: problem.eyebrow, title: problem.title, body: problem.body, points: problem.points },
      how: { eyebrow: how.eyebrow, title: how.title, steps: how.steps },
      features: { eyebrow: features.eyebrow, title: features.title, items: features.items },
      impact: { eyebrow: impact.eyebrow, title: impact.title, figures: impact.figures, quote: impact.quote, attribution: impact.attribution },
      cta: { eyebrow: cta.eyebrow, title: cta.title, body: cta.body, success: cta.success },
      footer: { tagline: footer.tagline, links: footer.links, note: footer.note },
    },
  };
}
