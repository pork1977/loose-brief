"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { STAGES, stageIndex } from "@/lib/stages";
import { stageStatuses } from "@/state/progress";
import { useProject } from "@/state/project-store";
import { ProjectMenu } from "./ProjectMenu";
import styles from "./StudioBar.module.css";

/*
 * The studio's top bar. The link direction decides which way the page slides.
 * Locked stages render as plain text rather than disabled links, and every
 * state is shown by an icon or number style as well as colour.
 */
export function StudioBar() {
  const pathname = usePathname();
  const current = stageIndex(pathname);
  const project = useProject();
  const statuses = project ? stageStatuses(project.state) : null;
  const stepsRef = useRef<HTMLElement>(null);

  // On narrow screens the stages scroll sideways, so bring the current one into view.
  useEffect(() => {
    const nav = stepsRef.current;
    const item = nav?.querySelectorAll("li")[current];
    if (!nav || !item || nav.scrollWidth <= nav.clientWidth) return;
    const offset = item.getBoundingClientRect().left - nav.getBoundingClientRect().left;
    nav.scrollTo({ left: nav.scrollLeft + offset - (nav.clientWidth - item.offsetWidth) / 2, behavior: "instant" });
  }, [current]);

  return (
    <header className={styles.bar} style={{ viewTransitionName: "studio-bar" }}>
      <div className={styles.brand}>
        <Wordmark />
      </div>

      <nav ref={stepsRef} className={styles.steps} aria-label="Project stages">
        <ol>
          {STAGES.map((stage, i) => {
            const status = statuses?.[stage.id] ?? "available";
            const isCurrent = i === current;
            const marker =
              status === "done" && !isCurrent ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : status === "locked" ? (
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="4" y="7" width="8" height="6" rx="1" />
                  <path d="M6 7V5.5a2 2 0 0 1 4 0V7" />
                </svg>
              ) : (
                stage.number
              );

            const content = (
              <>
                <span className={styles.stepNumber} aria-hidden="true">
                  {marker}
                </span>
                <span className={styles.stepLabel}>{stage.label}</span>
                {status === "done" ? <span className="visually-hidden"> (done)</span> : null}
                {status === "locked" ? <span className="visually-hidden"> (finish the earlier stages first)</span> : null}
              </>
            );

            return (
              <li key={stage.id} className={styles.step} data-state={isCurrent ? "current" : status}>
                {status === "locked" && !isCurrent ? (
                  <span className={styles.locked}>{content}</span>
                ) : (
                  <Link
                    href={stage.href}
                    aria-current={isCurrent ? "step" : undefined}
                    transitionTypes={[i > current ? "nav-forward" : "nav-back"]}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.tools}>
        <ProjectMenu />
        <ThemeToggle />
      </div>
    </header>
  );
}
