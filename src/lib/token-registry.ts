import { SPACE_STEPS } from "./tokens";

/*
 * Plain descriptions of every compiled token: what it's for and which parts
 * of the website use it. The token inspector reads this. The preview marks
 * elements with data-tokens, so the inspector can also point at them.
 */

export type TokenGroup = "Colour" | "Type" | "Spacing" | "Shape" | "Motion";

export type TokenInfo = {
  group: TokenGroup;
  label: string;
  description: string;
  usedBy: string[];
  /** The editable token path behind it (colours are relative to the active colour set). */
  source: string;
};

const colour = (label: string, source: string, description: string, usedBy: string[]): TokenInfo => ({
  group: "Colour",
  label,
  source,
  description,
  usedBy,
});

export const TOKEN_INFO: Record<string, TokenInfo> = {
  "--color-brand-primary": colour("Brand primary", "color.brand.primary", "The main brand colour.", ["Illustration lines", "Feature icons", "Motion markers"]),
  "--color-brand-secondary": colour("Brand secondary", "color.brand.secondary", "Supporting colour for fills and dividers.", ["Illustration fills", "Figure dividers", "Quote rules"]),
  "--color-brand-accent": colour("Accent", "color.brand.accent", "Small, bright highlights. Kept for icons and data, not text.", ["Tide lines and data points", "Feature icon backgrounds"]),
  "--color-background": colour("Page", "color.surface.page", "The page background.", ["Page background", "Call to action section"]),
  "--color-surface": colour("Card", "color.surface.card", "Raised surfaces sitting on the page.", ["Feature cards", "Illustration frame"]),
  "--color-surface-inverse": colour("Inverse surface", "color.surface.inverse", "High-contrast sections that break up the page.", ["Impact band"]),
  "--color-text-primary": colour("Text", "color.text.primary", "Headlines and main text.", ["Logo", "Headlines", "Card titles"]),
  "--color-text-secondary": colour("Secondary text", "color.text.secondary", "Supporting text and labels.", ["Body copy", "Navigation links", "Labels", "Footer"]),
  "--color-text-inverse": colour("Inverse text", "color.text.inverse", "Text on inverse sections.", ["Impact figures and labels"]),
  "--color-button-primary": colour("Button", "color.button.primary", "The main call to action colour.", ["Primary buttons", "Navigation call to action"]),
  "--color-button-primary-text": colour("Button label", "color.button.primaryText", "Text on primary buttons.", ["Primary button labels"]),
  "--color-border": colour("Border", "color.border.subtle", "Hairlines and outlines.", ["Section dividers", "Card outlines", "Secondary buttons"]),

  "--font-display": { group: "Type", label: "Display face", source: "typography.display.family", description: "Headlines, the logo and big figures.", usedBy: ["Logo", "Headlines", "Card titles", "Figures"] },
  "--font-display-weight": { group: "Type", label: "Display weight", source: "typography.display.weight", description: "How heavy headlines are.", usedBy: ["Headlines"] },
  "--font-display-leading": { group: "Type", label: "Display line height", source: "typography.display.lineHeight", description: "Space between lines of a headline.", usedBy: ["Headlines", "Call to action title"] },
  "--font-display-tracking": { group: "Type", label: "Display letter spacing", source: "typography.display.letterSpacing", description: "Space between letters in headlines.", usedBy: ["Headlines"] },
  "--font-body": { group: "Type", label: "Body face", source: "typography.body.family", description: "Paragraphs and interface text.", usedBy: ["Body copy", "Card text", "Navigation"] },
  "--font-body-weight": { group: "Type", label: "Body weight", source: "typography.body.weight", description: "How heavy running text is.", usedBy: ["Body copy"] },
  "--font-body-leading": { group: "Type", label: "Body line height", source: "typography.body.lineHeight", description: "Space between lines of running text.", usedBy: ["Body copy", "Card text"] },
  "--font-label": { group: "Type", label: "Label face", source: "typography.label.family", description: "Small labels, eyebrows and data.", usedBy: ["Eyebrows", "Section labels", "Illustration captions"] },
  "--font-label-weight": { group: "Type", label: "Label weight", source: "typography.label.weight", description: "How heavy labels are.", usedBy: ["Labels"] },
  "--font-label-tracking": { group: "Type", label: "Label letter spacing", source: "typography.label.letterSpacing", description: "Space between letters in labels.", usedBy: ["Labels"] },
  "--font-label-transform": { group: "Type", label: "Label case", source: "typography.label.transform", description: "Whether labels are set in capitals.", usedBy: ["Labels"] },

  ...Object.fromEntries(
    SPACE_STEPS.map((step) => [
      `--space-${step}`,
      {
        group: "Spacing" as const,
        label: `Space ${step}`,
        source: "space",
        description: step === "s" ? "The base step. Every other space is this, multiplied or divided by the ratio." : "A step on the spacing scale.",
        usedBy: { "3xs": ["Fine adjustments"], "2xs": ["Tight gaps"], xs: ["Gaps inside cards", "Navigation padding"], s: ["Card grids", "Button groups"], m: ["Card padding", "Hero gaps"], l: ["Section padding"], xl: ["Section spacing"], "2xl": ["Call to action spacing"], "3xl": ["Large breaks"] }[step],
      },
    ]),
  ),

  "--radius-small": { group: "Shape", label: "Small radius", source: "radius.small", description: "Corners on small elements.", usedBy: ["Icons", "Captions"] },
  "--radius-medium": { group: "Shape", label: "Medium radius", source: "radius.medium", description: "A middle step, used when a component picks it.", usedBy: ["Components set to medium"] },
  "--radius-large": { group: "Shape", label: "Large radius", source: "radius.large", description: "The largest rounded step.", usedBy: ["Components set to large"] },
  "--radius-button": { group: "Shape", label: "Button corners", source: "radius.button", description: "Which step on the radius scale buttons use.", usedBy: ["Primary buttons", "Secondary buttons", "Navigation call to action"] },
  "--radius-card": { group: "Shape", label: "Card corners", source: "radius.card", description: "Which step on the radius scale cards use.", usedBy: ["Feature cards", "Illustration frame"] },
  "--shadow-card": { group: "Shape", label: "Card shadow", source: "shadow.card", description: "The shadow under raised cards.", usedBy: ["Feature cards", "Illustration frame"] },

  "--motion-fast": { group: "Motion", label: "Fast", source: "motion.fast", description: "Hover and small state changes.", usedBy: ["Hover states"] },
  "--motion-normal": { group: "Motion", label: "Normal", source: "motion.normal", description: "Things appearing and moving into place.", usedBy: ["Headline entrance"] },
  "--motion-slow": { group: "Motion", label: "Slow", source: "motion.slow", description: "Large, ambient movement.", usedBy: ["Illustration movement", "Palette changes"] },
  "--motion-easing": { group: "Motion", label: "Easing", source: "motion.easing", description: "The feel of every movement: gentle, snappy or springy.", usedBy: ["All motion"] },
};

export const TOKEN_GROUPS: TokenGroup[] = ["Colour", "Type", "Spacing", "Shape", "Motion"];
