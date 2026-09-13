import type { BrandTokens } from "@/lib/tokens";

/*
 * The three built-in directions for the Ebbfield demo brand.
 *
 * These are hand-written demo data, not model output, and the interface labels
 * them that way. Phase 4 adds a zod schema that this file and live generation
 * both have to pass, plus the voice, imagery and motion notes.
 *
 * All three render through the same components. Everything that differs
 * between them is in the tokens, plus which illustration style to draw.
 */

export type VisualStyle = "contours" | "grid" | "soft";

export type DemoDirection = {
  id: string;
  letter: "A" | "B" | "C";
  name: string;
  description: string;
  visual: VisualStyle;
  sample: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    nav: [string, string, string];
  };
  tokens: BrandTokens;
};

export const DEMO_BRAND_NAME = "Ebbfield";

export const littoralIntelligence: DemoDirection = {
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

export const signalCoast: DemoDirection = {
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

export const sharedShore: DemoDirection = {
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

export const DEMO_DIRECTIONS = [littoralIntelligence, signalCoast, sharedShore] as const;
