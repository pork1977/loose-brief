"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { Website } from "@/components/website/Website";
import { WebsiteFrameContext, type SiteTarget, type WebsiteFrame } from "@/components/website/WebsiteContext";
import type { Direction } from "@/lib/direction";
import type { Mode } from "@/lib/tokens";
import styles from "./StudioCanvas.module.css";

export const VIEWPORTS = {
  desktop: { label: "Desktop", width: 1280 },
  tablet: { label: "Tablet", width: 834 },
  mobile: { label: "Mobile", width: 390 },
} as const;
export type Viewport = keyof typeof VIEWPORTS;

export type CanvasApi = {
  goTo: (target: SiteTarget, flash?: boolean) => void;
  setScrollRatio: (ratio: number) => void;
};

type Props = {
  brandName: string;
  direction: Direction;
  mode: Mode;
  viewport: Viewport;
  label: string;
  onApi?: (api: CanvasApi) => void;
  onScrollRatio?: (ratio: number) => void;
};

/*
 * A frame that runs the generated homepage at a real device width. The site
 * is laid out at that width (so its container queries pick the right layout)
 * and scaled down only if the frame is narrower than the device, which keeps
 * it fully interactive: it scrolls, links move within it, the form works.
 */
export function StudioCanvas({ brandName, direction, mode, viewport, label, onApi, onScrollRatio }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const applyingRatio = useRef(false);

  useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((prev) => (prev.width === r.width && prev.height === r.height ? prev : { width: r.width, height: r.height }));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    const timer = window.setTimeout(measure, 0);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const deviceWidth = VIEWPORTS[viewport].width;
  const gap = viewport === "desktop" ? 0 : 24;
  const scale = box.width > 0 ? Math.min(1, (box.width - gap) / deviceWidth) : 1;

  const goTo = useCallback(
    (target: SiteTarget, flash = false) => {
      if (!scroller) return;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (target === "top") {
        scroller.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
        return;
      }
      const section = scroller.querySelector<HTMLElement>(`[data-section="${target}"]`);
      if (!section) return;
      const nav = scroller.querySelector<HTMLElement>("header");
      // Rects are in scaled screen pixels; scrollTop is in the site's own pixels.
      const offset = (section.getBoundingClientRect().top - scroller.getBoundingClientRect().top) / scale;
      const top = Math.max(0, scroller.scrollTop + offset - (nav?.offsetHeight ?? 0));
      scroller.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
      if (flash) {
        section.setAttribute("data-flash", "false");
        requestAnimationFrame(() => section.setAttribute("data-flash", "true"));
        window.setTimeout(() => section.removeAttribute("data-flash"), 1500);
      }
    },
    [scroller, scale],
  );

  const setScrollRatio = useCallback(
    (ratio: number) => {
      if (!scroller) return;
      applyingRatio.current = true;
      scroller.scrollTo({ top: ratio * (scroller.scrollHeight - scroller.clientHeight), behavior: "instant" });
    },
    [scroller],
  );

  useEffect(() => {
    onApi?.({ goTo, setScrollRatio });
  }, [onApi, goTo, setScrollRatio]);

  const frame = useMemo<WebsiteFrame>(() => ({ interactive: true, scrollRoot: scroller, goTo }), [scroller, goTo]);

  const height = box.height;

  return (
    <div ref={outer} className={styles.outer} data-viewport={viewport}>
      {box.width > 0 ? (
        <div className={styles.device} style={{ width: deviceWidth * scale, height }}>
          <div
            className={styles.scaled}
            style={{ width: deviceWidth, height: height / scale, transform: `scale(${scale})` }}
          >
            <div
              ref={setScroller}
              className={styles.scroller}
              role="region"
              aria-label={label}
              tabIndex={0}
              onScroll={(e) => {
                if (applyingRatio.current) {
                  applyingRatio.current = false;
                  return;
                }
                const el = e.currentTarget;
                const max = el.scrollHeight - el.clientHeight;
                onScrollRatio?.(max > 0 ? el.scrollTop / max : 0);
              }}
            >
              <WebsiteFrameContext.Provider value={frame}>
                <BrandScope tokens={direction.tokens} mode={mode} className={styles.scope}>
                  <Website brandName={brandName} direction={direction} />
                </BrandScope>
              </WebsiteFrameContext.Provider>
            </div>
          </div>
        </div>
      ) : null}
      {viewport !== "desktop" && scale < 1 ? <p className={styles.scaleNote}>Shown at {Math.round(scale * 100)}%</p> : null}
    </div>
  );
}
