"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { VisualStyle } from "@/lib/direction";
import { useWebsiteFrame } from "./WebsiteContext";
import styles from "./CoastlineExplorer.module.css";

/*
 * An interactive, illustrative coastline: a year slider moves the shoreline
 * between hand-drawn positions for 2000, 2025 and a projection for 2050, and
 * four sites report how far the shore has moved. None of it is real data, and
 * the component says so on screen.
 *
 * Every colour comes from brand tokens. The drawing changes character with the
 * direction's illustration style (fine contours, a data grid, or soft shapes).
 * The site list doubles as the legend and the keyboard route, so the map
 * itself stays out of the tab order.
 */

const WIDTH = 800;
const HEIGHT = 440;
const Y = [0, 55, 110, 165, 220, 275, 330, 385, 440];
const SHORE: Record<2000 | 2025 | 2050, number[]> = {
  2000: [360, 345, 372, 352, 380, 362, 388, 372, 392],
  2025: [348, 318, 356, 318, 372, 332, 380, 360, 386],
  2050: [332, 280, 338, 270, 362, 292, 370, 344, 378],
};
const METRES_PER_UNIT = 2;
const FIRST_YEAR = 2000;
const LAST_YEAR = 2050;
const MEASURED_UNTIL = 2025;

const SITES = [
  { id: "north-spit", name: "North Spit", index: 1 },
  { id: "saltings", name: "The Saltings", index: 3 },
  { id: "harbour-wall", name: "Harbour Wall", index: 4 },
  { id: "cliff-path", name: "Cliff Path", index: 5 },
] as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function shoreAt(year: number): number[] {
  if (year <= MEASURED_UNTIL) {
    const t = (year - FIRST_YEAR) / (MEASURED_UNTIL - FIRST_YEAR);
    return SHORE[2000].map((x, i) => lerp(x, SHORE[2025][i], t));
  }
  const t = (year - MEASURED_UNTIL) / (LAST_YEAR - MEASURED_UNTIL);
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
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const points = (xs: number[], offset = 0): Point[] => xs.map((x, i) => [x + offset, Y[i]] as const);

/** A smooth shoreline, optionally shifted out to sea. */
function smooth(xs: number[], offset = 0): string {
  const pts = points(xs, offset);
  return `M ${pts[0][0]} ${pts[0][1]}${segments(pts)}`;
}

/** The same curve drawn bottom to top, for closing a filled shape back along it. */
const smoothReversed = (xs: number[]) => segments(points(xs).reverse());
const movedBy = (year: number, index: number) => Math.round((SHORE[2000][index] - shoreAt(year)[index]) * METRES_PER_UNIT);

export function CoastlineExplorer({ visual, title }: { visual: VisualStyle; title: string }) {
  const { interactive } = useWebsiteFrame();
  const ids = useId().replace(/:/g, "");
  const [year, setYear] = useState(interactive ? MEASURED_UNTIL : LAST_YEAR);
  const [siteId, setSiteId] = useState<string>("saltings");
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);

  const playFrom = useRef(FIRST_YEAR);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // With reduced motion, skip the sweep and show where it ends.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setYear(LAST_YEAR);
      return;
    }
    playFrom.current = year >= LAST_YEAR ? FIRST_YEAR : year;
    setPlaying(true);
  };

  // Play sweeps through to the last year over about five seconds.
  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const from = playFrom.current;
    const tick = (now: number) => {
      const next = Math.min(LAST_YEAR, from + ((now - start) / 5000) * (LAST_YEAR - FIRST_YEAR));
      setYear(Math.round(next));
      if (next < LAST_YEAR) frame.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [playing]);

  const shore = shoreAt(year);
  const projected = year > MEASURED_UNTIL;
  const site = SITES.find((s) => s.id === siteId) ?? SITES[0];
  const moved = movedBy(year, site.index);
  const rate = year > FIRST_YEAR ? (moved / (year - FIRST_YEAR)).toFixed(1) : "0.0";

  return (
    <figure className={styles.explorer} data-visual={visual}>
      <div className={styles.mapWrap}>
        <svg className={styles.map} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id={`${ids}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" className={styles.gridLine} />
            </pattern>
            <pattern id={`${ids}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" className={styles.hatchLine} />
            </pattern>
            <filter id={`${ids}-grain`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0" />
            </filter>
          </defs>

          <rect width={WIDTH} height={HEIGHT} className={styles.sea} />
          {visual === "grid" ? <rect width={WIDTH} height={HEIGHT} fill={`url(#${ids}-grid)`} /> : null}

          {/* Offshore contours follow the current shoreline. */}
          {[36, 84, 150, 240].map((offset, i) => (
            <path key={offset} d={smooth(shore, offset)} className={styles.contour} style={{ opacity: 0.5 - i * 0.1 }} />
          ))}

          {/* Land lost since 2000, hatched between the old and current shore. */}
          <path d={`${smooth(SHORE[2000])}${smoothReversed(shore)} Z`} fill={`url(#${ids}-hatch)`} className={styles.lost} />

          <path d={`${smooth(shore)} L 0 ${HEIGHT} L 0 0 Z`} className={styles.land} />
          <path d={smooth(SHORE[2000])} className={styles.oldShore} />
          <path d={smooth(shore)} className={styles.shore} />
          <path d={smooth(shore, 10)} className={styles.tide} />

          {SITES.map((s) => {
            const x = shore[s.index];
            const y = Y[s.index];
            const active = s.id === site.id;
            return (
              <g key={s.id} className={styles.site} data-active={active} onClick={() => interactive && setSiteId(s.id)}>
                {active ? <circle cx={x} cy={y} r="18" className={styles.pulse} /> : null}
                <circle cx={x} cy={y} r={active ? 8 : 6} className={styles.dot} />
                <text x={x + 16} y={y + 5} className={styles.siteLabel}>
                  {s.name}
                </text>
              </g>
            );
          })}

          <rect width={WIDTH} height={HEIGHT} filter={`url(#${ids}-grain)`} className={styles.grain} />
        </svg>

        <span className={styles.badge}>{projected ? `Projection · ${year}` : `${year}`}</span>
        <span className={styles.illustrative}>Illustrative data</span>
      </div>

      <div className={styles.panel}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.play}
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play through the years"}
          >
            {playing ? (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
                <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 2.5v11l9-5.5-9-5.5Z" />
              </svg>
            )}
          </button>
          <label className={styles.slider}>
            <span className={styles.sliderLabel}>
              Year <strong>{year}</strong>
              {projected ? <em> (projected)</em> : null}
            </span>
            <input
              type="range"
              min={FIRST_YEAR}
              max={LAST_YEAR}
              step={1}
              value={year}
              onChange={(e) => {
                setPlaying(false);
                setYear(Number(e.target.value));
              }}
              aria-valuetext={`${year}${projected ? ", projected" : ""}`}
            />
            <span className={styles.scale} aria-hidden="true">
              <span>{FIRST_YEAR}</span>
              <span>{MEASURED_UNTIL}</span>
              <span>{LAST_YEAR}</span>
            </span>
          </label>
        </div>

        <div className={styles.readout} aria-live="polite">
          <p className={styles.readoutName}>{site.name}</p>
          <p className={styles.readoutValue}>
            {moved} m
          </p>
          <p className={styles.readoutText}>
            of shoreline lost since 2000{year > FIRST_YEAR ? `, about ${rate} m a year` : ""}.
          </p>
        </div>

        <ul className={styles.sites} aria-label="Sites">
          {SITES.map((s) => (
            <li key={s.id}>
              <button type="button" className={styles.siteButton} aria-pressed={s.id === site.id} onClick={() => setSiteId(s.id)}>
                <span>{s.name}</span>
                <span className={styles.siteValue}>{movedBy(year, s.index)} m</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className="visually-hidden">
        {title}. Illustrative map of a coastline in {year}
        {projected ? " (projected)" : ""}. Shoreline lost since 2000:{" "}
        {SITES.map((s) => `${s.name} ${movedBy(year, s.index)} metres`).join(", ")}.
      </figcaption>
    </figure>
  );
}
