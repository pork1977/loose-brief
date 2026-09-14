import { DEMO_WEBSITE } from "@/data/demo-website";
import type { Direction } from "@/lib/direction";
import { MiniSite } from "./MiniSite";
import styles from "./SitePreview.module.css";

/*
 * A short homepage built only from brand tokens: the hero, then feature
 * cards, an inverse impact band, a call to action and a footer. Enough of a
 * page to show every token doing its job. Must sit inside a BrandScope.
 */
export function SitePreview({ brandName, direction }: { brandName: string; direction: Direction }) {
  const site = DEMO_WEBSITE;
  return (
    <div className={styles.page}>
      <MiniSite brandName={brandName} direction={direction} />

      <section className={styles.features} data-tokens="--space-l --space-m">
        <p className={styles.label} data-tokens="--font-label --font-label-transform --color-text-secondary">
          What it does
        </p>
        <div className={styles.featureGrid}>
          {site.features.map((f, i) => (
            <div key={f.title} className={styles.card} data-tokens="--color-surface --color-border --radius-card --shadow-card --space-m">
              <span className={styles.icon} data-tokens="--color-brand-accent --color-brand-primary --radius-small" aria-hidden="true">
                {i + 1}
              </span>
              <p className={styles.cardTitle} data-tokens="--font-display --color-text-primary">
                {f.title}
              </p>
              <p className={styles.cardBody} data-tokens="--font-body --color-text-secondary">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.impact} data-tokens="--color-surface-inverse --color-text-inverse --space-l">
        <p className={styles.impactLabel} data-tokens="--font-label --color-text-inverse">
          {site.impact.label} <span className={styles.illustrative}>(illustrative)</span>
        </p>
        <div className={styles.figures}>
          {site.impact.figures.map((f) => (
            <div key={f.label} className={styles.figure}>
              <p className={styles.figureValue} data-tokens="--font-display --color-text-inverse --color-brand-secondary">
                {f.value}
              </p>
              <p className={styles.figureLabel}>{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta} data-tokens="--color-background --space-2xl">
        <p className={styles.ctaTitle} data-tokens="--font-display --font-display-leading --color-text-primary">
          {site.cta.title}
        </p>
        <p className={styles.ctaBody} data-tokens="--font-body --color-text-secondary">
          {site.cta.body}
        </p>
        <span className={styles.button} data-tokens="--color-button-primary --color-button-primary-text --radius-button">
          {direction.sample.primaryCta}
        </span>
      </section>

      <footer className={styles.footer} data-tokens="--color-border --color-text-secondary --space-m">
        <span className={styles.footerBrand} data-tokens="--font-display --color-text-primary">
          {brandName}
        </span>
        <span className={styles.footerLinks}>
          {site.footer.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      </footer>
    </div>
  );
}
