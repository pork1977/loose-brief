/*
 * The illustrative coastline behind the explorer: hand-drawn shoreline
 * positions for 2000 and 2025, a made-up projection for 2050, and four sites.
 * None of it is real data.
 *
 * `coastlineFrame(year)` gives everything the drawing needs for one year. The
 * explorer component draws from it, and the downloaded site ships the frames
 * precomputed, so both show exactly the same shapes and numbers.
 */

export const COAST = { width: 800, height: 440, firstYear: 2000, measuredUntil: 2025, lastYear: 2050 } as const;

const Y = [0, 55, 110, 165, 220, 275, 330, 385, 440];
const SHORE: Record<2000 | 2025 | 2050, number[]> = {
  2000: [360, 345, 372, 352, 380, 362, 388, 372, 392],
  2025: [348, 318, 356, 318, 372, 332, 380, 360, 386],
  2050: [332, 280, 338, 270, 362, 292, 370, 344, 378],
};
const METRES_PER_UNIT = 2;
export const CONTOUR_OFFSETS = [36, 84, 150, 240];

export const COAST_SITES = [
  { id: "north-spit", name: "North Spit", index: 1 },
  { id: "saltings", name: "The Saltings", index: 3 },
  { id: "harbour-wall", name: "Harbour Wall", index: 4 },
  { id: "cliff-path", name: "Cliff Path", index: 5 },
] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const round = (n: number) => Math.round(n * 10) / 10;

function shoreAt(year: number): number[] {
  const { firstYear, measuredUntil, lastYear } = COAST;
  if (year <= measuredUntil) {
    const t = (year - firstYear) / (measuredUntil - firstYear);
    return SHORE[2000].map((x, i) => lerp(x, SHORE[2025][i], t));
  }
  const t = (year - measuredUntil) / (lastYear - measuredUntil);
  return SHORE[2025].map((x, i) => lerp(x, SHORE[2050][i], t));
}

type Point = readonly [number, number];

/** Cubic Bezier segments for a smooth curve through the points (Catmull-Rom). */
function segments(pts: Point[]): string {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)}, ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)}, ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}

const points = (xs: number[], offset = 0): Point[] => xs.map((x, i) => [x + offset, Y[i]] as const);

function smooth(xs: number[], offset = 0): string {
  const pts = points(xs, offset);
  return `M ${round(pts[0][0])} ${pts[0][1]}${segments(pts)}`;
}

export type CoastlineFrame = {
  year: number;
  projected: boolean;
  contours: string[];
  lost: string;
  land: string;
  oldShore: string;
  shore: string;
  tide: string;
  sites: { id: string; name: string; x: number; y: number; moved: number; rate: string }[];
};

export function coastlineFrame(year: number): CoastlineFrame {
  const shore = shoreAt(year);
  return {
    year,
    projected: year > COAST.measuredUntil,
    contours: CONTOUR_OFFSETS.map((offset) => smooth(shore, offset)),
    lost: `${smooth(SHORE[2000])}${segments(points(shore).reverse())} Z`,
    land: `${smooth(shore)} L 0 ${COAST.height} L 0 0 Z`,
    oldShore: smooth(SHORE[2000]),
    shore: smooth(shore),
    tide: smooth(shore, 10),
    sites: COAST_SITES.map((site) => {
      const moved = Math.round((SHORE[2000][site.index] - shore[site.index]) * METRES_PER_UNIT);
      return {
        id: site.id,
        name: site.name,
        x: round(shore[site.index]),
        y: Y[site.index],
        moved,
        rate: year > COAST.firstYear ? (moved / (year - COAST.firstYear)).toFixed(1) : "0.0",
      };
    }),
  };
}
