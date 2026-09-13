"use client";

import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { isDemoBrief } from "@/data/demo-brief";
import { stageStatuses } from "@/state/progress";
import { useProject } from "@/state/project-store";
import styles from "./DirectionsGate.module.css";

/*
 * Stops someone landing on Directions (say, from a bookmark or a refresh
 * after clearing their brief) without a finished brief behind it.
 */
export function DirectionsGate({ children }: { children: ReactNode }) {
  const project = useProject();

  if (!project) {
    return (
      <p className="visually-hidden" role="status">
        Loading your project
      </p>
    );
  }

  if (stageStatuses(project.state).directions === "locked") {
    return (
      <div className={styles.empty}>
        <p className="ui-eyebrow">Stage 02 / Directions</p>
        <h1 className={styles.title}>Finish the brief first</h1>
        <p className={styles.body}>
          Directions are built from your brief, so there&rsquo;s nothing to show yet. It takes a few minutes, or you
          can load the Ebbfield demo brief and see how it works.
        </p>
        <ButtonLink href="/brief" variant="primary" transitionTypes={["nav-back"]}>
          <span aria-hidden="true">&larr;</span> Go to the brief
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      {!isDemoBrief(project.state.brief) ? (
        <div className={`ui-notice ${styles.notice}`} role="status">
          <p>
            Directions for your own brief need live generation, which isn&rsquo;t built yet. The Ebbfield demo brief
            works end to end.
          </p>
        </div>
      ) : null}
      {children}
    </>
  );
}
