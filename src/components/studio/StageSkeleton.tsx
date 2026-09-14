import styles from "./StageSkeleton.module.css";

/*
 * Shown for the moment between the page arriving and the saved project being
 * read from this browser, so a stage doesn't flash blank or empty first.
 */
export function StageSkeleton({ label }: { label: string }) {
  return (
    <div className={styles.skeleton} aria-busy="true">
      <p className="visually-hidden" role="status">
        {label}
      </p>
      <div className={styles.header}>
        <span className={styles.eyebrow} />
        <span className={styles.title} />
        <span className={styles.line} />
      </div>
      <div className={styles.body} />
    </div>
  );
}
