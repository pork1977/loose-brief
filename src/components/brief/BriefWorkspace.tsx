"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DEMO_BRIEF, isDemoBrief } from "@/data/demo-brief";
import { BRIEF_STEPS, EMPTY_BRIEF, firstInvalidStep, isStepValid, validateStep, type BriefDraft, type BriefField } from "@/lib/brief";
import { clearMaterialFiles, pruneMaterialFiles } from "@/lib/material-files";
import { forgetAllThumbnails } from "@/lib/material-thumbnails";
import type { ProjectAction } from "@/state/project";
import { dismissRestoreNotice, dispatch, useProject } from "@/state/project-store";
import { AudienceStep, ContextStep, GoalsStep, PersonalityStep, VisualStep, type StepProps } from "./BriefSteps";
import { BriefSummary } from "./BriefSummary";
import styles from "./BriefWorkspace.module.css";

const STEP_COMPONENTS: ((props: StepProps) => React.ReactNode)[] = [ContextStep, AudienceStep, PersonalityStep, VisualStep, GoalsStep];

type Confirm = "demo" | "reset" | null;

export function BriefWorkspace() {
  const project = useProject();
  const router = useRouter();
  // Errors only show for a step once someone has tried to leave it.
  const [attempted, setAttempted] = useState<Set<number>>(() => new Set());
  const [confirm, setConfirm] = useState<Confirm>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<number | null>(null);

  const stepIndex = project?.state.briefStep ?? 0;

  // Once per visit, tidy away stored images that no material in the brief uses any more.
  const pruned = useRef(false);
  useEffect(() => {
    if (!project || pruned.current) return;
    pruned.current = true;
    pruneMaterialFiles(project.state.brief.materials.map((m) => m.id));
  }, [project]);

  // Move focus to the new step's heading, but not on first load.
  useEffect(() => {
    if (!project) return;
    if (previousStep.current !== null && previousStep.current !== stepIndex) {
      headingRef.current?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
    previousStep.current = stepIndex;
  }, [project, stepIndex]);

  if (!project) return <WorkspaceSkeleton />;

  const { state, saveStatus, restoreFailed } = project;
  const { brief, furthestStep } = state;
  const step = BRIEF_STEPS[stepIndex];
  const StepComponent = STEP_COMPONENTS[stepIndex];
  const errors = attempted.has(stepIndex) ? validateStep(stepIndex, brief) : {};
  const isLast = stepIndex === BRIEF_STEPS.length - 1;
  const hasContent = JSON.stringify(brief) !== JSON.stringify(EMPTY_BRIEF);

  // TypeScript can't narrow a generic field/value pair into the action union, hence the cast.
  const set = <K extends BriefField>(field: K, value: BriefDraft[K]) =>
    dispatch({ type: "brief/set", field, value } as Extract<ProjectAction, { type: "brief/set" }>);

  const focusFirstError = (index: number) => {
    const fields = BRIEF_STEPS[index].fields as readonly string[];
    const failing = Object.keys(validateStep(index, brief));
    const first = fields.find((f) => failing.includes(f));
    // The fields on this step are already rendered, so focus can move straight away.
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const markAttempted = (index: number) => setAttempted((prev) => new Set(prev).add(index));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    markAttempted(stepIndex);
    if (!isStepValid(stepIndex, brief)) {
      focusFirstError(stepIndex);
      return;
    }
    if (!isLast) {
      dispatch({ type: "brief/goToStep", step: stepIndex + 1 });
      return;
    }
    const invalid = firstInvalidStep(brief);
    if (invalid !== -1) {
      markAttempted(invalid);
      dispatch({ type: "brief/goToStep", step: invalid });
      return;
    }
    dispatch({ type: "brief/submit" });
    router.push("/directions", { transitionTypes: ["nav-forward"] });
  };

  const applyConfirm = async () => {
    const action = confirm;
    setConfirm(null);
    setAttempted(new Set());
    forgetAllThumbnails();
    await clearMaterialFiles();
    if (action === "demo") dispatch({ type: "brief/loadDemo", brief: DEMO_BRIEF });
    if (action === "reset") dispatch({ type: "project/reset" });
  };

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className="ui-eyebrow">Stage 01 / Brief</p>
          <h1 className={styles.title}>The Brief</h1>
          <p className={styles.intro}>
            Tell us about the business. Five short steps, and you can come back and change anything later.
          </p>
        </div>
        <div className={styles.headerActions}>
          <SaveStatus status={saveStatus} hasContent={hasContent} />
          <button
            type="button"
            className="ui-button ui-button--small"
            onClick={() => (hasContent && !isDemoBrief(brief) ? setConfirm("demo") : applyDemo())}
          >
            Load demo brief
          </button>
          <button
            type="button"
            className="ui-button ui-button--ghost ui-button--small"
            onClick={() => setConfirm("reset")}
            disabled={!hasContent}
          >
            Start over
          </button>
        </div>
      </header>

      {restoreFailed ? (
        <div className="ui-notice ui-notice--error" role="status">
          <p>Your saved brief couldn&rsquo;t be read, so this is a fresh one.</p>
          <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={dismissRestoreNotice}>
            OK
          </button>
        </div>
      ) : null}

      <div className={styles.columns}>
        <div className={styles.main}>
          <nav aria-label="Brief steps">
            <ol className={styles.steps}>
              {BRIEF_STEPS.map((s, i) => {
                const reachable = i <= furthestStep;
                const done = reachable && i !== stepIndex && isStepValid(i, brief);
                const needsWork = reachable && i !== stepIndex && !done && attempted.has(i);
                return (
                  <li key={s.id} className={styles.step} data-current={i === stepIndex} data-done={done}>
                    <button
                      type="button"
                      onClick={() => {
                        if (i > stepIndex) markAttempted(stepIndex);
                        dispatch({ type: "brief/goToStep", step: i });
                      }}
                      disabled={!reachable}
                      aria-current={i === stepIndex ? "step" : undefined}
                    >
                      <span className={styles.stepMarker} aria-hidden="true">
                        {done ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : needsWork ? (
                          "!"
                        ) : (
                          s.number
                        )}
                      </span>
                      <span className={styles.stepLabel}>{s.label}</span>
                      <span className="visually-hidden">
                        {done ? " (complete)" : needsWork ? " (needs attention)" : !reachable ? " (not reached yet)" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-labelledby="brief-step-title">
            <div className={styles.stepHeader}>
              <p className="ui-eyebrow">
                Step {step.number} of 0{BRIEF_STEPS.length}
              </p>
              <h2 id="brief-step-title" ref={headingRef} tabIndex={-1} className={styles.stepTitle}>
                {step.title}
              </h2>
            </div>

            {Object.keys(errors).length ? (
              <p className="ui-notice ui-notice--error" role="alert">
                {Object.keys(errors).length === 1
                  ? "One answer needs a look before you carry on."
                  : `${Object.keys(errors).length} answers need a look before you carry on.`}
              </p>
            ) : null}

            <div className={styles.fields}>
              <StepComponent brief={brief} errors={errors} set={set} />
            </div>

            <div className={styles.formNav}>
              {stepIndex > 0 ? (
                <button
                  type="button"
                  className="ui-button ui-button--ghost"
                  onClick={() => dispatch({ type: "brief/goToStep", step: stepIndex - 1 })}
                >
                  <span aria-hidden="true">&larr;</span> Back
                </button>
              ) : (
                <span />
              )}
              <button type="submit" className="ui-button ui-button--primary ui-button--large">
                {isLast ? "Generate directions" : "Next"} <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </form>
        </div>

        <aside className={styles.aside}>
          <BriefSummary brief={brief} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "demo" ? "Replace your brief with the demo?" : "Start a new brief?"}
        body={
          confirm === "demo"
            ? "Your answers and any files you've added will be replaced by the Ebbfield demo brief."
            : "This clears every answer and any files you've added. It can't be undone."
        }
        confirmLabel={confirm === "demo" ? "Load the demo" : "Clear everything"}
        destructive={confirm === "reset"}
        onConfirm={applyConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );

  function applyDemo() {
    setAttempted(new Set());
    dispatch({ type: "brief/loadDemo", brief: DEMO_BRIEF });
  }
}

function SaveStatus({ status, hasContent }: { status: "idle" | "saved" | "failed"; hasContent: boolean }) {
  if (status === "failed") {
    return (
      <p className={styles.saveStatus} data-failed="true" role="status">
        Couldn&rsquo;t save in this browser
      </p>
    );
  }
  if (!hasContent) return null;
  return (
    <p className={styles.saveStatus} role="status">
      <span aria-hidden="true" className={styles.saveDot} />
      Saved in this browser
    </p>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className={styles.workspace} aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading your brief
      </p>
      <div className={styles.skeletonHeader} />
      <div className={styles.columns}>
        <div className={styles.skeletonMain} />
        <div className={styles.skeletonAside} />
      </div>
    </div>
  );
}
