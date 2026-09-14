"use client";

import { ViewTransition, type ReactNode } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { MiniSite } from "@/components/brand/MiniSite";
import { ScaledPreview } from "@/components/brand/ScaledPreview";
import { ButtonLink } from "@/components/ui/Button";
import type { Stage } from "@/lib/stages";
import { selectedDirection, stageStatuses } from "@/state/progress";
import { useProject } from "@/state/project-store";
import { StageSkeleton } from "./StageSkeleton";
import styles from "./StageGate.module.css";

/*
 * Guards the stages after Directions. Someone arriving by bookmark, or after
 * starting over, gets told what's missing and where to go, instead of an
 * empty screen. When the stage is open it shows the chosen direction above the
 * page, carrying the same view transition name as its card, so the preview
 * travels across from the Directions screen.
 */
export function StageGate({ stageId, showSelection = true, children }: { stageId: Stage["id"]; showSelection?: boolean; children: ReactNode }) {
  const project = useProject();

  if (!project) return <StageSkeleton label="Loading your project" />;

  const status = stageStatuses(project.state)[stageId];
  const direction = selectedDirection(project.state);

  if (status === "locked" || !direction) {
    const briefDone = stageStatuses(project.state).directions !== "locked";
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>{briefDone ? "Pick a direction first" : "Finish the brief first"}</h1>
        <p className={styles.body}>
          {briefDone
            ? "This stage builds on the direction you choose, so there's nothing to show until you've picked one."
            : "Everything after the brief is built from it. Finish the brief, or load the Ebbfield demo brief, and come back."}
        </p>
        <ButtonLink href={briefDone ? "/directions" : "/brief"} variant="primary" transitionTypes={["nav-back"]}>
          <span aria-hidden="true">&larr;</span> {briefDone ? "Go to directions" : "Go to the brief"}
        </ButtonLink>
      </div>
    );
  }

  if (!showSelection) return <>{children}</>;

  return (
    <div className={styles.page}>
      <div className={styles.selected}>
        <BrandScope tokens={direction.tokens} className={styles.previewFrame}>
          <ViewTransition name={`direction-preview-${direction.id}`} share="auto" default="none">
            <div>
              <ScaledPreview designWidth={1120} designHeight={640} label={`Website preview in the ${direction.name} direction`}>
                <MiniSite brandName={project.state.brief.name.trim()} direction={direction} />
              </ScaledPreview>
            </div>
          </ViewTransition>
        </BrandScope>
        <div className={styles.selectedText}>
          <p className="ui-eyebrow">Building on</p>
          <p className={styles.selectedName}>
            Direction {direction.letter}: {direction.name}
          </p>
          <p className={styles.body}>{direction.description}</p>
          <ButtonLink href="/directions" variant="ghost" size="small" transitionTypes={["nav-back"]}>
            Change direction
          </ButtonLink>
        </div>
      </div>
      {children}
    </div>
  );
}
