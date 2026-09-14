import type { Direction } from "@/lib/direction";

/*
 * The three built-in directions for the Ebbfield demo brand.
 *
 * Hand-written demo data, not model output, and the interface labels them
 * that way. They pass the same schema live generation will have to pass
 * (see lib/direction.ts, checked in direction.test.ts).
 *
 * All three render through the same components. Everything that differs
 * between them is in the tokens, the copy, and which illustration style to
 * draw.
 */

export type { VisualStyle } from "@/lib/direction";
export type DemoDirection = Direction;

export const DEMO_BRAND_NAME = "Ebbfield";

export const littoralIntelligence: Direction = {
  id: "littoral-intelligence",
  letter: "A",
  name: "Littoral Intelligence",
  description: "Quiet, editorial and scientifically credible.",
  visual: "contours",
  sample: {
    eyebrow: "Coastal intelligence",
    headline: "See the shoreline before it changes.",
    body: "Ebbfield turns coastal data into clear decisions for communities adapting to a changing climate.",
    primaryCta: "Request a demonstration",
    secondaryCta: "Explore the platform",
    nav: ["Platform", "Research", "Partners"],
  },
  voice: {
    tone: "Clear, calm and quietly confident",
    example: "Better evidence for decisions that last.",
    words: ["Evidence", "Change", "Plan", "Shoreline"],
  },
  imagery: {
    style: "Contour lines, survey marks and field-note textures",
    treatment: "Muted colour, fine lines, lots of paper-coloured space",
  },
  motion: {
    style: "Slow and fluid",
    principle: "Movement drifts sideways like a tide line rather than popping in.",
  },
  decisions: [
    {
      area: "colour",
      decision: "Deep ocean blue with warm sand",
      because: "Navy reads as established and trustworthy to councils. Sand stops it feeling cold, and the pale paper background keeps long reports easy on the eye.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "trait", value: "Grounded" },
      ],
    },
    {
      area: "type",
      decision: "Editorial serif headlines, plain sans for reading",
      because: "Instrument Serif gives headlines the weight of a published journal. Inter keeps longer explanations readable, and IBM Plex Mono marks data labels.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "trait", value: "Clear" },
      ],
    },
    {
      area: "voice",
      decision: "States the benefit calmly",
      because: "Lines like 'See the shoreline before it changes' promise foresight without the alarm the brief ruled out.",
      sources: [
        { kind: "trait", value: "Hopeful" },
        { kind: "avoid", value: "Alarmist language" },
      ],
    },
    {
      area: "imagery",
      decision: "Drawn contour lines instead of photos",
      because: "Shows the survey data behind the product and avoids stock photography, which the brief asked to avoid.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "avoid", value: "Corporate stock photography" },
      ],
    },
    {
      area: "motion",
      decision: "Slow, sideways drift",
      because: "Nothing jumps. Motion stays in the background so the evidence stays in front.",
      sources: [{ kind: "trait", value: "Grounded" }],
    },
    {
      area: "components",
      decision: "Square buttons, thin rules, flat colour",
      because: "Restrained shapes suit a planning tool, and flat colour keeps well clear of generic climate gradients.",
      sources: [
        { kind: "trait", value: "Clear" },
        { kind: "avoid", value: "Generic climate gradients" },
      ],
    },
  ],
  tradeOff: "The quiet, editorial feel could seem slow to a planner who wants the numbers straight away.",
  tokens: {
    color: {
      brand: { primary: "#083B66", secondary: "#D8B982", accent: "#53D6C7" },
      surface: { page: "#F6F4EE", card: "#FFFFFF", inverse: "#071B2A" },
      text: { primary: "#102A43", secondary: "#52606D", inverse: "#F6F4EE" },
      button: { primary: "#083B66", primaryText: "#FFFFFF" },
      border: { subtle: "#DDD6C8" },
    },
    typography: {
      display: { family: "instrument-serif", weight: 400, lineHeight: 0.95, letterSpacing: "-0.01em" },
      body: { family: "inter", weight: 400, lineHeight: 1.6 },
      label: { family: "ibm-plex-mono", weight: 500, letterSpacing: "0.08em", transform: "uppercase" },
    },
    radius: { small: "2px", medium: "6px", large: "12px", button: "small", card: "medium" },
    shadow: { card: "0 1px 0 rgba(8, 59, 102, 0.08), 0 12px 32px -18px rgba(8, 59, 102, 0.25)" },
    motion: { fast: "200ms", normal: "500ms", slow: "900ms", easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  },
};

export const signalCoast: Direction = {
  id: "signal-coast",
  letter: "B",
  name: "Signal Coast",
  description: "Technical and data-led, built around live measurement.",
  visual: "grid",
  sample: {
    eyebrow: "Shoreline monitor / live",
    headline: "Coastal change, measured every tide.",
    body: "Satellite, sensor and survey data in one model, so planners can see erosion as it happens.",
    primaryCta: "Book a demo",
    secondaryCta: "View the data",
    nav: ["Platform", "Data", "API"],
  },
  voice: {
    tone: "Direct, precise and measured",
    example: "1.4 metres of retreat, flagged before the storm season.",
    words: ["Measured", "Live", "Model", "Signal"],
  },
  imagery: {
    style: "Data grids, stepped contour lines and labelled survey points",
    treatment: "Dark ground, thin bright lines, one highlight colour for live readings",
  },
  motion: {
    style: "Quick and exact",
    principle: "Short, snappy changes, like a readout updating. Nothing lingers.",
  },
  decisions: [
    {
      area: "colour",
      decision: "Dark navy with electric cyan and a lime highlight",
      because: "A dark screen feels like the monitoring tools researchers already work in. Lime is saved for live readings, so it always means something.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "audience", value: "Coastal researchers" },
      ],
    },
    {
      area: "type",
      decision: "Space Grotesk headings, IBM Plex Sans body, JetBrains Mono for data",
      because: "A technical grotesk with a monospaced face for figures makes numbers line up and look exact.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "trait", value: "Clear" },
      ],
    },
    {
      area: "voice",
      decision: "Leads with the measurement",
      because: "Specific figures do the persuading, which suits researchers and planners who want evidence first.",
      sources: [
        { kind: "trait", value: "Clear" },
        { kind: "audience", value: "Environmental planners" },
      ],
    },
    {
      area: "imagery",
      decision: "Grids and labelled survey points",
      because: "Every graphic looks like real output from the platform, with no gradients or stock photos.",
      sources: [
        { kind: "trait", value: "Scientific" },
        { kind: "avoid", value: "Generic climate gradients" },
      ],
    },
    {
      area: "motion",
      decision: "Fast, precise transitions",
      because: "Quick changes make the product feel responsive and live.",
      sources: [{ kind: "trait", value: "Clear" }],
    },
    {
      area: "components",
      decision: "Tight corners and outlined cards",
      because: "Sharp edges and fine outlines read as instrument panels rather than marketing.",
      sources: [{ kind: "trait", value: "Scientific" }],
    },
  ],
  tradeOff: "Hopeful is the trait this route plays down most. It may feel cold to community groups.",
  tokens: {
    color: {
      brand: { primary: "#0F2A47", secondary: "#22D3EE", accent: "#C6F432" },
      surface: { page: "#07111F", card: "#0C1B2E", inverse: "#030A14" },
      text: { primary: "#E6F1FA", secondary: "#8FA6BC", inverse: "#E6F1FA" },
      button: { primary: "#22D3EE", primaryText: "#03121C" },
      border: { subtle: "#1C3350" },
    },
    typography: {
      display: { family: "space-grotesk", weight: 600, lineHeight: 1, letterSpacing: "-0.03em" },
      body: { family: "ibm-plex-sans", weight: 400, lineHeight: 1.55 },
      label: { family: "jetbrains-mono", weight: 500, letterSpacing: "0.04em", transform: "uppercase" },
    },
    radius: { small: "2px", medium: "4px", large: "6px", button: "small", card: "small" },
    shadow: { card: "0 0 0 1px rgba(34, 211, 238, 0.12)" },
    motion: { fast: "120ms", normal: "240ms", slow: "480ms", easing: "cubic-bezier(0.2, 0, 0, 1)" },
  },
};

export const sharedShore: Direction = {
  id: "shared-shore",
  letter: "C",
  name: "Shared Shore",
  description: "Warm, approachable and focused on the people who live there.",
  visual: "soft",
  sample: {
    eyebrow: "For coastal communities",
    headline: "Plan for the coast you share.",
    body: "Ebbfield helps councils, researchers and residents understand how their shoreline is changing, and what to do next.",
    primaryCta: "Talk to our team",
    secondaryCta: "See how it works",
    nav: ["How it works", "Stories", "Councils"],
  },
  voice: {
    tone: "Warm, practical and optimistic",
    example: "Your coastline is changing. Here's what you can do about it, together.",
    words: ["Together", "Local", "Practical", "Next steps"],
  },
  imagery: {
    style: "Soft shapes of land, water and sun, with room for real community photos later",
    treatment: "Rounded forms, gentle colour, plenty of warmth",
  },
  motion: {
    style: "Gentle with a little bounce",
    principle: "Things settle into place with a soft spring, friendly rather than technical.",
  },
  decisions: [
    {
      area: "colour",
      decision: "Seafoam and coral on soft cream",
      because: "Warm and optimistic without being alarming. Coral is kept for shapes and highlights; it's too light for text.",
      sources: [
        { kind: "trait", value: "Hopeful" },
        { kind: "avoid", value: "Alarmist language" },
      ],
    },
    {
      area: "type",
      decision: "Rounded Nunito headings",
      because: "Friendly enough for a residents' meeting while staying clear enough for a council report.",
      sources: [
        { kind: "trait", value: "Hopeful" },
        { kind: "trait", value: "Clear" },
      ],
    },
    {
      area: "voice",
      decision: "Talks to people, not stakeholders",
      because: "Plain, warm sentences that end with something to do next.",
      sources: [
        { kind: "trait", value: "Grounded" },
        { kind: "problem", value: "Coastal communities need clearer evidence" },
      ],
    },
    {
      area: "imagery",
      decision: "Drawn land, sea and sun shapes",
      because: "Warm without stock photography, which the brief ruled out. Real photos of real places can replace them later.",
      sources: [
        { kind: "trait", value: "Hopeful" },
        { kind: "avoid", value: "Corporate stock photography" },
      ],
    },
    {
      area: "motion",
      decision: "Soft, springy settling",
      because: "A slight bounce feels friendly and human.",
      sources: [{ kind: "trait", value: "Hopeful" }],
    },
    {
      area: "components",
      decision: "Pill buttons and generously rounded cards",
      because: "Rounded shapes lower the barrier for people who don't think of themselves as technical.",
      sources: [{ kind: "trait", value: "Grounded" }],
    },
  ],
  tradeOff: "Scientific comes through least. Research partners may find it too soft.",
  tokens: {
    color: {
      brand: { primary: "#1F6B63", secondary: "#8FD3C1", accent: "#E0694A" },
      surface: { page: "#FBF6EE", card: "#FFFFFF", inverse: "#1E4D4A" },
      text: { primary: "#243B3A", secondary: "#5B6B69", inverse: "#FBF6EE" },
      button: { primary: "#1F6B63", primaryText: "#FFFFFF" },
      border: { subtle: "#EADFCF" },
    },
    typography: {
      display: { family: "nunito", weight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" },
      body: { family: "nunito-sans", weight: 400, lineHeight: 1.6 },
      label: { family: "nunito-sans", weight: 700, letterSpacing: "0.01em", transform: "none" },
    },
    radius: { small: "10px", medium: "18px", large: "28px", button: "pill", card: "large" },
    shadow: { card: "0 18px 40px -24px rgba(31, 107, 99, 0.35)" },
    motion: { fast: "180ms", normal: "380ms", slow: "700ms", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  },
};

export const DEMO_DIRECTIONS: Direction[] = [littoralIntelligence, signalCoast, sharedShore];
