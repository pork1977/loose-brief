"use client";

import { dismissRestoreNotice, useProject } from "@/state/project-store";
import styles from "./RestoreNotice.module.css";

/** Shown on whichever stage someone lands on when their saved project couldn't be read and was replaced. */
export function RestoreNotice() {
  const project = useProject();
  if (!project?.restoreFailed) return null;
  return (
    <div className={`ui-notice ui-notice--error ${styles.notice}`} role="status">
      <p>Your saved project couldn&rsquo;t be read, so this is a fresh one.</p>
      <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={dismissRestoreNotice}>
        OK
      </button>
    </div>
  );
}
