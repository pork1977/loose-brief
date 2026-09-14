"use client";

import { useId, useState } from "react";
import { formatRatio, runContrastChecks, type ContrastResult } from "@/lib/accessibility";
import { brandFont } from "@/lib/brand-fonts";
import { AREA_LABELS, type DecisionSource, type Direction } from "@/lib/direction";
import { colorsFor, type Mode } from "@/lib/tokens";
import { dispatch } from "@/state/project-store";
import styles from "./DirectionParts.module.css";

/*
 * Pieces shared by the direction cards and the compare view. Everything that
 * renders brand styling expects to be inside a BrandScope.
 */

export const PALETTE_ROLES = [
  { key: "primary", label: "Primary", get: (d: Direction) => colorsFor(d.tokens).brand.primary },
  { key: "secondary", label: "Secondary", get: (d: Direction) => colorsFor(d.tokens).brand.secondary },
  { key: "accent", label: "Accent", get: (d: Direction) => colorsFor(d.tokens).brand.accent },
  { key: "page", label: "Page", get: (d: Direction) => colorsFor(d.tokens).surface.page },
  { key: "text", label: "Text", get: (d: Direction) => colorsFor(d.tokens).text.primary },
  { key: "inverse", label: "Inverse", get: (d: Direction) => colorsFor(d.tokens).surface.inverse },
] as const;

export function Palette({ direction, compact = false }: { direction: Direction; compact?: boolean }) {
  return (
    <ul className={styles.palette} data-compact={compact} aria-label={`${direction.name} colour palette`}>
      {PALETTE_ROLES.map((role) => {
        const hex = role.get(direction);
        return (
          <li key={role.key}>
            <span className={styles.chip} style={{ background: hex }} aria-hidden="true" />
            <span className={styles.role}>{role.label}</span>
            <code className={styles.hex}>{hex}</code>
          </li>
        );
      })}
    </ul>
  );
}

export function TypeSpecimen({ direction }: { direction: Direction }) {
  const { display, body, label } = direction.tokens.typography;
  return (
    <div className={styles.type}>
      <span className={styles.typeGlyph} aria-hidden="true">
        Aa
      </span>
      <dl className={styles.typeNames}>
        <div>
          <dt>Display</dt>
          <dd>{brandFont(display.family).name}</dd>
        </div>
        <div>
          <dt>Body</dt>
          <dd>{brandFont(body.family).name}</dd>
        </div>
        <div>
          <dt>Labels</dt>
          <dd>{brandFont(label.family).name}</dd>
        </div>
      </dl>
    </div>
  );
}

export function HeadlineSample({ direction }: { direction: Direction }) {
  return (
    <div className={styles.headlineSample}>
      <p className={styles.eyebrow}>{direction.sample.eyebrow}</p>
      <p className={styles.headline}>{direction.sample.headline}</p>
      <div className={styles.buttons} aria-hidden="true">
        <span className={styles.primaryButton}>{direction.sample.primaryCta}</span>
        <span className={styles.secondaryButton}>{direction.sample.secondaryCta}</span>
      </div>
    </div>
  );
}

const SOURCE_LABELS: Record<DecisionSource["kind"], string> = {
  trait: "Personality",
  audience: "Audience",
  problem: "Problem",
  avoid: "Avoid",
  goal: "Goal",
  reference: "Reference",
  material: "Your file",
};

export function WhyList({ direction }: { direction: Direction }) {
  return (
    <div className={styles.why}>
      <ul className={styles.decisions}>
        {direction.decisions.map((d) => (
          <li key={`${d.area}-${d.decision}`}>
            <p className={styles.decisionArea}>{AREA_LABELS[d.area]}</p>
            <p className={styles.decision}>{d.decision}</p>
            <p className={styles.because}>{d.because}</p>
            <ul className={styles.sources} aria-label="Drawn from">
              {d.sources.map((s) => (
                <li key={`${s.kind}-${s.value}`} className="ui-chip">
                  {SOURCE_LABELS[s.kind]}: {s.value}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className={styles.tradeOff}>
        <strong>Trade-off.</strong> {direction.tradeOff}
      </p>
    </div>
  );
}

/** Contrast summary with an expandable list; failing checks offer a fix that updates the direction. */
export function ContrastSummary({
  direction,
  mode = direction.tokens.mode,
  allowFix = true,
  onFix,
}: {
  direction: Direction;
  mode?: Mode;
  allowFix?: boolean;
  /** Defaults to fixing the direction on the Directions screen. */
  onFix?: (result: ContrastResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const results = runContrastChecks(direction.tokens, mode);
  const passing = results.filter((r) => r.passes).length;
  const failing = results.filter((r) => !r.passes);

  return (
    <div className={styles.contrast}>
      <div className={styles.contrastHeader}>
        <p className={styles.contrastScore} data-ok={failing.length === 0}>
          <span className={styles.scoreIcon} aria-hidden="true">
            {failing.length === 0 ? "✓" : "!"}
          </span>
          {passing} of {results.length} contrast checks pass
        </p>
        <button
          type="button"
          className="ui-button ui-button--ghost ui-button--small"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide checks" : "See checks"}
        </button>
      </div>

      {failing.length && allowFix ? (
        <ul className={styles.fixes}>
          {failing.map((r) => (
            <li key={r.id} className="ui-notice ui-notice--error">
              <div>
                <p>
                  <strong>{r.label}</strong> is {formatRatio(r.ratio)}, below the {r.minimum}:1 needed
                  {r.kind === "graphic" ? " for icons and lines" : " for text"}.
                </p>
                {r.suggestion ? (
                  <p className={styles.fixLine}>
                    <span className={styles.fixSwatch} style={{ background: r.foregroundHex }} aria-hidden="true" />
                    <code>{r.foregroundHex}</code>
                    <span aria-hidden="true">&rarr;</span>
                    <span className="visually-hidden">could become</span>
                    <span className={styles.fixSwatch} style={{ background: r.suggestion }} aria-hidden="true" />
                    <code>{r.suggestion}</code>
                  </p>
                ) : null}
              </div>
              {r.suggestion ? (
                <button
                  type="button"
                  className="ui-button ui-button--small"
                  onClick={() =>
                    onFix
                      ? onFix(r)
                      : dispatch({ type: "direction/applyTokenFix", id: direction.id, path: r.foreground, value: r.suggestion as string })
                  }
                >
                  Use {r.suggestion}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <ul id={listId} className={styles.checks} hidden={!open}>
        {results.map((r) => (
          <li key={r.id} data-passes={r.passes}>
            <span className={styles.checkIcon} aria-hidden="true">
              {r.passes ? "✓" : "✕"}
            </span>
            <span className={styles.checkPair} aria-hidden="true">
              <span style={{ background: r.backgroundHex, color: r.foregroundHex }}>Aa</span>
            </span>
            <span className={styles.checkLabel}>{r.label}</span>
            <span className={styles.checkRatio}>
              {formatRatio(r.ratio)}
              <span className="visually-hidden">{r.passes ? ", passes" : ", fails"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
