"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { isDemoBrief } from "@/data/demo-brief";
import { startDemo, startOver } from "@/state/project-actions";
import { useProject } from "@/state/project-store";
import { setTourHidden, useTourHidden } from "@/state/tour";
import styles from "./ProjectMenu.module.css";

type Confirm = "demo" | "reset" | null;

/*
 * Project tools that belong on every stage: whether the project is saved,
 * restarting the demo, starting over and bringing back the tour. A plain
 * disclosure rather than an ARIA menu, since it holds a status line as well
 * as buttons.
 */
export function ProjectMenu() {
  const project = useProject();
  const router = useRouter();
  const tourHidden = useTourHidden();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const failed = project?.saveStatus === "failed";
  const demo = project ? isDemoBrief(project.state.brief) : false;

  const run = async (action: Confirm) => {
    setConfirm(null);
    setOpen(false);
    if (action === "demo") {
      await startDemo();
      setTourHidden(false);
      router.push("/directions", { transitionTypes: ["nav-back"] });
    }
    if (action === "reset") {
      await startOver();
      router.push("/brief", { transitionTypes: ["nav-back"] });
    }
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={buttonRef}
        type="button"
        className="ui-button ui-button--ghost ui-button--small"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {failed ? <span className={styles.alert} aria-hidden="true" /> : null}
        Project
        {failed ? <span className="visually-hidden"> (not saved)</span> : null}
        <svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id={panelId} className={styles.panel} hidden={!open}>
        <p className={styles.status} data-failed={failed}>
          <span className={styles.dot} aria-hidden="true" />
          {failed ? "Couldn't save in this browser. Changes last until you close the tab." : "Saved in this browser. Nothing is uploaded."}
        </p>
        <div className={styles.actions}>
          {demo && tourHidden ? (
            <button
              type="button"
              className={styles.item}
              onClick={() => {
                setTourHidden(false);
                setOpen(false);
              }}
            >
              Show the demo tour
            </button>
          ) : null}
          <button type="button" className={styles.item} onClick={() => setConfirm("demo")}>
            {demo ? "Restart the demo" : "Try the demo instead"}
          </button>
          <button type="button" className={styles.item} data-destructive="true" onClick={() => setConfirm("reset")}>
            Start over
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "demo" ? (demo ? "Restart the demo?" : "Replace your project with the demo?") : "Start over?"}
        body={
          confirm === "demo"
            ? "This goes back to the Ebbfield demo brief and its three directions. Any direction you picked, and every change you made to it, will be lost."
            : "This clears the brief, the directions, your brand and any files you've added. It can't be undone."
        }
        confirmLabel={confirm === "demo" ? (demo ? "Restart the demo" : "Try the demo") : "Clear everything"}
        destructive={confirm === "reset"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void run(confirm)}
      />
    </div>
  );
}
