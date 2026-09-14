import { deriveColorSet } from "@/lib/color-modes";
import type { Direction } from "@/lib/direction";
import type { ColorSet } from "@/lib/tokens";
import { demoWebsite } from "./demo-website";

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

/*
 * Each direction's palette is written by hand for the mode it leads with.
 * The other mode is derived by rule (lib/color-modes.ts) as a starting point.
 */
const littoralColors: ColorSet = {
  brand: { primary: "#083B66", secondary: "#D8B982", accent: "#53D6C7" },
  surface: { page: "#F6F4EE", card: "#FFFFFF", inverse: "#071B2A" },
  text: { primary: "#102A43", secondary: "#52606D", inverse: "#F6F4EE" },
  button: { primary: "#083B66", primaryText: "#FFFFFF" },
  border: { subtle: "#DDD6C8" },
};

const signalColors: ColorSet = {
  brand: { primary: "#0F2A47", secondary: "#22D3EE", accent: "#C6F432" },
  surface: { page: "#07111F", card: "#0C1B2E", inverse: "#030A14" },
  text: { primary: "#E6F1FA", secondary: "#8FA6BC", inverse: "#E6F1FA" },
  button: { primary: "#22D3EE", primaryText: "#03121C" },
  border: { subtle: "#1C3350" },
};

const sharedColors: ColorSet = {
  brand: { primary: "#1F6B63", secondary: "#8FD3C1", accent: "#E0694A" },
  surface: { page: "#FBF6EE", card: "#FFFFFF", inverse: "#1E4D4A" },
  text: { primary: "#243B3A", secondary: "#5B6B69", inverse: "#FBF6EE" },
  button: { primary: "#1F6B63", primaryText: "#FFFFFF" },
  border: { subtle: "#EADFCF" },
};

export const littoralIntelligence: Direction = {
  id: "littoral-intelligence",
  letter: "A",
  name: "Littoral Intelligence",
  description: "Quiet, editorial and scientifically credible.",
  visual: "contours",
  strategy: {
    positioning:
      "For local authorities and coastal researchers who need evidence they can act on, Ebbfield is the coastal intelligence platform that turns shoreline data into clear, defensible decisions.",
    promise: "Evidence you can plan around.",
  },
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
    illustration: "Fine-line diagrams in the style of survey sheets: contours, transects and small set labels.",
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
  illustration: null,
  website: demoWebsite({
    problemTitle: "Coastal decisions are made with evidence that arrives too late.",
    problemBody: "Shorelines change every season, but the evidence behind adaptation plans is often years old, scattered and hard to compare. Good decisions need a clearer, shared picture.",
    howTitle: "From scattered records to a plan that holds up.",
    dataTitle: "Watch a shoreline change over fifty years.",
    featuresTitle: "Everything a coastal team needs to plan with confidence.",
    impactTitle: "Better evidence, earlier.",
    ctaTitle: "See your coastline in Ebbfield.",
    ctaBody: "A 30-minute demonstration using your own stretch of coast, for councils and research teams.",
  }),
  tokens: {
    mode: "light",
    color: littoralColors,
    colorDark: deriveColorSet(littoralColors, "dark"),
    typography: {
      display: { family: "instrument-serif", weight: 400, lineHeight: 0.95, letterSpacing: "-0.01em" },
      body: { family: "inter", weight: 400, lineHeight: 1.6 },
      label: { family: "ibm-plex-mono", weight: 500, letterSpacing: "0.08em", transform: "uppercase" },
    },
    space: { base: "1rem", ratio: 1.6 },
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
  strategy: {
    positioning:
      "For researchers and planners who work from data, Ebbfield is the live coastal monitoring platform that measures shoreline change every tide, in one model.",
    promise: "Every change measured, as it happens.",
  },
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
    illustration: "Schematic grids and stepped contours with labelled measurement points, like instrument output.",
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
  illustration: null,
  website: demoWebsite({
    problemTitle: "Annual surveys can't keep up with a coast that moves every tide.",
    problemBody: "Erosion accelerates between reviews. Data lives in six systems and three formats. By the time the report is signed off, the numbers have already moved.",
    howTitle: "Ingest. Model. Act.",
    dataTitle: "2000 to 2050, one slider.",
    featuresTitle: "Measurement, forecasting and alerts in one platform.",
    impactTitle: "Measured results from the pilot.",
    ctaTitle: "Book a demo with your own data.",
    ctaBody: "We load a sample of your coastline and walk your team through the model in 30 minutes.",
  }),
  tokens: {
    mode: "dark",
    color: deriveColorSet(signalColors, "light"),
    colorDark: signalColors,
    typography: {
      display: { family: "space-grotesk", weight: 600, lineHeight: 1, letterSpacing: "-0.03em" },
      body: { family: "ibm-plex-sans", weight: 400, lineHeight: 1.55 },
      label: { family: "jetbrains-mono", weight: 500, letterSpacing: "0.04em", transform: "uppercase" },
    },
    space: { base: "0.875rem", ratio: 1.4 },
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
  strategy: {
    positioning:
      "For coastal communities and the councils that serve them, Ebbfield makes shoreline change easy to understand and shows practical next steps people can agree on.",
    promise: "A clearer shared picture of your coast.",
  },
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
    illustration: "Simple rounded shapes of land, water and sun, with soft edges and friendly proportions.",
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
  illustration: null,
  website: demoWebsite({
    problemTitle: "Everyone can see the coast changing. Few people know what to do about it.",
    problemBody: "Residents, councils and researchers often look at different information and talk past each other. Ebbfield gives everyone the same clear picture, so plans get agreed sooner.",
    howTitle: "Three steps to a plan people can agree on.",
    dataTitle: "See how your shore has changed.",
    featuresTitle: "Made for the people who look after the coast.",
    impactTitle: "What changed for one coastal community.",
    ctaTitle: "Let's talk about your coast.",
    ctaBody: "Tell us a little about where you are and we'll show you what Ebbfield could do there.",
  }),
  tokens: {
    mode: "light",
    color: sharedColors,
    colorDark: deriveColorSet(sharedColors, "dark"),
    typography: {
      display: { family: "nunito", weight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" },
      body: { family: "nunito-sans", weight: 400, lineHeight: 1.6 },
      label: { family: "nunito-sans", weight: 700, letterSpacing: "0.01em", transform: "none" },
    },
    space: { base: "1rem", ratio: 1.5 },
    radius: { small: "10px", medium: "18px", large: "28px", button: "pill", card: "large" },
    shadow: { card: "0 18px 40px -24px rgba(31, 107, 99, 0.35)" },
    motion: { fast: "180ms", normal: "380ms", slow: "700ms", easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  },
};

export const DEMO_DIRECTIONS: Direction[] = [littoralIntelligence, signalCoast, sharedShore];
