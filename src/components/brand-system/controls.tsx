"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { dispatch } from "@/state/project-store";
import type { BrandChange } from "@/state/project";
import styles from "./controls.module.css";

/*
 * Controls for the brand system editor.
 *
 * Every control commits through brandEdit(), which goes through the reducer's
 * validation and history. Text fields keep a local draft so a value that's
 * briefly invalid while typing (an empty headline, half a hex code) doesn't
 * snap back; only valid values are saved.
 */

export function brandEdit(label: string, changes: BrandChange[], coalesceKey?: string) {
  dispatch({ type: "brand/edit", label, changes, coalesceKey });
}

/* ------------------------------------------------------------ inspector */

type InspectApi = { highlight: (tokens: string[] | null) => void };
export const InspectContext = createContext<InspectApi>({ highlight: () => {} });

/** Spread onto anything that should light up its tokens in the preview on hover or focus. */
export function useInspect(tokens: string[]) {
  const { highlight } = useContext(InspectContext);
  return {
    onPointerEnter: () => highlight(tokens),
    onPointerLeave: () => highlight(null),
    onFocus: () => highlight(tokens),
    onBlur: () => highlight(null),
  };
}

/* ----------------------------------------------------------- text field */

type DraftProps = {
  label: string;
  value: string;
  onCommit: (value: string) => void;
  max: number;
  hint?: string;
  multiline?: boolean;
  inspect?: string[];
};

/** Commits on every valid keystroke; an invalid draft shows an error and is never saved. */
export function DraftField({ label, value, onCommit, max, hint, multiline, inspect = [] }: DraftProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [stored, setStored] = useState(value);
  const inspectProps = useInspect(inspect);

  // When the saved value changes from outside (undo, reset, a preset), follow it.
  if (value !== stored) {
    setStored(value);
    setDraft(value);
  }

  const trimmed = draft.trim();
  const error = trimmed.length === 0 ? "This can't be empty." : trimmed.length > max ? `Keep this to ${max} characters or fewer.` : null;

  const change = (next: string) => {
    setDraft(next);
    // Commit exactly what was typed (trimming here would eat the space before the next word);
    // the length rules apply to the trimmed text, as the schema's do.
    const t = next.trim();
    if (t.length > 0 && t.length <= max && next !== value) onCommit(next);
  };

  const common = {
    id,
    value: draft,
    onChange: (e: { target: { value: string } }) => change(e.target.value),
    onBlur: () => {
      inspectProps.onBlur();
      if (error) setDraft(value);
    },
    onFocus: inspectProps.onFocus,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined,
  };

  return (
    <div className="ui-field" onPointerEnter={inspectProps.onPointerEnter} onPointerLeave={inspectProps.onPointerLeave}>
      <label className="ui-label" htmlFor={id}>
        <span>{label}</span>
        {draft.length > max * 0.8 ? (
          <span className="ui-counter" data-over={draft.length > max}>
            {draft.length}/{max}
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="ui-hint">
          {hint}
        </p>
      ) : null}
      {multiline ? <textarea className="ui-textarea" rows={3} {...common} /> : <input className="ui-input" {...common} />}
      {error ? (
        <p id={`${id}-error`} className="ui-error">
          {error} The last saved version is kept.
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------- colour field */

type ColourProps = {
  label: string;
  description?: string;
  value: string;
  onChange: (hex: string, continuous: boolean) => void;
  inspect?: string[];
  badge?: ReactNode;
};

export function ColourField({ label, description, value, onChange, inspect = [], badge }: ColourProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [stored, setStored] = useState(value);
  const inspectProps = useInspect(inspect);

  if (value !== stored) {
    setStored(value);
    setDraft(value);
  }

  const valid = /^#?[0-9a-f]{6}$/i.test(draft.trim());

  return (
    <div className={styles.colour} {...inspectProps}>
      <input
        type="color"
        className={styles.picker}
        value={value.toLowerCase()}
        aria-label={`${label} colour picker`}
        onChange={(e) => onChange(e.target.value.toUpperCase(), true)}
      />
      <div className={styles.colourText}>
        <label htmlFor={id} className={styles.colourLabel}>
          {label}
        </label>
        {description ? <span className={styles.colourDescription}>{description}</span> : null}
      </div>
      <div className={styles.colourMeta}>
        {badge}
        <input
          id={id}
          className={`ui-input ui-input--small ${styles.hex}`}
          value={draft}
          spellCheck={false}
          maxLength={7}
          aria-invalid={valid ? undefined : true}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (/^#?[0-9a-f]{6}$/i.test(next.trim())) {
              const hex = `#${next.trim().replace("#", "").toUpperCase()}`;
              if (hex !== value) onChange(hex, false);
            }
          }}
          onBlur={() => {
            if (!valid) setDraft(value);
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- slider */

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
  inspect?: string[];
};

export function SliderField({ label, value, min, max, step, format, onChange, inspect = [] }: SliderProps) {
  const id = useId();
  const inspectProps = useInspect(inspect);
  return (
    <div className={styles.slider} {...inspectProps}>
      <label htmlFor={id} className="ui-label">
        <span>{label}</span>
        <output htmlFor={id} className={styles.sliderValue}>
          {format(value)}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ------------------------------------------------------------ segmented */

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  inspect?: string[];
  hideLabel?: boolean;
};

export function Segmented<T extends string>({ label, value, options, onChange, inspect = [], hideLabel }: SegmentedProps<T>) {
  const name = useId();
  const inspectProps = useInspect(inspect);
  return (
    <fieldset className={styles.segmentedField} {...inspectProps}>
      <legend className={hideLabel ? "visually-hidden" : "ui-label"}>{label}</legend>
      <div className={styles.segmented}>
        {options.map((option) => (
          <label key={option.value} className={styles.segment}>
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------- section */

export function EditorSection({ title, description, children, actions }: { title: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.sectionHeader}>
        <div>
          <h3 id={id} className={styles.sectionTitle}>
            {title}
          </h3>
          {description ? <p className={styles.sectionDescription}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
