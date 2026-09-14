import { SiteStyles, siteClasses } from "@/components/website/site-classes";
import type { Illustration, VisualStyle } from "@/lib/direction";
import { motif, type MotifId } from "@/lib/motifs";

const styles = siteClasses("wv");

/*
 * A brand's hero illustration, built from motif-library shapes. The same
 * shapes and arrangement are drawn in any of the three styles, and every
 * colour comes from the brand tokens through the stylesheet.
 *
 * The drawing is 400 by 260 and gets cropped to a portrait slice in narrow
 * frames (roughly x 110 to 290), so the important shapes sit in that band.
 */

type Placement = { id: MotifId; x: number; y: number; size: number; rotate: number };

/** A small, repeatable random sequence, so a pattern looks the same every time it's drawn. */
function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const ROUTE = "M112 206C156 206 156 130 200 130C244 130 244 54 288 54";
const round = (n: number) => Math.round(n * 10) / 10;

function place({ motifs, layout }: Illustration): Placement[] {
  const at = (i: number) => motifs[i % motifs.length];
  switch (layout) {
    case "hero":
      return [
        { id: motifs[0], x: 200, y: 128, size: 124, rotate: 0 },
        ...(motifs[1] ? [{ id: motifs[1], x: 124, y: 58, size: 42, rotate: -8 }] : []),
        ...(motifs[2] ? [{ id: motifs[2], x: 280, y: 198, size: 42, rotate: 8 }] : []),
      ];
    case "row":
      return [128, 200, 272].map((x, i) => ({ id: at(i), x, y: 130, size: 62, rotate: 0 }));
    case "journey":
      return [
        { id: at(0), x: 112, y: 206, size: 52, rotate: 0 },
        { id: at(1), x: 200, y: 130, size: 52, rotate: 0 },
        { id: at(2), x: 288, y: 54, size: 52, rotate: 0 },
      ];
    case "scatter": {
      const random = seeded(motifs.join("|"));
      const out: Placement[] = [];
      let n = 0;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          const x = 26 + col * 62 + (row % 2 ? 31 : 0) + (random() - 0.5) * 14;
          const y = 26 + row * 54 + (random() - 0.5) * 12;
          out.push({ id: at(n++), x: round(x), y: round(y), size: round(28 + random() * 14), rotate: round((random() - 0.5) * 36) });
        }
      }
      return out;
    }
  }
}

/** Line weight in drawing units, the same whatever size a shape is drawn at, so it thins out with the drawing in small previews. */
const WEIGHT = { line: 2, schematic: 1.5, soft: 3.2 };

function Motif({ p, className, weight }: { p: Placement; className: string; weight: number }) {
  const scale = round((p.size / 48) * 100) / 100;
  return (
    <g
      transform={`translate(${round(p.x - p.size / 2)} ${round(p.y - p.size / 2)}) rotate(${p.rotate} ${round(p.size / 2)} ${round(p.size / 2)}) scale(${scale})`}
      strokeWidth={round(weight / scale)}
    >
      {motif(p.id).paths.map((d, i) => (
        <path key={i} d={d} className={className} />
      ))}
    </g>
  );
}

export function MotifVisual({ style, illustration, className }: { style: VisualStyle; illustration: Illustration; className?: string }) {
  const placements = place(illustration);
  const { layout } = illustration;
  const focus = placements[0];

  return (
    <>
      <SiteStyles />
      <svg className={[styles.visual, className].filter(Boolean).join(" ")} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {style === "contours" ? (
          <g>
            {layout !== "scatter"
              ? [70, 96, 122, 148, 174].map((r, i) => (
                  <circle key={r} cx={layout === "hero" ? focus.x : 200} cy={layout === "hero" ? focus.y : 130} r={r} className={styles.mRing} style={{ opacity: round(0.5 - i * 0.09) }} />
                ))
              : null}
            {layout === "journey" ? <path d={ROUTE} className={styles.mRouteDashed} /> : null}
            {placements.map((p, i) => (
              <Motif key={i} p={p} className={styles.mLine} weight={WEIGHT.line} />
            ))}
            {layout !== "scatter"
              ? [
                  [150, 216],
                  [262, 84],
                  [306, 150],
                ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" className={styles.mDot} />)
              : null}
          </g>
        ) : null}

        {style === "grid" ? (
          <g>
            <defs>
              <pattern id="motif-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" className={styles.gridLine} />
              </pattern>
            </defs>
            <rect width="400" height="260" fill="url(#motif-grid)" />
            {layout === "journey" ? <path d={ROUTE} className={styles.mRoute} /> : null}
            {placements.map((p, i) => (
              <g key={i}>
                {layout !== "scatter" ? <rect x={round(p.x - p.size / 2 - 7)} y={round(p.y - p.size / 2 - 7)} width="6" height="6" className={styles.gridPoint} /> : null}
                <Motif p={p} className={styles.mSchematic} weight={WEIGHT.schematic} />
              </g>
            ))}
            <line x1="0" y1="0" x2="0" y2="260" className={styles.scanLine} />
          </g>
        ) : null}

        {style === "soft" ? (
          <g>
            <circle cx="306" cy="52" r="26" className={styles.sun} />
            {layout === "journey" ? <path d={ROUTE} className={styles.mRouteSoft} /> : null}
            {placements.map((p, i) => (
              <g key={i} className={layout === "scatter" ? undefined : styles.mFloat} style={layout === "scatter" ? undefined : { animationDelay: `${i * -1.3}s` }}>
                {layout !== "scatter" ? <circle cx={p.x} cy={p.y} r={round(p.size * 0.62)} className={styles.mBlob} /> : null}
                <Motif p={p} className={styles.mSoft} weight={WEIGHT.soft} />
              </g>
            ))}
          </g>
        ) : null}
      </svg>
    </>
  );
}
