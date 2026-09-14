import styles from "./MotionPreview.module.css";

/*
 * A small looping demo of a brand's motion tokens: a marker travelling at the
 * slow speed and three bars growing at the normal speed, all with the brand's
 * easing curve. Must sit inside a BrandScope. With reduced motion it stays still.
 */
export function MotionPreview({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={styles.motion} data-compact={compact} role="img" aria-label={label}>
      <div className={styles.track}>
        <span className={styles.marker} />
      </div>
      {compact ? null : (
        <div className={styles.bars}>
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
