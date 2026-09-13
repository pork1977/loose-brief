"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { STAGES, stageIndex } from "@/lib/stages";
import styles from "./StudioBar.module.css";

/*
 * The studio's top bar. The link direction decides which way the page slides.
 * For now it only marks the current stage; "done" and locked stages need
 * project state, which arrives in Phase 3.
 */
export function StudioBar() {
  const pathname = usePathname();
  const current = stageIndex(pathname);

  return (
    <header className={styles.bar} style={{ viewTransitionName: "studio-bar" }}>
      <div className={styles.brand}>
        <Wordmark />
      </div>

      <nav className={styles.steps} aria-label="Project stages">
        <ol>
          {STAGES.map((stage, i) => (
            <li key={stage.id} className={styles.step} data-state={i === current ? "current" : undefined}>
              <Link
                href={stage.href}
                aria-current={i === current ? "step" : undefined}
                transitionTypes={[i > current ? "nav-forward" : "nav-back"]}
              >
                <span className={styles.stepNumber} aria-hidden="true">
                  {stage.number}
                </span>
                <span className={styles.stepLabel}>{stage.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.tools}>
        <ThemeToggle />
      </div>
    </header>
  );
}
