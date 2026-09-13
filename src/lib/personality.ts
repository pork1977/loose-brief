/*
 * Personality traits a brief can pick from, each placed on three axes.
 *
 * The placements are fixed rules written by hand, not model output. They give
 * the brief summary a rough early reading of where the brand is heading, and
 * the interface says so. Custom traits are allowed but aren't placed.
 */

export type AxisId = "energy" | "character" | "mood";

export const AXES: { id: AxisId; low: string; high: string }[] = [
  { id: "energy", low: "Calm", high: "Energetic" },
  { id: "character", low: "Technical", high: "Human" },
  { id: "mood", low: "Serious", high: "Playful" },
];

type Weights = Partial<Record<AxisId, number>>;

export const TRAITS: Record<string, Weights> = {
  Scientific: { character: -1, mood: -0.8 },
  Hopeful: { energy: 0.3, character: 0.4, mood: 0.2 },
  Clear: { energy: -0.3, character: -0.3 },
  Grounded: { energy: -0.6, character: 0.3, mood: -0.3 },
  Intelligent: { character: -0.6, mood: -0.5 },
  Calm: { energy: -1 },
  Bold: { energy: 1 },
  Playful: { mood: 1, energy: 0.5 },
  Warm: { character: 1, mood: 0.2 },
  Premium: { energy: -0.4, mood: -0.6 },
  Technical: { character: -1, mood: -0.3 },
  Friendly: { character: 0.8, mood: 0.4 },
  Trustworthy: { energy: -0.3, mood: -0.6 },
  Innovative: { energy: 0.5, character: -0.3 },
  Honest: { character: 0.4, mood: -0.3 },
  Optimistic: { energy: 0.5, mood: 0.3 },
  Precise: { character: -0.8, mood: -0.4 },
  Approachable: { character: 0.8, mood: 0.2 },
  Confident: { energy: 0.6, mood: -0.2 },
  Rebellious: { energy: 1, mood: 0.5 },
  Thoughtful: { energy: -0.5, character: 0.4 },
  Minimal: { energy: -0.6, character: -0.3 },
  "Community-minded": { character: 1, mood: 0.2 },
  Expert: { character: -0.5, mood: -0.6 },
};

export const TRAIT_NAMES = Object.keys(TRAITS);

export type AxisReading = {
  id: AxisId;
  low: string;
  high: string;
  /** -1 (fully low) to 1 (fully high). 0 when nothing picked touches this axis. */
  value: number;
};

export type PersonalityReading = {
  axes: AxisReading[];
  placed: number;
  custom: number;
};

export function readPersonality(traits: string[]): PersonalityReading {
  const placed = traits.filter((t) => t in TRAITS);
  const axes = AXES.map((axis) => {
    const values = placed.map((t) => TRAITS[t][axis.id]).filter((v): v is number => v !== undefined);
    const value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { ...axis, value: Math.max(-1, Math.min(1, value)) };
  });
  return { axes, placed: placed.length, custom: traits.length - placed.length };
}

/** Plain words for a reading, used as the accessible description of each bar. */
export function describeAxis(axis: AxisReading): string {
  const strength = Math.abs(axis.value);
  if (strength < 0.15) return `Balanced between ${axis.low.toLowerCase()} and ${axis.high.toLowerCase()}`;
  const side = axis.value < 0 ? axis.low : axis.high;
  return `${strength > 0.6 ? "Strongly" : "Leans"} ${side.toLowerCase()}`;
}
