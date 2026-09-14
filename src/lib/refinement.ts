import { z } from "zod";
import type { BriefDraft } from "./brief";
import { brandFont } from "./brand-fonts";
import { MOTION_PRESETS, SHADOW_PRESETS, TYPE_PRESETS, radiusScale } from "./brand-presets";
import { repairContrast, shiftContrast } from "./color-modes";
import type { Direction } from "./direction";
import { hexToOklch, oklchToHex } from "./palette";
import { MODES, colorKey, getPath, type BrandTokens, type ColorSet } from "./tokens";
import { SECTION_LABELS, SECTION_ORDER, type Section, type SectionType } from "./website";

/*
 * The Creative Director's built-in rules.
 *
 * A request is matched to one command by weighted key phrases. The command
 * then works out concrete changes for the current brand (so "make it warmer"
 * shifts whatever colours the brand has now) and returns a structured
 * proposal: what kind of change it is, a summary, the reasoning, the areas it
 * touches and every path it will set.
 *
 * Nothing here calls a model, and the panel says so. Live mode will produce the
 * same proposal shape from free text, and go through the same validation.
 */

export const CHANGE_TYPES = ["brand_strategy", "token_update", "copy", "section", "whole_site", "imagery", "motion"] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  brand_strategy: "Brand strategy",
  token_update: "Visual tokens",
  copy: "Copy",
  section: "Page sections",
  whole_site: "Whole site",
  imagery: "Imagery",
  motion: "Motion",
};

export type Viewport = "desktop" | "tablet" | "mobile";

export type Plan =
  | {
      kind: "proposal";
      changeType: ChangeType;
      summary: string;
      because: string;
      changes: { path: string; value: unknown }[];
      focus?: SectionType;
      viewport?: Viewport;
    }
  | { kind: "noop"; text: string; focus?: SectionType };

type Context = { direction: Direction; brief: BriefDraft };

type Command = {
  id: string;
  label: string;
  /** Phrases that point to this command, with how strongly. */
  phrases: [string, number][];
  plan: (ctx: Context) => Plan;
};

/* ----------------------------------------------------------- helpers */

const sets = (t: BrandTokens) => MODES.map((mode) => ({ mode, key: colorKey(mode), set: t[colorKey(mode)] }));

/** Change every brand colour in both modes with `fn`, then fix anything that no longer passes contrast. */
function recolour(t: BrandTokens, fn: (hex: string, role: "brand" | "button", mode: "light" | "dark") => string) {
  return sets(t).map(({ mode, key, set }) => {
    const next: ColorSet = {
      ...set,
      brand: { primary: fn(set.brand.primary, "brand", mode), secondary: fn(set.brand.secondary, "brand", mode), accent: fn(set.brand.accent, "brand", mode) },
      button: { ...set.button, primary: fn(set.button.primary, "button", mode) },
    };
    return { path: `tokens.${key}`, value: repairContrast(next) };
  });
}

const px = (value: string) => (value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value));
const sectionIndex = (type: SectionType) => SECTION_ORDER.indexOf(type);
const sectionOf = <T extends SectionType>(d: Direction, type: T) => d.website.sections[sectionIndex(type)] as Extract<Section, { type: T }>;
const preset = <T extends { id: string }>(list: T[], id: string) => list.find((p) => p.id === id) as T;

function firstSentence(text: string): string {
  const match = text.match(/^.+?[.!?](?=\s|$)/);
  const first = match ? match[0] : text;
  return first.length >= 24 ? first : text;
}

/** Nudge a hue towards a target by at most `max` degrees. */
function towardsHue(h: number, target: number, max: number) {
  const diff = ((target - h + 540) % 360) - 180;
  return (h + Math.sign(diff) * Math.min(Math.abs(diff), max) + 360) % 360;
}

function strongerAction(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("demo")) return "Book your demo";
  if (l.includes("call")) return "Book a call";
  if (l.includes("buy") || l.includes("shop")) return "Shop now";
  if (l.includes("sign") || l.includes("join")) return "Start now";
  if (l.includes("donat")) return "Donate today";
  if (l.includes("talk") || l.includes("touch") || l.includes("contact")) return "Talk to us today";
  return "Get started";
}

/* ---------------------------------------------------------- commands */

export const COMMANDS: Command[] = [
  {
    id: "premium",
    label: "Make it more premium",
    phrases: [["premium", 3], ["luxury", 3], ["high end", 3], ["upmarket", 3], ["sophisticated", 2], ["elegant", 2], ["refined", 2], ["classy", 2], ["expensive", 2]],
    plan: ({ direction }) => {
      const t = direction.tokens;
      const serif = brandFont(t.typography.display.family).category === "serif";
      const muted = recolour(t, (hex, role, mode) => {
        const c = hexToOklch(hex);
        const l = role === "button" && mode === "light" ? Math.max(0.2, c.l - 0.04) : c.l;
        return oklchToHex({ l, c: c.c * 0.8, h: c.h });
      });
      return {
        kind: "proposal",
        changeType: "token_update",
        summary: "Quieter colour, finer corners, more space, slower movement and an editorial type pairing.",
        because:
          "Premium brands tend to hold back: more room around things, less saturated colour, restrained corners and unhurried motion. Serif headlines carry a published, considered feel.",
        changes: [
          ...(serif ? [] : [{ path: "tokens.typography", value: preset(TYPE_PRESETS, "editorial").typography }]),
          ...muted,
          { path: "tokens.space.ratio", value: Math.min(2, Math.round((t.space.ratio + 0.1) * 100) / 100) },
          { path: "tokens.radius", value: { ...t.radius, ...radiusScale(Math.min(px(t.radius.medium), 4)), button: "small", card: "small" } },
          { path: "tokens.shadow.card", value: preset(SHADOW_PRESETS, "soft").build(t[colorKey(t.mode)]) },
          { path: "tokens.motion", value: preset(MOTION_PRESETS, "calm").motion },
        ],
      };
    },
  },
  {
    id: "human",
    label: "Make it more human",
    phrases: [["human", 3], ["friendly", 3], ["approachable", 3], ["warmer feel", 3], ["less corporate", 3], ["community", 2], ["personal", 2], ["softer", 2], ["welcoming", 2]],
    plan: ({ direction }) => {
      const t = direction.tokens;
      return {
        kind: "proposal",
        changeType: "whole_site",
        summary: "Rounded type, softer corners, warmer colour, springy movement and friendlier illustrations.",
        because:
          "Round letterforms and generous corners read as approachable, a small shift towards warm hues feels more personal, and a slight bounce in motion makes the site feel less mechanical.",
        changes: [
          { path: "tokens.typography", value: preset(TYPE_PRESETS, "friendly").typography },
          { path: "tokens.radius", value: { ...t.radius, ...radiusScale(14), button: "pill", card: "large" } },
          ...recolour(t, (hex) => {
            const c = hexToOklch(hex);
            return oklchToHex({ l: c.l, c: c.c * 1.1, h: towardsHue(c.h, 45, 12) });
          }),
          { path: "tokens.motion", value: preset(MOTION_PRESETS, "springy").motion },
          { path: "visual", value: "soft" },
          { path: "voice.tone", value: "Warm, friendly and practical" },
        ],
      };
    },
  },
  {
    id: "technical",
    label: "Make it more technical",
    phrases: [["technical", 3], ["techy", 3], ["technical style", 2], ["precise", 2], ["engineering", 2], ["futuristic", 2], ["data driven", 2], ["less editorial", 3], ["scientific", 1]],
    plan: ({ direction }) => {
      const t = direction.tokens;
      return {
        kind: "proposal",
        changeType: "whole_site",
        summary: "A grotesk and monospace type system, tight corners, hairline cards, quick motion and grid illustrations.",
        because:
          "Monospaced labels and a technical grotesk make figures look exact, square corners and hairlines read as instruments rather than marketing, and short, snappy motion feels responsive.",
        changes: [
          { path: "tokens.typography", value: preset(TYPE_PRESETS, "technical").typography },
          { path: "tokens.radius", value: { ...t.radius, ...radiusScale(4), button: "small", card: "small" } },
          { path: "tokens.shadow.card", value: preset(SHADOW_PRESETS, "hairline").build(t[colorKey(t.mode)]) },
          { path: "tokens.motion", value: preset(MOTION_PRESETS, "snappy").motion },
          { path: "visual", value: "grid" },
          { path: "voice.tone", value: "Direct, precise and measured" },
        ],
      };
    },
  },
  {
    id: "warmer",
    label: "Use warmer colours",
    phrases: [["warmer", 3], ["warm colour", 3], ["warm color", 3], ["natural", 2], ["earthy", 3], ["less cyan", 3], ["less blue", 3], ["less cold", 3], ["cosy", 2], ["natural tones", 2]],
    plan: ({ direction }) => ({
      kind: "proposal",
      changeType: "token_update",
      summary: "Shifts every brand colour towards warm, natural hues in both light and dark mode, keeping their lightness.",
      because:
        "Moving hues a little towards amber and earth tones warms the palette without losing the brand's recognisable balance. Lightness stays put, and any colour that falls below the contrast minimums is corrected.",
      changes: recolour(direction.tokens, (hex) => {
        const c = hexToOklch(hex);
        return oklchToHex({ l: c.l, c: c.c * 1.05, h: towardsHue(c.h, 55, 28) });
      }),
    }),
  },
  {
    id: "concise",
    label: "Make the copy more concise",
    phrases: [["concise", 3], ["shorter", 3], ["shorten", 3], ["less text", 3], ["fewer words", 3], ["wordy", 3], ["tighter copy", 3], ["trim", 2], ["too long", 2], ["copy", 1]],
    plan: ({ direction }) => {
      const changes: { path: string; value: unknown }[] = [];
      const add = (path: string, value: unknown) => {
        if (JSON.stringify(getPath(direction, path)) !== JSON.stringify(value)) changes.push({ path, value });
      };
      add("sample.body", firstSentence(direction.sample.body));
      const problem = sectionOf(direction, "problem");
      add(`website.sections.${sectionIndex("problem")}.body`, firstSentence(problem.body));
      add(`website.sections.${sectionIndex("problem")}.points`, problem.points.slice(0, 2));
      const features = sectionOf(direction, "features");
      add(`website.sections.${sectionIndex("features")}.items`, features.items.slice(0, 3));
      const cta = sectionOf(direction, "cta");
      add(`website.sections.${sectionIndex("cta")}.body`, firstSentence(cta.body));
      if (!changes.length) return { kind: "noop", text: "The copy is already about as short as these rules can make it. Every section is down to its first sentence and the fewest items." };
      return {
        kind: "proposal",
        changeType: "copy",
        summary: "Cuts longer paragraphs to their first sentence and trims lists to the strongest items.",
        because:
          "Visitors skim. The first sentence of each paragraph already carries the point, and three features are easier to take in than six. Rewriting sentences themselves needs a language model, which comes with live mode.",
        changes,
        focus: "problem",
      };
    },
  },
  {
    id: "contrast",
    label: "Increase contrast",
    phrases: [["contrast", 3], ["readable", 3], ["legible", 3], ["easier to read", 3], ["accessib", 2], ["hard to read", 3]],
    plan: ({ direction }) => {
      const changes = sets(direction.tokens).flatMap(({ key, set }) => {
        let next = set;
        for (let i = 0; i < 2; i++) next = shiftContrast(next, 1) ?? next;
        return JSON.stringify(next) === JSON.stringify(set) ? [] : [{ path: `tokens.${key}`, value: next }];
      });
      if (!changes.length) return { kind: "noop", text: "Text and borders are already at the strongest contrast these rules allow, in both light and dark mode." };
      return {
        kind: "proposal",
        changeType: "token_update",
        summary: "Strengthens text and border contrast in both light and dark mode.",
        because: "Moving text and hairlines further from the page colour makes body copy easier to read, especially on phones outdoors and for people with low vision.",
        changes,
      };
    },
  },
  {
    id: "mobile-simpler",
    label: "Make mobile simpler",
    phrases: [["mobile", 3], ["phone", 3], ["less crowded", 3], ["crowded", 2], ["cluttered", 2], ["small screen", 3], ["simpler", 1]],
    plan: ({ direction }) => {
      if (direction.website.layout.mobileSimplified) return { kind: "noop", text: "The mobile layout is already simplified. Switch the Studio to Mobile to see it." };
      return {
        kind: "proposal",
        changeType: "section",
        summary: "On phones only: hides the credibility strip, the hero illustration, the testimonial quote and features beyond the first three.",
        because: "A phone screen has room for one idea at a time. Dropping decoration and secondary proof gets visitors to the call to action sooner, while desktop keeps everything.",
        changes: [{ path: "website.layout.mobileSimplified", value: true }],
        viewport: "mobile",
      };
    },
  },
  {
    id: "coastline-visual",
    label: "Add a visual showing change over time",
    phrases: [["over time", 3], ["change over time", 3], ["coastline", 2], ["map", 2], ["timeline", 3], ["chart", 2], ["visualisation", 3], ["visualization", 3], ["data visual", 3]],
    plan: ({ direction }) => {
      const data = sectionOf(direction, "data");
      if (!data.hidden) {
        return { kind: "noop", text: "The coastline explorer already does this: it has a year slider from 2000 to a 2050 projection. I've scrolled the page to it.", focus: "data" };
      }
      return {
        kind: "proposal",
        changeType: "section",
        summary: "Brings back the coastline explorer, with its year slider from 2000 to a 2050 projection.",
        because: "Showing the same stretch of coast changing over time makes the problem concrete in a way a paragraph can't.",
        changes: [{ path: `website.sections.${sectionIndex("data")}.hidden`, value: false }],
        focus: "data",
      };
    },
  },
  {
    id: "visual-interest",
    label: "Add more visual interest",
    phrases: [["visual interest", 3], ["more visual", 3], ["boring", 3], ["dull", 3], ["plain", 2], ["flat", 2], ["livelier", 3], ["eye catching", 3], ["more interesting", 3], ["more colour", 2]],
    plan: ({ direction }) => {
      const t = direction.tokens;
      const unhide = (["credibility", "data", "impact"] as SectionType[])
        .filter((type) => sectionOf(direction, type).hidden)
        .map((type) => ({ path: `website.sections.${sectionIndex(type)}.hidden`, value: false }));
      const bolder = sets(t).map(({ key, set }) => {
        const c = hexToOklch(set.brand.accent);
        return { path: `tokens.${key}`, value: repairContrast({ ...set, brand: { ...set.brand, accent: oklchToHex({ ...c, c: c.c * 1.3 }) } }) };
      });
      return {
        kind: "proposal",
        changeType: "whole_site",
        summary: "A stronger accent colour, lifted cards, and any hidden visual sections switched back on.",
        because: "A more saturated accent gives the eye somewhere to land, a deeper card shadow adds depth, and the explorer, impact band and credibility strip break up long runs of text.",
        changes: [...unhide, ...bolder, { path: "tokens.shadow.card", value: preset(SHADOW_PRESETS, "lifted").build(t[colorKey(t.mode)]) }],
      };
    },
  },
  {
    id: "stronger-cta",
    label: "Make the CTA stronger",
    phrases: [["call to action", 3], ["cta", 3], ["stronger", 2], ["conversion", 3], ["more demos", 3], ["sign ups", 3], ["signups", 3], ["button", 1]],
    plan: ({ direction, brief }) => {
      const cta = sectionOf(direction, "cta");
      const name = brief.name.trim() || "us";
      const action = strongerAction(direction.sample.primaryCta);
      const reassurance = /demo|call/i.test(action) ? " It takes 30 minutes and there's no commitment." : " There's no commitment.";
      const body = cta.body.includes("no commitment") ? cta.body : `${cta.body}${reassurance}`;
      const title = `See what ${name} can do for you.`;
      const changes = [
        { path: "sample.primaryCta", value: action },
        { path: `website.sections.${sectionIndex("cta")}.title`, value: title.length <= 80 ? title : "See what it can do for you." },
        ...(body.length <= 200 ? [{ path: `website.sections.${sectionIndex("cta")}.body`, value: body }] : []),
      ].filter((c) => JSON.stringify(getPath(direction, c.path)) !== JSON.stringify(c.value));
      if (!changes.length) return { kind: "noop", text: "The call to action already uses the most direct wording these rules have.", focus: "cta" };
      return {
        kind: "proposal",
        changeType: "copy",
        summary: "A shorter, more direct button label, a title about what the visitor gets, and a line that removes the risk.",
        because: "Button labels work best as a short verb phrase in the visitor's words. Saying it's quick and there's no commitment answers the main reason people hesitate.",
        changes,
        focus: "cta",
      };
    },
  },
  {
    id: "confident",
    label: "Use a more confident tone",
    phrases: [["confident", 3], ["assertive", 3], ["bolder tone", 3], ["tone of voice", 2], ["authoritative", 3], ["punchier", 2]],
    plan: ({ direction }) => ({
      kind: "proposal",
      changeType: "brand_strategy",
      summary: "Sets confident tone-of-voice guidance and makes the button labels more direct.",
      because:
        "Confident writing states what the product does without hedging. These rules can set the guidance and tighten the buttons; rewriting headlines well needs a language model, which comes with live mode.",
      changes: [
        { path: "voice.tone", value: "Confident, direct and clear" },
        { path: "voice.words", value: ["Proven", "Clear", "Now", "Act"] },
        { path: "sample.primaryCta", value: strongerAction(direction.sample.primaryCta) },
      ].filter((c) => JSON.stringify(getPath(direction, c.path)) !== JSON.stringify(c.value)),
    }),
  },
  {
    id: "government",
    label: "Suit government clients",
    phrases: [["government", 3], ["council", 3], ["public sector", 3], ["local authorit", 3], ["official", 2], ["trustworthy", 2], ["institutional", 2]],
    plan: ({ direction, brief }) => {
      const t = direction.tokens;
      const plainSans: BrandTokens["typography"] = {
        display: { family: "ibm-plex-sans", weight: 600, lineHeight: 1.1, letterSpacing: "-0.02em" },
        body: { family: "ibm-plex-sans", weight: 400, lineHeight: 1.6 },
        label: { family: "ibm-plex-sans", weight: 600, letterSpacing: "0.04em", transform: "uppercase" },
      };
      const navy = recolour(t, (hex, role, mode) => {
        if (role !== "button") return hex;
        return oklchToHex({ l: mode === "light" ? 0.34 : 0.78, c: 0.09, h: 255 });
      }).map((change) => ({ ...change, value: shiftContrast(change.value, 1) ?? change.value }));
      const publicAudience = brief.audience.some((a) => /council|authorit|government|public/i.test(a));
      return {
        kind: "proposal",
        changeType: "whole_site",
        summary: "Plain, highly readable type, a sober navy for actions, square corners, steady motion and stronger contrast.",
        because:
          "Public sector buyers look for clarity and reliability over flair. Services like GOV.UK favour plain sans-serif type, restrained colour and high contrast, and procurement teams will check accessibility.",
        changes: [
          { path: "tokens.typography", value: plainSans },
          ...navy,
          { path: "tokens.radius", value: { ...t.radius, ...radiusScale(2), button: "small", card: "small" } },
          { path: "tokens.motion", value: preset(MOTION_PRESETS, "steady").motion },
          { path: "sample.eyebrow", value: publicAudience ? "For local authorities" : "For public sector teams" },
          { path: "voice.tone", value: "Plain, factual and reassuring" },
        ],
      };
    },
  },
];

/* ---------------------------------------------------------- matching */

const normalise = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

export type Match = { command: Command; score: number; runnerUp: Command | null };

export function matchRequest(text: string): Match | null {
  const input = normalise(text);
  const scored = COMMANDS.map((command) => ({
    command,
    score: command.phrases.reduce((sum, [phrase, weight]) => (input.includes(` ${phrase}`) ? sum + weight : sum), 0),
  }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length || scored[0].score < 2) return null;
  const runnerUp = scored[1] && scored[1].score >= scored[0].score ? scored[1].command : null;
  return { command: scored[0].command, score: scored[0].score, runnerUp };
}

export const commandById = (id: string) => COMMANDS.find((c) => c.id === id) ?? null;

/* -------------------------------------------------------- describing */

const MODE_WORD = { color: "light", colorDark: "dark" } as const;

/** A plain label for the area a changed path belongs to. */
export function areaFor(path: string): string {
  const parts = path.split(".");
  if (parts[0] === "tokens") {
    if (parts[1] === "color" || parts[1] === "colorDark") return `Colours (${MODE_WORD[parts[1]]} mode)`;
    return (
      { typography: "Typography", radius: "Corners", shadow: "Card shadow", motion: "Motion", space: "Spacing", mode: "Default colour mode" }[parts[1]] ?? "Visual tokens"
    );
  }
  if (parts[0] === "visual") return "Illustration style";
  if (parts[0] === "voice") return "Tone of voice";
  if (parts[0] === "strategy") return "Brand strategy";
  if (parts[0] === "imagery") return "Image direction";
  if (parts[0] === "motion") return "Motion guidance";
  if (parts[0] === "sample") return parts[1] === "primaryCta" || parts[1] === "secondaryCta" ? "Button labels" : "Hero copy";
  if (parts[0] === "website") {
    if (parts[1] === "layout") return "Mobile layout";
    const type = SECTION_ORDER[Number(parts[2])];
    const label = type ? SECTION_LABELS[type] : "Section";
    return parts[3] === "hidden" ? `${label} (shown or hidden)` : `${label} copy`;
  }
  return "Brand";
}

export type DiffRow = { area: string; label: string; from: string; to: string; colour: boolean };

const LEAF_LABELS: Record<string, string> = {
  "brand.primary": "Primary",
  "brand.secondary": "Secondary",
  "brand.accent": "Accent",
  "surface.page": "Page",
  "surface.card": "Card",
  "surface.inverse": "Inverse surface",
  "text.primary": "Text",
  "text.secondary": "Secondary text",
  "text.inverse": "Inverse text",
  "button.primary": "Button",
  "button.primaryText": "Button label",
  "border.subtle": "Border",
};

function flatten(value: unknown, prefix = ""): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { [prefix]: value };
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [k, v]) => ({ ...acc, ...flatten(v, prefix ? `${prefix}.${k}` : k) }), {});
}

const show = (v: unknown): string => {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" && x ? (x as { title?: string }).title ?? JSON.stringify(x) : String(x))).join(" · ");
  if (typeof v === "boolean") return v ? "On" : "Off";
  if (typeof v === "string" && v.startsWith("var(")) return v;
  return String(v);
};

/** Every individual value a proposal changes, as rows a person can read. */
export function diffRows(changes: { path: string; from: unknown; to: unknown }[]): DiffRow[] {
  return changes.flatMap((change) => {
    const area = areaFor(change.path);
    const from = flatten(change.from);
    const to = flatten(change.to);
    return Object.keys(to)
      .filter((k) => JSON.stringify(from[k]) !== JSON.stringify(to[k]))
      .map((k) => {
        const toValue = to[k];
        let label = LEAF_LABELS[k] ?? (k || change.path.split(".").at(-1) || "Value");
        if (change.path === "tokens.typography" && (k.endsWith("family"))) label = `${k.split(".")[0]} font`;
        const fmt = (v: unknown) => (k.endsWith("family") && typeof v === "string" ? brandFontName(v) : show(v));
        return {
          area,
          label: label.replace(/^./, (c) => c.toUpperCase()),
          from: from[k] === undefined ? "none" : fmt(from[k]),
          to: fmt(toValue),
          colour: typeof toValue === "string" && /^#[0-9A-F]{6}$/i.test(toValue),
        };
      });
  });
}

function brandFontName(id: string) {
  try {
    return brandFont(id as Parameters<typeof brandFont>[0]).name;
  } catch {
    return id;
  }
}

/** The proposal in the structured shape a developer (or, later, a model) would work with. */
export function proposalJson(reply: { changeType: string; summary: string; affected: string[]; changes: { path: string; to: unknown }[]; match: number }) {
  return {
    change_type: reply.changeType,
    summary: reply.summary,
    affected_areas: reply.affected,
    changes: Object.fromEntries(reply.changes.map((c) => [c.path, c.to])),
    confidence: Math.round(reply.match * 100) / 100,
  };
}

export const proposalSchema = z.object({
  change_type: z.enum(CHANGE_TYPES),
  summary: z.string().min(1).max(240),
  affected_areas: z.array(z.string()).min(1),
  changes: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
});
