"use client";

import { useEffect, useId, useRef, useState } from "react";
import { COAST, CONTOUR_OFFSETS, coastlineFrame } from "@/lib/coastline";
import type { VisualStyle } from "@/lib/direction";
import { useWebsiteFrame } from "./WebsiteContext";
import { siteClasses } from "./site-classes";

const styles = siteClasses("wx");

/*
 * An interactive, illustrative coastline: a year slider moves the shoreline
 * between hand-drawn positions for 2000, 2025 and a projection for 2050, and
 * four sites report how far the shore has moved. None of it is real data, and
 * the component says so on screen. The shapes come from lib/coastline.ts.
 *
 * Every colour comes from brand tokens. The drawing changes character with the
 * direction's illustration style (fine contours, a data grid, or soft shapes).
 * The site list doubles as the legend and the keyboard route, so the map
 * itself stays out of the tab order.
 *
 * data-wx attributes are hooks for the downloaded site's script, which does
 * the same job without React.
 */
export function CoastlineExplorer({ visual, title }: { visual: VisualStyle; title: string }) {
  const { interactive } = useWebsiteFrame();
  const ids = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [year, setYear] = useState<number>(interactive ? COAST.measuredUntil : COAST.lastYear);
  const [siteId, setSiteId] = useState<string>("saltings");
  const [playing, setPlaying] = useState(false);
  const frame = useRef<number | null>(null);
  const playFrom = useRef<number>(COAST.firstYear);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    // With reduced motion, skip the sweep and show where it ends.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setYear(COAST.lastYear);
      return;
    }
    playFrom.current = year >= COAST.lastYear ? COAST.firstYear : year;
    setPlaying(true);
  };

  // Play sweeps through to the last year over about five seconds.
  useEffect(() => {
    if (!playing) return;
    const start = performance.now();
    const from = playFrom.current;
    const tick = (now: number) => {
      const next = Math.min(COAST.lastYear, from + ((now - start) / 5000) * (COAST.lastYear - COAST.firstYear));
      setYear(Math.round(next));
      if (next < COAST.lastYear) frame.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [playing]);

  const f = coastlineFrame(year);
  const site = f.sites.find((s) => s.id === siteId) ?? f.sites[0];

  return (
    <figure className={styles.explorer} data-visual={visual} data-wx="explorer">
      <div className={styles.mapWrap}>
        <svg className={styles.map} viewBox={`0 0 ${COAST.width} ${COAST.height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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

          <rect width={COAST.width} height={COAST.height} className={styles.sea} />
          {visual === "grid" ? <rect width={COAST.width} height={COAST.height} fill={`url(#${ids}-grid)`} /> : null}

          {/* Offshore contours follow the current shoreline. */}
          {CONTOUR_OFFSETS.map((offset, i) => (
            <path key={offset} d={f.contours[i]} className={styles.contour} style={{ opacity: Math.round((0.5 - i * 0.1) * 100) / 100 }} data-wx={`contour-${i}`} />
          ))}

          {/* Land lost since 2000, hatched between the old and current shore. */}
          <path d={f.lost} fill={`url(#${ids}-hatch)`} className={styles.lost} data-wx="lost" />
          <path d={f.land} className={styles.land} data-wx="land" />
          <path d={f.oldShore} className={styles.oldShore} />
          <path d={f.shore} className={styles.shore} data-wx="shore" />
          <path d={f.tide} className={styles.tide} data-wx="tide" />

          {f.sites.map((s) => {
            const active = s.id === site.id;
            return (
              <g key={s.id} className={styles.site} data-active={active} data-wx-site={s.id} onClick={() => interactive && setSiteId(s.id)}>
                <circle cx={s.x} cy={s.y} r="18" className={styles.pulse} />
                <circle cx={s.x} cy={s.y} r={active ? 8 : 6} className={styles.dot} />
                <text x={s.x + 16} y={s.y + 5} className={styles.siteLabel}>
                  {s.name}
                </text>
              </g>
            );
          })}

          <rect width={COAST.width} height={COAST.height} filter={`url(#${ids}-grain)`} className={styles.grain} />
        </svg>

        <span className={styles.badge} data-wx="badge">
          {f.projected ? `Projection · ${year}` : `${year}`}
        </span>
        <span className={styles.illustrative}>Illustrative data</span>
      </div>

      <div className={styles.panel}>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.play}
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play through the years"}
            data-wx="play"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" data-wx="play-icon">
              {playing ? (
                <>
                  <rect x="3" y="2.5" width="3.5" height="11" rx="1" />
                  <rect x="9.5" y="2.5" width="3.5" height="11" rx="1" />
                </>
              ) : (
                <path d="M4 2.5v11l9-5.5-9-5.5Z" />
              )}
            </svg>
          </button>
          <label className={styles.slider}>
            <span className={styles.sliderLabel}>
              Year <strong data-wx="year">{year}</strong>
              <em data-wx="projected" hidden={!f.projected}>
                {" "}
                (projected)
              </em>
            </span>
            <input
              type="range"
              min={COAST.firstYear}
              max={COAST.lastYear}
              step={1}
              value={year}
              data-wx="slider"
              onChange={(e) => {
                setPlaying(false);
                setYear(Number(e.target.value));
              }}
              aria-valuetext={`${year}${f.projected ? ", projected" : ""}`}
            />
            <span className={styles.scale} aria-hidden="true">
              <span>{COAST.firstYear}</span>
              <span>{COAST.measuredUntil}</span>
              <span>{COAST.lastYear}</span>
            </span>
          </label>
        </div>

        <div className={styles.readout} aria-live="polite">
          <p className={styles.readoutName} data-wx="readout-name">
            {site.name}
          </p>
          <p className={styles.readoutValue}>
            <span data-wx="readout-value">{site.moved}</span> m
          </p>
          <p className={styles.readoutText} data-wx="readout-text">
            of shoreline lost since 2000{year > COAST.firstYear ? `, about ${site.rate} m a year` : ""}.
          </p>
        </div>

        <ul className={styles.sites} aria-label="Sites">
          {f.sites.map((s) => (
            <li key={s.id}>
              <button type="button" className={styles.siteButton} aria-pressed={s.id === site.id} onClick={() => setSiteId(s.id)} data-wx-site-button={s.id}>
                <span>{s.name}</span>
                <span className={styles.siteValue} data-wx-site-value={s.id}>
                  {s.moved} m
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <figcaption className="visually-hidden" data-wx="caption">
        {title}. Illustrative map of a coastline in {year}
        {f.projected ? " (projected)" : ""}. Shoreline lost since 2000: {f.sites.map((s) => `${s.name} ${s.moved} metres`).join(", ")}.
      </figcaption>
    </figure>
  );
}

