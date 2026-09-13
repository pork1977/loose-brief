/*
 * Colour extraction for uploaded materials. Runs in the browser on the pixels
 * of a downscaled copy of the image, so nothing leaves the visitor's machine
 * and the result is the same every time for the same file.
 *
 * Method: convert pixels to OKLab (a colour space where distance roughly
 * matches how different colours look), group them with k-means from a seeded
 * start, merge groups that look alike, then describe the result in plain terms
 * (light or dark, muted or vivid, warm or cool).
 */

export type Swatch = {
  hex: string;
  /** Fraction of the counted pixels, 0 to 1. */
  share: number;
  /** OKLCH lightness 0-1, chroma, hue in degrees. */
  l: number;
  c: number;
  h: number;
};

export type PaletteTraits = {
  lightness: "light" | "mid" | "dark";
  saturation: "muted" | "balanced" | "vivid";
  temperature: "warm" | "cool" | "neutral";
};

type Lab = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function rgbToOklab(r: number, g: number, b: number): Lab {
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((v) => Math.round(Math.max(0, Math.min(1, toGamma(v))) * 255)) as [number, number, number];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function distance(p: Lab, q: Lab) {
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** Small seeded generator so the same image always gives the same palette. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toSwatch(lab: Lab, share: number): Swatch {
  const [r, g, b] = oklabToRgb(lab);
  const c = Math.hypot(lab[1], lab[2]);
  const h = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  return { hex: rgbToHex(r, g, b), share, l: lab[0], c, h: (h + 360) % 360 };
}

type ExtractOptions = { maxColours?: number; iterations?: number };

/**
 * Extract a palette from RGBA pixel data (as returned by canvas getImageData).
 * Mostly transparent pixels are ignored, so a logo on a transparent background
 * reports the logo's colours rather than a wash of black.
 */
export function extractPalette(pixels: Uint8ClampedArray, { maxColours = 6, iterations = 12 }: ExtractOptions = {}): Swatch[] {
  const points: Lab[] = [];
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    points.push(rgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]));
  }
  if (points.length === 0) return [];

  const k = Math.min(maxColours + 2, points.length);
  const random = mulberry32(1);

  // k-means++ start: each new centre is picked with probability proportional
  // to its squared distance from the nearest existing one.
  const centres: Lab[] = [points[Math.floor(random() * points.length)]];
  const nearest = new Float64Array(points.length).fill(Infinity);
  while (centres.length < k) {
    const last = centres[centres.length - 1];
    let total = 0;
    for (let i = 0; i < points.length; i++) {
      nearest[i] = Math.min(nearest[i], distance(points[i], last) ** 2);
      total += nearest[i];
    }
    if (total === 0) break;
    let target = random() * total;
    let chosen = points.length - 1;
    for (let i = 0; i < points.length; i++) {
      target -= nearest[i];
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centres.push(points[chosen]);
  }

  const assignment = new Int32Array(points.length);
  for (let iter = 0; iter < iterations; iter++) {
    const sums = centres.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let j = 0; j < centres.length; j++) {
        const d = distance(points[i], centres[j]);
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      }
      assignment[i] = best;
      const s = sums[best];
      s[0] += points[i][0];
      s[1] += points[i][1];
      s[2] += points[i][2];
      s[3] += 1;
    }
    for (let j = 0; j < centres.length; j++) {
      const s = sums[j];
      if (s[3] > 0) centres[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    }
  }

  let clusters = centres.map((centre, j) => ({ centre, count: 0, index: j }));
  for (let i = 0; i < points.length; i++) clusters[assignment[i]].count++;
  clusters = clusters.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Merge clusters that are visually near-identical into the larger one.
  const merged: { centre: Lab; count: number }[] = [];
  for (const cluster of clusters) {
    const twin = merged.find((m) => distance(m.centre, cluster.centre) < 0.045);
    if (twin) {
      const total = twin.count + cluster.count;
      twin.centre = twin.centre.map((v, i) => (v * twin.count + cluster.centre[i] * cluster.count) / total) as Lab;
      twin.count = total;
    } else {
      merged.push({ centre: cluster.centre, count: cluster.count });
    }
  }

  return merged
    .map((m) => toSwatch(m.centre, m.count / points.length))
    .filter((s) => s.share >= 0.02)
    .sort((a, b) => b.share - a.share)
    .slice(0, maxColours);
}

/** Equal-share swatches from a list of hex colours, e.g. an SVG's exact colours. */
export function swatchesFromHexes(hexes: string[]): Swatch[] {
  const valid = hexes.map(hexToRgb).filter((rgb): rgb is [number, number, number] => rgb !== null);
  return valid.map((rgb) => toSwatch(rgbToOklab(...rgb), 1 / valid.length));
}

/** Describe a palette in the plain terms the brief summary shows. */
export function describePalette(swatches: Swatch[]): PaletteTraits {
  const total = swatches.reduce((sum, s) => sum + s.share, 0) || 1;
  const lightness = swatches.reduce((sum, s) => sum + s.l * s.share, 0) / total;
  const chroma = swatches.reduce((sum, s) => sum + s.c * s.share, 0) / total;

  let warm = 0;
  let cool = 0;
  for (const s of swatches) {
    const weight = s.share * s.c;
    if (s.h <= 115 || s.h >= 330) warm += weight;
    else if (s.h >= 150 && s.h <= 300) cool += weight;
  }

  return {
    lightness: lightness > 0.72 ? "light" : lightness < 0.42 ? "dark" : "mid",
    saturation: chroma < 0.04 ? "muted" : chroma > 0.12 ? "vivid" : "balanced",
    temperature: warm + cool < 0.01 ? "neutral" : warm > cool * 1.25 ? "warm" : cool > warm * 1.25 ? "cool" : "neutral",
  };
}

/**
 * Pull the exact colours written into an SVG (fills, strokes, gradient stops).
 * For a vector logo these are the brand's real colours, which beats sampling
 * anti-aliased pixels. Returned most-used first.
 */
export function parseSvgColours(svg: string): string[] {
  const counts = new Map<string, number>();
  const add = (hex: string) => counts.set(hex, (counts.get(hex) ?? 0) + 1);

  for (const match of svg.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const rgb = hexToRgb(match[0]);
    if (rgb) add(rgbToHex(...rgb));
  }
  for (const match of svg.matchAll(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi)) {
    const [r, g, b] = [match[1], match[2], match[3]].map((v) => Math.min(255, Number(v)));
    add(rgbToHex(r, g, b));
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
}
