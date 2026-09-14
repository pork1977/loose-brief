"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./GeneratingDirections.module.css";

const STEPS = ["Reading the brief", "Choosing colour", "Pairing typefaces", "Writing sample copy", "Checking contrast"];

/*
 * The pause before the demo directions appear. They're written in advance, so
 * this is only pacing, and the screen says as much. It can be skipped, and it
 * runs faster for people who have asked for reduced motion.
 */
export function GeneratingDirections({ brandName, colours, onDone }: { brandName: string; colours: string[]; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const perStep = fast ? 150 : 650;
    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i + 1), perStep * (i + 1)));
    const finish = window.setTimeout(() => done.current(), perStep * STEPS.length + (fast ? 0 : 350));
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(finish);
    };
  }, []);

  return (
    <section className={styles.panel} aria-busy="true" aria-labelledby="generating-title">
      <div className={styles.orbit} aria-hidden="true">
        {colours.slice(0, 3).map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
      <h1 id="generating-title" className={styles.title}>
        Preparing three directions for {brandName}
      </h1>
      <ol className={styles.steps}>
        {STEPS.map((label, i) => (
          <li key={label} data-state={i < step ? "done" : i === step ? "active" : "waiting"}>
            <span className={styles.marker} aria-hidden="true">
              {i < step ? "✓" : ""}
            </span>
            {label}
            <span className="visually-hidden">{i < step ? " (done)" : i === step ? " (in progress)" : ""}</span>
          </li>
        ))}
      </ol>
      <p className={styles.note}>
        These are the built-in demo directions, written in advance, so this only takes a moment.
      </p>
      <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={onDone}>
        Skip
      </button>
    </section>
  );
}
