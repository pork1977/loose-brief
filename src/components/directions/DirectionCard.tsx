"use client";

import { useId, useState, ViewTransition } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { CoastlineVisual } from "@/components/brand/CoastlineVisual";
import { MiniSite } from "@/components/brand/MiniSite";
import { MotionPreview } from "@/components/brand/MotionPreview";
import { ScaledPreview } from "@/components/brand/ScaledPreview";
import type { Direction } from "@/lib/direction";
import { ContrastSummary, HeadlineSample, Palette, TypeSpecimen, WhyList } from "./DirectionParts";
import styles from "./DirectionCard.module.css";

type Props = {
  brandName: string;
  direction: Direction;
  selected: boolean;
  comparing: boolean;
  compareDisabled: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onFocusDirection: () => void;
};

export function DirectionCard({
  brandName,
  direction,
  selected,
  comparing,
  compareDisabled,
  onSelect,
  onToggleCompare,
  onFocusDirection,
}: Props) {
  const [whyOpen, setWhyOpen] = useState(false);
  const titleId = useId();
  const whyId = useId();

  return (
    <article
      className={styles.card}
      data-selected={selected}
      aria-labelledby={titleId}
      onPointerEnter={onFocusDirection}
      onFocus={onFocusDirection}
    >
      <header className={styles.header}>
        <span className={styles.letter} aria-hidden="true">
          {direction.letter}
        </span>
        <div className={styles.titles}>
          <h2 id={titleId} className={styles.name}>
            <span className="visually-hidden">Direction {direction.letter}: </span>
            {direction.name}
          </h2>
          <p className={styles.description}>{direction.description}</p>
        </div>
        {selected ? (
          <span className={styles.selectedBadge}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Selected
          </span>
        ) : null}
      </header>

      <BrandScope tokens={direction.tokens} className={styles.brand}>
        <ViewTransition name={`direction-preview-${direction.id}`} share="auto" default="none">
          <div className={styles.preview}>
            <ScaledPreview designWidth={1120} designHeight={640} label={`Website preview in the ${direction.name} direction`}>
              <MiniSite brandName={brandName} direction={direction} />
            </ScaledPreview>
          </div>
        </ViewTransition>

        <section className={styles.block} aria-label="Headline and buttons">
          <HeadlineSample direction={direction} />
        </section>

        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Colour</h3>
          <Palette direction={direction} />
        </section>

        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Type</h3>
          <TypeSpecimen direction={direction} />
        </section>

        <section className={styles.block}>
          <h3 className={styles.blockTitle}>Voice</h3>
          <p className={styles.tone}>{direction.voice.tone}</p>
          <blockquote className={styles.quote}>{direction.voice.example}</blockquote>
        </section>

        <div className={styles.split}>
          <section className={styles.block}>
            <h3 className={styles.blockTitle}>Imagery</h3>
            <div className={styles.imageThumb}>
              <CoastlineVisual style={direction.visual} />
            </div>
            <p className={styles.small}>{direction.imagery.style}</p>
          </section>
          <section className={styles.block}>
            <h3 className={styles.blockTitle}>Motion</h3>
            <div className={styles.motionBox}>
              <MotionPreview label={`Motion sample: ${direction.motion.style}`} />
            </div>
            <p className={styles.small}>
              {direction.motion.style}. {direction.tokens.motion.slow} at its slowest.
            </p>
          </section>
        </div>
      </BrandScope>

      <div className={styles.meta}>
        <ContrastSummary direction={direction} />

        <div className={styles.whyBlock}>
          <button
            type="button"
            className={styles.whyToggle}
            aria-expanded={whyOpen}
            aria-controls={whyId}
            onClick={() => setWhyOpen((o) => !o)}
          >
            <span>Show me why</span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div id={whyId} hidden={!whyOpen}>
            <WhyList direction={direction} />
          </div>
        </div>
      </div>

      <footer className={styles.actions}>
        <button
          type="button"
          className={`ui-button ${selected ? "" : "ui-button--primary"}`}
          onClick={onSelect}
          aria-pressed={selected}
        >
          {selected ? "Selected" : "Select direction"}
        </button>
        <label className="ui-toggle" data-disabled={compareDisabled && !comparing}>
          <input type="checkbox" checked={comparing} disabled={compareDisabled && !comparing} onChange={onToggleCompare} />
          Compare
        </label>
      </footer>
    </article>
  );
}
