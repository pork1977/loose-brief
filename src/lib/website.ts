import { z } from "zod";

/*
 * The homepage as data.
 *
 * The navigation and hero come from a direction's `sample` copy. Everything
 * below the hero is one of these sections, in a fixed order. Sections can be
 * hidden but not reordered, and the call to action and footer always stay.
 *
 * Every string has a length limit, partly so layouts can't be broken by an
 * endless headline, and partly because live generation will have to fill
 * this schema too.
 */

const t = (max: number) => z.string().trim().min(1).max(max);
const base = { id: z.string().regex(/^[a-z-]{2,30}$/), hidden: z.boolean() };

const credibility = z.object({ ...base, type: z.literal("credibility"), label: t(60), items: z.array(t(40)).min(3).max(6) });
const problem = z.object({ ...base, type: z.literal("problem"), eyebrow: t(40), title: t(90), body: t(320), points: z.array(t(120)).min(2).max(4) });
const how = z.object({
  ...base,
  type: z.literal("how"),
  eyebrow: t(40),
  title: t(90),
  steps: z.array(z.object({ title: t(40), body: t(160) })).min(3).max(4),
});
const data = z.object({ ...base, type: z.literal("data"), eyebrow: t(40), title: t(90), body: t(220) });
const features = z.object({
  ...base,
  type: z.literal("features"),
  eyebrow: t(40),
  title: t(90),
  items: z.array(z.object({ title: t(40), body: t(160) })).min(3).max(6),
});
const impact = z.object({
  ...base,
  type: z.literal("impact"),
  eyebrow: t(40),
  title: t(90),
  figures: z.array(z.object({ value: t(12), label: t(50) })).length(3),
  quote: t(240),
  attribution: t(80),
});
const cta = z.object({ ...base, type: z.literal("cta"), eyebrow: t(40), title: t(80), body: t(200), success: t(160) });
const footer = z.object({ ...base, type: z.literal("footer"), tagline: t(120), links: z.array(t(24)).min(2).max(6), note: t(160) });

export const SECTION_ORDER = ["credibility", "problem", "how", "data", "features", "impact", "cta", "footer"] as const;
export type SectionType = (typeof SECTION_ORDER)[number];

/** Sections that can't be hidden: the page needs its call to action and footer. */
export const LOCKED_SECTIONS: readonly SectionType[] = ["cta", "footer"];

const sectionSchema = z.discriminatedUnion("type", [credibility, problem, how, data, features, impact, cta, footer]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export const websiteSchema = z.object({
  sections: z
    .array(sectionSchema)
    .length(SECTION_ORDER.length)
    .refine((sections) => sections.every((s, i) => s.type === SECTION_ORDER[i]), "Sections must appear once each, in order.")
    .refine((sections) => sections.every((s) => !(s.hidden && LOCKED_SECTIONS.includes(s.type))), "The call to action and footer can't be hidden."),
});
export type Website = z.infer<typeof websiteSchema>;

export const SECTION_LABELS: Record<SectionType | "nav" | "hero", string> = {
  nav: "Navigation",
  hero: "Hero",
  credibility: "Credibility strip",
  problem: "Problem",
  how: "How it works",
  data: "Coastline explorer",
  features: "Features",
  impact: "Impact",
  cta: "Call to action",
  footer: "Footer",
};

export function sectionOf<T extends SectionType>(website: Website, type: T): SectionOf<T> {
  return website.sections[SECTION_ORDER.indexOf(type)] as SectionOf<T>;
}

/** Where the three nav links point: the nearest visible of these sections. */
const NAV_TARGETS: SectionType[][] = [
  ["how", "features", "problem"],
  ["data", "features", "impact"],
  ["impact", "features", "cta"],
];

export function navTarget(website: Website, index: number): SectionType {
  return NAV_TARGETS[index]?.find((type) => !sectionOf(website, type).hidden) ?? "cta";
}
