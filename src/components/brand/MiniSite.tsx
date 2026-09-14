import type { Direction } from "@/lib/direction";
import { CoastlineVisual } from "./CoastlineVisual";
import styles from "./MiniSite.module.css";

/*
 * A small slice of a brand's homepage: nav plus hero. Must be rendered inside
 * a BrandScope. Layout responds to its own width with container queries, so
 * it behaves the same in a landing-page frame as in a phone-sized preview.
 *
 * Links and buttons are inert here (it's a picture of a website), so they're
 * hidden from assistive tech and can't take focus.
 *
 * data-tokens lists the tokens each element reads, which is how the token
 * inspector finds what a change affects.
 */
export function MiniSite({ brandName, direction }: { brandName: string; direction: Direction }) {
  const { sample, visual } = direction;
  return (
    <div className={styles.site} data-visual={visual} data-tokens="--color-background --space-m">
      <div className={styles.nav} aria-hidden="true" data-tokens="--color-border --space-s">
        <span className={styles.logo} data-tokens="--font-display --color-text-primary">
          {brandName}
        </span>
        <span className={styles.navLinks} data-tokens="--font-body --color-text-secondary">
          {sample.nav.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
        <span className={styles.navButton} data-tokens="--color-button-primary --color-button-primary-text --radius-button">
          {sample.primaryCta}
        </span>
      </div>

      <div className={styles.hero}>
        {/* Keyed so a change of direction fades the new type in rather than reflowing mid-read. */}
        <div key={direction.id} className={styles.copy}>
          <p className={styles.eyebrow} data-tokens="--font-label --color-text-secondary">
            {sample.eyebrow}
          </p>
          <p className={styles.headline} data-tokens="--font-display --font-display-weight --font-display-leading --color-text-primary">
            {sample.headline}
          </p>
          <p className={styles.body} data-tokens="--font-body --color-text-secondary">
            {sample.body}
          </p>
          <div className={styles.actions} aria-hidden="true">
            <span className={styles.primary} data-tokens="--color-button-primary --color-button-primary-text --radius-button">
              {sample.primaryCta}
            </span>
            <span className={styles.secondary} data-tokens="--color-border --color-text-primary --radius-button">
              {sample.secondaryCta}
            </span>
          </div>
        </div>
        <div
          className={styles.visualCard}
          data-tokens="--color-surface --color-border --radius-card --shadow-card --color-brand-primary --color-brand-secondary --color-brand-accent"
        >
          <CoastlineVisual style={visual} />
          <span className={styles.visualCaption} aria-hidden="true">
            Illustrative
          </span>
        </div>
      </div>
    </div>
  );
}
