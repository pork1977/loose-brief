"use client";

import { useEffect, useRef, useState } from "react";
import type { BriefDraft } from "@/lib/brief";
import type { Direction } from "@/lib/direction";
import { sharedFiles, streamDirections } from "@/lib/live/client";
import type { DirectionsEvent } from "@/lib/live/protocol";
import styles from "./GeneratingDirections.module.css";
import own from "./LiveDirections.module.css";

type Props = {
  brief: BriefDraft;
  /** What the start button says, e.g. "Generate with Claude" or "Regenerate with Claude". */
  startLabel: string;
  intro: React.ReactNode;
  secondary?: React.ReactNode;
  onDone: (directions: Direction[], model: string) => void;
};

type Run =
  | { state: "idle" }
  | { state: "running"; started: number; stage: "preparing" | "planning" | "writing"; names: string[]; written: boolean[]; retrying: boolean[]; notice: string | null }
  | { state: "error"; message: string };

/*
 * Generating directions from the visitor's own brief with Claude. Unlike the
 * demo's pacing screen, every step shown here is a real stage of the request,
 * and each direction is ticked off as it actually arrives.
 */
export function LiveDirections({ brief, startLabel, intro, secondary, onDone }: Props) {
  const [run, setRun] = useState<Run>({ state: "idle" });
  const [now, setNow] = useState(() => Date.now());
  const controller = useRef<AbortController | null>(null);
  const imageCount = brief.materials.filter((m) => m.shareWithClaude && m.kind !== "document").length;
  const docCount = brief.materials.filter((m) => m.shareWithClaude && m.kind === "document").length;
  const extras = [
    imageCount ? (imageCount === 1 ? "the image you chose to share" : `the ${imageCount} images you chose to share`) : "",
    docCount ? (docCount === 1 ? "the PDF you chose to share" : `the ${docCount} PDFs you chose to share`) : "",
    brief.currentSite.trim() ? "the text of your current website" : "",
  ].filter(Boolean);

  // Stop the request if the visitor leaves the page part way through.
  useEffect(() => () => controller.current?.abort(), []);

  const running = run.state === "running";
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const start = async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const started = Date.now();
    setNow(started);
    setRun({ state: "running", started, stage: "preparing", names: [], written: [false, false, false], retrying: [false, false, false], notice: null });

    const update = (event: DirectionsEvent) =>
      setRun((r) => {
        if (r.state !== "running") return r;
        if (event.type === "stage") return { ...r, stage: event.stage };
        if (event.type === "planned") return { ...r, names: event.names };
        if (event.type === "notice") return { ...r, notice: event.message };
        if (event.type === "retry") return { ...r, retrying: r.retrying.map((v, i) => (i === event.index ? true : v)) };
        if (event.type === "direction") return { ...r, written: r.written.map((v, i) => (i === event.index ? true : v)) };
        return r;
      });

    try {
      const images = await sharedFiles(brief);
      let model = "";
      const directions = await streamDirections({ brief, images }, (event) => {
        if (event.type === "done") model = event.model;
        update(event);
      }, abort.signal);
      if (abort.signal.aborted) return;
      onDone(directions, model);
    } catch (error) {
      if (abort.signal.aborted) return;
      setRun({ state: "error", message: error instanceof Error ? error.message : "Something went wrong. Try again." });
    }
  };

  const stop = () => {
    controller.current?.abort();
    setRun({ state: "idle" });
  };

  if (run.state === "running") {
    const seconds = Math.max(0, Math.round((now - run.started) / 1000));
    const planned = run.stage === "writing";
    const steps: { label: string; state: "done" | "active" | "waiting"; note?: string }[] = [
      { label: "Reading your brief", state: run.stage === "preparing" ? "active" : "done" },
      { label: "Planning three different routes", state: run.stage === "planning" ? "active" : planned ? "done" : "waiting" },
      ...[0, 1, 2].map((i) => ({
        label: `Writing direction ${"ABC"[i]}${run.names[i] ? `: ${run.names[i]}` : ""}`,
        state: (run.written[i] ? "done" : planned ? "active" : "waiting") as "done" | "active" | "waiting",
        note: run.retrying[i] && !run.written[i] ? "fixing something that didn't pass the checks" : undefined,
      })),
      { label: "Checking contrast and fitting it to the page", state: run.written.every(Boolean) ? "active" : "waiting" },
    ];
    return (
      <section className={styles.panel} aria-busy="true" aria-labelledby="live-title">
        <div className={styles.orbit} aria-hidden="true">
          {["var(--ui-color-accent)", "var(--ui-color-text-primary)", "var(--ui-color-success)"].map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </div>
        <h1 id="live-title" className={styles.title}>
          Claude is writing three directions for {brief.name.trim()}
        </h1>
        <ol className={`${styles.steps} ${own.steps}`}>
          {steps.map((step) => (
            <li key={step.label} data-state={step.state}>
              <span className={styles.marker} aria-hidden="true">
                {step.state === "done" ? "✓" : ""}
              </span>
              <span>
                {step.label}
                {step.note ? <span className={own.note}> ({step.note})</span> : null}
              </span>
              <span className="visually-hidden">{step.state === "done" ? " (done)" : step.state === "active" ? " (in progress)" : ""}</span>
            </li>
          ))}
        </ol>
        {run.notice ? (
          <p className="ui-notice" role="status">
            {run.notice}
          </p>
        ) : null}
        <p className={styles.note} aria-live="off">
          {seconds}s. This usually takes about a minute. You can keep this tab open and wait.
        </p>
        <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={stop}>
          Stop
        </button>
      </section>
    );
  }

  return (
    <div className={own.start}>
      {run.state === "error" ? (
        <div className="ui-notice ui-notice--error" role="alert">
          <p>{run.message}</p>
        </div>
      ) : null}
      <div className={own.intro}>{intro}</div>
      <ul className={own.facts}>
        <li>
          {listOf(["Your brief", ...extras])} will be sent to Anthropic, the company that runs Claude. Loose Brief doesn&rsquo;t keep a copy on its server.
          {brief.currentSite.trim() ? " Your website's front page is read by Loose Brief's server first." : ""}
        </li>
        <li>It takes about a minute. Each visitor can run it a few times an hour.</li>
        <li>What comes back is checked before you see it, and labelled as made by Claude.</li>
      </ul>
      <div className={own.actions}>
        <button type="button" className="ui-button ui-button--primary" onClick={start}>
          {run.state === "error" ? "Try again" : startLabel}
        </button>
        {secondary}
      </div>
    </div>
  );
}

/** "A", "A and B", "A, B and C". */
function listOf(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
