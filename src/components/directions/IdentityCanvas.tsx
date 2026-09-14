"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { isDemoDirection } from "@/data/demo-ids";
import { CoastlineVisual } from "@/components/brand/CoastlineVisual";
import { MotionPreview } from "@/components/brand/MotionPreview";
import { brandFont } from "@/lib/brand-fonts";
import { AREA_LABELS, DESIGN_AREAS, type DesignArea, type Direction } from "@/lib/direction";
import { colorsFor } from "@/lib/tokens";
import styles from "./IdentityCanvas.module.css";

export type CanvasMode = "constellation" | "system";

type Props = {
  brandName: string;
  traits: string[];
  direction: Direction;
  mode: CanvasMode;
};

type Line = { key: string; d: string; area: DesignArea };

/*
 * The identity canvas. On the left, the personality traits from the brief; in
 * the middle, the brand; on the right, the six areas of the design system,
 * each showing what the active direction chose. Curves connect each trait to
 * the decisions it shaped, taken from the direction's own reasoning.
 *
 * In "system" mode (after a direction is selected) the same nodes regroup
 * into an ordered grid. Each node has a view transition name, so the browser
 * animates them from one layout to the other when the mode changes inside a
 * transition.
 *
 * The whole canvas sits in the active direction's BrandScope, so it takes on
 * that brand's colours and type.
 */
export function IdentityCanvas({ brandName, traits, direction, mode }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  // Hovering an area traces its lines; clicking pins it so it also works by keyboard and touch.
  const [hoverArea, setHoverArea] = useState<DesignArea | null>(null);
  const [pinnedArea, setPinnedArea] = useState<DesignArea | null>(null);
  // Tracing only means something while the lines are showing.
  const focusArea = mode === "constellation" ? (hoverArea ?? pinnedArea) : null;

  const decisionsByArea = new Map(direction.decisions.map((d) => [d.area, d]));
  const linkedTraits = new Set(
    direction.decisions.flatMap((d) => d.sources.filter((s) => s.kind === "trait").map((s) => s.value)),
  );

  // Draw the connecting curves from where the nodes actually are on screen.
  useEffect(() => {
    const board = boardRef.current;
    if (!board || mode !== "constellation") return;

    const measure = () => {
      const box = board.getBoundingClientRect();
      if (box.width === 0) return;
      const anchor = (selector: string, side: "left" | "right") => {
        const el = board.querySelector<HTMLElement>(selector);
        if (!el || el.offsetParent === null) return null;
        const r = el.getBoundingClientRect();
        return { x: (side === "right" ? r.right : r.left) - box.left, y: r.top + r.height / 2 - box.top };
      };
      const next: Line[] = [];
      for (const decision of direction.decisions) {
        const end = anchor(`[data-area="${decision.area}"]`, "left");
        if (!end) continue;
        for (const source of decision.sources) {
          if (source.kind !== "trait") continue;
          const start = anchor(`[data-trait="${CSS.escape(source.value)}"]`, "right");
          if (!start) continue;
          const mid = (start.x + end.x) / 2;
          next.push({
            key: `${source.value}-${decision.area}`,
            area: decision.area,
            d: `M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`,
          });
        }
      }
      setLines(next);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(board);
    board.querySelectorAll("[data-area], [data-trait]").forEach((el) => observer.observe(el));
    // ResizeObserver doesn't report in a background tab, and web fonts arriving
    // can move nodes, so measure on those occasions too.
    const timer = window.setTimeout(measure, 0);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [direction, mode, traits]);

  const sentence = direction.decisions
    .map((d) => `${AREA_LABELS[d.area]}: ${d.decision}, shaped by ${d.sources.map((s) => s.value).join(" and ")}.`)
    .join(" ");

  return (
    <figure className={styles.figure}>
      <BrandScope tokens={direction.tokens} className={styles.scope}>
        <div ref={boardRef} className={styles.board} data-mode={mode}>
          {mode === "constellation" ? (
            <svg className={styles.lines} aria-hidden="true">
              {lines.map((line) => (
                <path
                  key={`${direction.id}-${line.key}`}
                  d={line.d}
                  pathLength={1}
                  className={styles.line}
                  data-dim={focusArea !== null && focusArea !== line.area}
                  data-strong={focusArea === line.area}
                />
              ))}
            </svg>
          ) : null}

          <div className={styles.traits}>
            <p className={styles.columnLabel}>From your brief</p>
            <ul>
              {traits.map((trait) => (
                <ViewTransition key={trait} name={`canvas-trait-${slug(trait)}`} share="auto" default="none">
                  <li
                    className={styles.trait}
                    data-trait={trait}
                    data-linked={linkedTraits.has(trait)}
                    data-lit={focusArea !== null && (decisionsByArea.get(focusArea)?.sources.some((s) => s.value === trait) ?? false)}
                  >
                    {trait}
                  </li>
                </ViewTransition>
              ))}
            </ul>
          </div>

          <ViewTransition name="canvas-brand" share="auto" default="none">
            <div className={styles.brand}>
              <p className={styles.brandName}>{brandName}</p>
              <p className={styles.directionName}>
                Direction {direction.letter} &middot; {direction.name}
              </p>
            </div>
          </ViewTransition>

          <ul className={styles.areas}>
            {DESIGN_AREAS.map((area) => {
              const decision = decisionsByArea.get(area);
              return (
                <ViewTransition key={area} name={`canvas-area-${area}`} share="auto" default="none">
                  <li
                    className={styles.area}
                    data-area={area}
                    data-dim={focusArea !== null && focusArea !== area}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse") setHoverArea(area);
                    }}
                    onPointerLeave={() => setHoverArea(null)}
                  >
                    <button
                      type="button"
                      className={styles.areaButton}
                      aria-pressed={mode === "constellation" && pinnedArea === area}
                      aria-label={`${AREA_LABELS[area]}: ${decision?.decision ?? ""}. ${pinnedArea === area ? "Showing" : "Show"} which traits shaped it.`}
                      onClick={() => setPinnedArea((current) => (current === area ? null : area))}
                    >
                      <span className={styles.areaLabel}>{AREA_LABELS[area]}</span>
                      <span className={styles.areaVisual} aria-hidden="true">
                        <AreaVisual area={area} direction={direction} />
                      </span>
                      <span className={styles.decision}>{decision?.decision}</span>
                      {mode === "system" && decision ? <span className={styles.because}>{decision.because}</span> : null}
                    </button>
                  </li>
                </ViewTransition>
              );
            })}
          </ul>
        </div>
      </BrandScope>
      <figcaption className={styles.caption}>
        {mode === "system"
          ? `${direction.name}, laid out as the system the next stage builds on.`
          : "Lines show which personality traits shaped each decision. Hover over an area, or select it, to trace them."}
        <span className="visually-hidden"> {sentence}</span>
      </figcaption>
    </figure>
  );
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function AreaVisual({ area, direction }: { area: DesignArea; direction: Direction }) {
  const t = direction.tokens;
  const c = colorsFor(t);
  switch (area) {
    case "colour":
      return (
        <span className={styles.swatches}>
          {[c.brand.primary, c.brand.secondary, c.brand.accent, c.surface.page, c.text.primary].map((c, i) => (
            <span key={`${c}-${i}`} style={{ background: c }} />
          ))}
        </span>
      );
    case "type":
      return (
        <span className={styles.typeSample}>
          <span className={styles.glyph}>Aa</span>
          <span className={styles.fontName}>{brandFont(t.typography.display.family).name}</span>
        </span>
      );
    case "voice":
      return <span className={styles.quote}>{direction.voice.example}</span>;
    case "imagery":
      return (
        <span className={styles.image}>
          <CoastlineVisual style={direction.visual} abstract={!isDemoDirection(direction.id)} />
        </span>
      );
    case "motion":
      return (
        <span className={styles.motion}>
          <MotionPreview label="" compact />
        </span>
      );
    case "components":
      return (
        <span className={styles.components}>
          <span className={styles.button}>{direction.sample.primaryCta}</span>
          <span className={styles.miniCard} />
        </span>
      );
  }
}
