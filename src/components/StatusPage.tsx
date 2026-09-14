import type { ReactNode } from "react";
import styles from "./StatusPage.module.css";

/** The layout for "not found" and "something went wrong" pages. */
export function StatusPage({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children: ReactNode; actions: ReactNode }) {
  return (
    <div className={styles.page}>
      <p className="ui-eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.body}>{children}</div>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
