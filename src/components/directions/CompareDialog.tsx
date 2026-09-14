"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { BrandIllustration } from "@/components/brand/BrandIllustration";
import { MiniSite } from "@/components/brand/MiniSite";
import { MotionPreview } from "@/components/brand/MotionPreview";
import { ScaledPreview } from "@/components/brand/ScaledPreview";
import { runContrastChecks } from "@/lib/accessibility";
import type { Direction } from "@/lib/direction";
import { TickIcon } from "./DirectionCard";
import { HeadlineSample, Palette, TypeSpecimen } from "./DirectionParts";
import styles from "./CompareDialog.module.css";

type Props = {
  open: boolean;
  brandName: string;
  directions: [Direction, Direction] | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
};

/*
 * Two directions side by side, row by row, so differences line up. Each
 * column is its own BrandScope; every row pairs the same thing from both.
 */
export function CompareDialog({ open, brandName, directions, selectedId, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && directions && !dialog.open) dialog.showModal();
    if ((!open || !directions) && dialog.open) dialog.close();
  }, [open, directions]);

  const row = (label: string, render: (d: Direction) => ReactNode) =>
    directions ? (
      <div className={styles.row} role="row">
        <div className={styles.rowLabel} role="rowheader">
          {label}
        </div>
        {directions.map((d) => (
          <BrandScope key={d.id} tokens={d.tokens} className={styles.cell} role="cell">
            {render(d)}
          </BrandScope>
        ))}
      </div>
    ) : null;

  return (
    <dialog ref={ref} className={`ui-dialog ${styles.dialog}`} aria-labelledby={titleId} onClose={onClose}>
      {directions ? (
        <>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {directions[0].name} and {directions[1].name}
            </h2>
            <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={onClose}>
              Close
            </button>
          </header>

          <div className={styles.table} role="table" aria-label="Comparison">
            <div className={`${styles.row} ${styles.headRow}`} role="row">
              <div className={styles.rowLabel} role="columnheader">
                <span className="visually-hidden">Aspect</span>
              </div>
              {directions.map((d) => (
                <div key={d.id} className={styles.columnHead} role="columnheader">
                  <span className={styles.letter} aria-hidden="true">
                    {d.letter}
                  </span>
                  <span>
                    <strong>{d.name}</strong>
                    <span className={styles.description}>{d.description}</span>
                  </span>
                  <button
                    type="button"
                    className={`ui-button ui-button--small ${selectedId === d.id ? "ui-button--primary" : ""}`}
                    aria-pressed={selectedId === d.id}
                    onClick={() => onSelect(d.id)}
                  >
                    {selectedId === d.id ? (
                      <>
                        <TickIcon /> Selected
                      </>
                    ) : (
                      "Select"
                    )}
                  </button>
                </div>
              ))}
            </div>

            {row("Website", (d) => (
              <ScaledPreview designWidth={1120} designHeight={640} label={`Website preview in ${d.name}`}>
                <MiniSite brandName={brandName} direction={d} />
              </ScaledPreview>
            ))}
            {row("Headline", (d) => <HeadlineSample direction={d} />)}
            {row("Colour", (d) => <Palette direction={d} compact />)}
            {row("Type", (d) => <TypeSpecimen direction={d} />)}
            {row("Voice", (d) => (
              <p className={styles.text}>
                <strong>{d.voice.tone}.</strong> {d.voice.example}
              </p>
            ))}
            {row("Imagery", (d) => (
              <div className={styles.imagery}>
                <span className={styles.thumb}>
                  <BrandIllustration direction={d} />
                </span>
                <p className={styles.text}>{d.imagery.style}</p>
              </div>
            ))}
            {row("Motion", (d) => (
              <div className={styles.imagery}>
                <span className={styles.thumb}>
                  <MotionPreview label={`Motion sample: ${d.motion.style}`} />
                </span>
                <p className={styles.text}>{d.motion.principle}</p>
              </div>
            ))}
            {row("Corners", (d) => (
              <p className={styles.text}>
                Buttons {d.tokens.radius.button}, cards {d.tokens.radius.card}
              </p>
            ))}
            {row("Contrast", (d) => {
              const results = runContrastChecks(d.tokens);
              const passing = results.filter((r) => r.passes).length;
              return (
                <p className={styles.text}>
                  {passing} of {results.length} checks pass
                </p>
              );
            })}
            {row("Trade-off", (d) => <p className={styles.text}>{d.tradeOff}</p>)}
          </div>
        </>
      ) : null}
    </dialog>
  );
}
