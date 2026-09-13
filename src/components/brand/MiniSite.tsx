import type { DemoDirection } from "@/data/demo-directions";
import { CoastlineVisual } from "./CoastlineVisual";
import styles from "./MiniSite.module.css";

/*
 * A small slice of a brand's homepage: nav plus hero. Must be rendered inside
 * a BrandScope. Layout responds to its own width with container queries, so
 * it behaves the same in a landing-page frame as in a phone-sized preview.
 *
 * Links and buttons are inert here (it's a picture of a website, and a real
 * one arrives in the Studio), so they're hidden from assistive tech and
 * can't take focus.
 */
export function MiniSite({ brandName, direction }: { brandName: string; direction: DemoDirection }) {
  const { sample, visual } = direction;
  return (
    <div className={styles.site} data-visual={visual}>
      <div className={styles.nav} aria-hidden="true">
        <span className={styles.logo}>{brandName}</span>
        <span className={styles.navLinks}>
          {sample.nav.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </span>
        <span className={styles.navButton}>{sample.primaryCta}</span>
      </div>

      <div className={styles.hero}>
        {/* Keyed so a change of direction fades the new type in rather than reflowing mid-read. */}
        <div key={direction.id} className={styles.copy}>
          <p className={styles.eyebrow}>{sample.eyebrow}</p>
          <p className={styles.headline}>{sample.headline}</p>
          <p className={styles.body}>{sample.body}</p>
          <div className={styles.actions} aria-hidden="true">
            <span className={styles.primary}>{sample.primaryCta}</span>
            <span className={styles.secondary}>{sample.secondaryCta}</span>
          </div>
        </div>
        <div className={styles.visualCard}>
          <CoastlineVisual style={visual} />
          <span className={styles.visualCaption} aria-hidden="true">
            Illustrative
          </span>
        </div>
      </div>
    </div>
  );
}
