import type { VisualStyle } from "@/lib/direction";
import { SiteStyles, siteClasses } from "@/components/website/site-classes";

const styles = siteClasses("wv");

/*
 * The Ebbfield coastline illustration, drawn three ways. Every colour comes
 * from brand tokens, so the same drawing recolours itself when the palette
 * changes. It is illustrative only and not based on real survey data.
 */

// One shoreline, reused as the edge of the land and as offset contour lines.
const SHORE = "M150,0 C172,40 128,82 158,122 C188,162 148,204 176,260";
const SHORE_LAND = `${SHORE} H0 V0 Z`;
const SHORE_STEPPED = "M150,0 L166,38 L138,78 L160,120 L186,160 L154,204 L176,260";

// The frame can crop the drawing to a portrait slice (roughly x 96 to 304), so
// points and their labels stay inside that band.
const POINTS = [
  { x: 208, y: 70, id: "T-01", label: "-0.8 m/yr" },
  { x: 226, y: 148, id: "T-02", label: "-1.4 m/yr" },
  { x: 214, y: 214, id: "T-03", label: "+0.2 m/yr" },
];

export function CoastlineVisual({ style, className }: { style: VisualStyle; className?: string }) {
  return (
    <>
    <SiteStyles />
    <svg
      className={[styles.visual, className].filter(Boolean).join(" ")}
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustrative diagram of a coastline with measured points of change. Not real data."
    >
      {style === "contours" && <Contours />}
      {style === "grid" && <Grid />}
      {style === "soft" && <Soft />}
    </svg>
    </>
  );
}

function Contours() {
  return (
    <g>
      <path d={SHORE_LAND} className={styles.contoursLand} />
      {[18, 36, 58, 84, 116].map((dx, i) => (
        <path
          key={dx}
          d={SHORE}
          transform={`translate(${dx} 0)`}
          className={styles.contourLine}
          style={{ opacity: Math.round((0.55 - i * 0.09) * 100) / 100 }}
        />
      ))}
      <path d={SHORE} className={styles.tideLine} />
      {POINTS.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r="9" className={styles.pointRing} />
          <circle cx={p.x} cy={p.y} r="3" className={styles.pointDot} />
        </g>
      ))}
    </g>
  );
}

function Grid() {
  return (
    <g>
      <defs>
        <pattern id="coast-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" className={styles.gridLine} />
        </pattern>
      </defs>
      <rect width="400" height="260" fill="url(#coast-grid)" />
      {[0, 22, 44].map((dx, i) => (
        <path
          key={dx}
          d={SHORE_STEPPED}
          transform={`translate(${dx} 0)`}
          className={styles.gridContour}
          style={{ opacity: 1 - i * 0.3 }}
        />
      ))}
      <line x1="0" y1="0" x2="0" y2="260" className={styles.scanLine} />
      {POINTS.map((p) => (
        <g key={p.id}>
          <rect x={p.x - 4} y={p.y - 4} width="8" height="8" className={styles.gridPoint} />
          <text x={p.x + 10} y={p.y - 2} className={styles.gridLabel}>
            <tspan>{p.id}</tspan>
            <tspan x={p.x + 10} dy="11">
              {p.label}
            </tspan>
          </text>
        </g>
      ))}
    </g>
  );
}

function Soft() {
  return (
    <g>
      <circle cx="276" cy="58" r="30" className={styles.sun} />
      <path
        d="M0,0 H172 C204,58 120,108 170,160 C214,206 162,236 192,260 H0 Z"
        className={styles.softLand}
      />
      <path d="M0,0 H120 C150,70 70,120 118,176 C150,214 110,240 130,260 H0 Z" className={styles.softLandInner} />
      {[196, 222, 248].map((y, i) => (
        <path
          key={y}
          d={`M${214 + i * 8},${y} q24,-14 48,0 t48,0 t48,0`}
          className={styles.wave}
        />
      ))}
      {POINTS.slice(0, 2).map((p) => (
        <circle key={p.id} cx={p.x + 6} cy={p.y} r="7" className={styles.softPoint} />
      ))}
    </g>
  );
}
