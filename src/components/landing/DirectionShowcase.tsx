"use client";

import { useState, useSyncExternalStore } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { MiniSite } from "@/components/brand/MiniSite";
import { DEMO_BRAND_NAME, DEMO_DIRECTIONS } from "@/data/demo-directions";
import { brandFont } from "@/lib/brand-fonts";
import styles from "./DirectionShowcase.module.css";

const INTERVAL_MS = 6500;

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
 * The landing page's rotating preview: one Ebbfield homepage, three sets of
 * tokens. Colours and corner radii animate between directions because the
 * brand colour properties are registered in globals.css.
 *
 * Advancing is driven by the progress bar's own CSS animation ending, so
 * pausing the animation pauses the carousel with no timers to keep in sync.
 * It never autoplays for visitors who have asked for reduced motion.
 */
export function DirectionShowcase() {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => true);

  const autoplay = !reducedMotion && !userPaused;
  const running = autoplay && !hovering;
  const direction = DEMO_DIRECTIONS[index];
  const { tokens } = direction;

  return (
    <section
      className={styles.showcase}
      aria-roledescription="carousel"
      aria-label={`Three brand directions for ${DEMO_BRAND_NAME}`}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false);
      }}
    >
      <div className={styles.frame}>
        <div className={styles.chrome} aria-hidden="true">
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.url}>ebbfield.example</span>
          <span className={styles.chromeLabel}>Direction {direction.letter}</span>
        </div>
        <BrandScope tokens={tokens} className={styles.canvas}>
          <MiniSite brandName={DEMO_BRAND_NAME} direction={direction} />
        </BrandScope>
      </div>

      <div className={styles.controls}>
        <div className={styles.tabs} role="group" aria-label="Choose a direction">
          {DEMO_DIRECTIONS.map((d, i) => {
            const active = i === index;
            return (
              <button
                key={d.id}
                type="button"
                className={styles.tab}
                aria-pressed={active}
                onClick={() => setIndex(i)}
              >
                <span className={styles.tabLetter}>{d.letter}</span>
                <span className={styles.tabText}>
                  <span className={styles.tabName}>{d.name}</span>
                  <span className={styles.tabSwatches} aria-hidden="true">
                    {[d.tokens.color.brand.primary, d.tokens.color.brand.secondary, d.tokens.color.brand.accent, d.tokens.color.surface.page].map(
                      (c) => (
                        <span key={c} className="ui-swatch" style={{ background: c }} />
                      ),
                    )}
                  </span>
                </span>
                {active && autoplay ? (
                  <span
                    key={`progress-${index}`}
                    className={styles.progress}
                    style={{
                      animationDuration: `${INTERVAL_MS}ms`,
                      animationPlayState: running ? "running" : "paused",
                    }}
                    onAnimationEnd={() => setIndex((i + 1) % DEMO_DIRECTIONS.length)}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {reducedMotion ? null : (
          <button
            type="button"
            className="ui-button ui-button--ghost ui-button--icon"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Play the rotation" : "Pause the rotation"}
          >
            {userPaused ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l10.5-6.5L8 5.5Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6.5" y="5.5" width="4" height="13" rx="1" />
                <rect x="13.5" y="5.5" width="4" height="13" rx="1" />
              </svg>
            )}
          </button>
        )}
      </div>

      <dl className={styles.readout} aria-live={autoplay ? "off" : "polite"}>
        <div>
          <dt>Direction</dt>
          <dd>{direction.name}</dd>
        </div>
        <div>
          <dt>Display</dt>
          <dd>{brandFont(tokens.typography.display.family).name}</dd>
        </div>
        <div>
          <dt>Body</dt>
          <dd>{brandFont(tokens.typography.body.family).name}</dd>
        </div>
        <div>
          <dt>Primary</dt>
          <dd>
            <span className="ui-swatch" style={{ background: tokens.color.button.primary }} aria-hidden="true" />
            {tokens.color.button.primary}
          </dd>
        </div>
      </dl>
    </section>
  );
}
