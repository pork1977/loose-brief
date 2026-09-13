"use client";

import { useId, useState, type ReactNode } from "react";

/*
 * Form fields for the brief. Every control has a visible label, hint and error
 * text are linked with aria-describedby, and invalid fields are marked with
 * aria-invalid so screen readers announce them.
 */

type FieldBase = {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
};

function describedBy(...ids: unknown[]) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function Label({ htmlFor, label, optional, counter }: { htmlFor?: string; label: string; optional?: boolean; counter?: ReactNode }) {
  return (
    <label className="ui-label" htmlFor={htmlFor}>
      <span>
        {label} {optional ? <span className="ui-label__optional">(optional)</span> : null}
      </span>
      {counter}
    </label>
  );
}

function Counter({ length, max }: { length: number; max: number }) {
  // Only worth showing once someone is getting near the limit.
  if (length < max * 0.7) return null;
  return (
    <span className="ui-counter" data-over={length > max} aria-hidden="true">
      {length}/{max}
    </span>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} className="ui-error">
      {error}
    </p>
  ) : null;
}

type TextProps = FieldBase & {
  name: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  placeholder?: string;
  autoComplete?: string;
};

export function TextField({ label, hint, error, optional, name, value, onChange, max, placeholder, autoComplete = "off" }: TextProps) {
  const id = useId();
  return (
    <div className="ui-field">
      <Label htmlFor={id} label={label} optional={optional} counter={<Counter length={value.length} max={max} />} />
      {hint ? <p id={`${id}-hint`} className="ui-hint">{hint}</p> : null}
      <input
        id={id}
        name={name}
        className="ui-input"
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        maxLength={max * 2}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

export function TextAreaField({ label, hint, error, optional, name, value, onChange, max, placeholder }: TextProps) {
  const id = useId();
  return (
    <div className="ui-field">
      <Label htmlFor={id} label={label} optional={optional} counter={<Counter length={value.length} max={max} />} />
      {hint ? <p id={`${id}-hint`} className="ui-hint">{hint}</p> : null}
      <textarea
        id={id}
        name={name}
        className="ui-textarea"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        maxLength={max * 2}
        rows={4}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

type TagProps = FieldBase & {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxItems: number;
  maxLength: number;
  placeholder?: string;
  suggestions?: string[];
};

/** Free text tags: type and press Enter or comma, or pick a suggestion. */
export function TagField({ label, hint, error, optional, name, values, onChange, maxItems, maxLength, placeholder, suggestions = [] }: TagProps) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const full = values.length >= maxItems;
  const has = (tag: string) => values.some((v) => v.toLowerCase() === tag.toLowerCase());

  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, maxLength);
    if (!tag || has(tag) || full) return;
    onChange([...values, tag]);
  };

  const openSuggestions = suggestions.filter((s) => !has(s));

  return (
    <div className="ui-field">
      <Label htmlFor={id} label={label} optional={optional} />
      {hint ? <p id={`${id}-hint`} className="ui-hint">{hint}</p> : null}

      {values.length ? (
        <ul className="ui-tags" aria-label={`${label}: ${values.length} added`}>
          {values.map((tag) => (
            <li key={tag} className="ui-tag">
              {tag}
              <button type="button" onClick={() => onChange(values.filter((v) => v !== tag))} aria-label={`Remove ${tag}`}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input
          id={id}
          name={name}
          className="ui-input"
          value={draft}
          placeholder={full ? `That's the most you can add (${maxItems})` : placeholder}
          disabled={full}
          autoComplete="off"
          onChange={(e) => {
            const value = e.target.value;
            if (value.includes(",")) {
              value.split(",").slice(0, -1).forEach(add);
              setDraft(value.split(",").at(-1) ?? "");
            } else {
              setDraft(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
        />
        <button
          type="button"
          className="ui-button"
          onClick={() => {
            add(draft);
            setDraft("");
          }}
          disabled={full || !draft.trim()}
        >
          Add
        </button>
      </div>

      {openSuggestions.length && !full ? (
        <div className="ui-suggestions">
          <span className="ui-hint">Suggestions:</span>
          {openSuggestions.map((s) => (
            <button key={s} type="button" className="ui-suggestion" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      ) : null}

      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

type ToggleProps = FieldBase & {
  name: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  maxItems?: number;
  /** Options that are always selected and can't be unticked. */
  locked?: string[];
};

/** A set of checkbox chips inside a fieldset. */
export function ToggleGroupField({ label, hint, error, optional, name, options, values, onChange, maxItems, locked = [] }: ToggleProps) {
  const id = useId();
  const full = maxItems !== undefined && values.length >= maxItems;
  return (
    <fieldset
      className="ui-field"
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(hint && `${id}-hint`, `${id}-status`, error && `${id}-error`)}
    >
      <legend className="ui-label">
        <span>
          {label} {optional ? <span className="ui-label__optional">(optional)</span> : null}
        </span>
        {maxItems ? (
          <span className="ui-counter" id={`${id}-status`} aria-live="polite">
            {values.length} of {maxItems} picked
          </span>
        ) : null}
      </legend>
      {hint ? <p id={`${id}-hint`} className="ui-hint">{hint}</p> : null}
      <div className="ui-toggles">
        {options.map((option) => {
          const checked = values.includes(option);
          const isLocked = locked.includes(option);
          return (
            <label key={option} className="ui-toggle">
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={checked}
                disabled={isLocked || (!checked && full)}
                onChange={() => onChange(checked ? values.filter((v) => v !== option) : [...values, option])}
              />
              {option}
              {isLocked ? <span className="visually-hidden"> (always included)</span> : null}
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </fieldset>
  );
}

/** A small "add your own" input that sits under a set of toggle chips. */
export function CustomAdder({
  label,
  onAdd,
  disabled,
  maxLength,
  placeholder,
}: {
  label: string;
  onAdd: (value: string) => void;
  disabled?: boolean;
  maxLength: number;
  placeholder?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const submit = () => {
    const value = draft.trim().replace(/\s+/g, " ").slice(0, maxLength);
    if (value) onAdd(value);
    setDraft("");
  };
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        className="ui-input ui-input--small"
        style={{ width: "auto", flex: "1 1 12rem", maxWidth: "20rem" }}
        value={draft}
        placeholder={placeholder ?? label}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button type="button" className="ui-button ui-button--small" onClick={submit} disabled={disabled || !draft.trim()}>
        Add
      </button>
    </div>
  );
}

type ChoiceProps<T extends string> = FieldBase & {
  name: string;
  options: { value: T; label: string; description?: string; visual?: ReactNode }[];
  value: T | "";
  onChange: (value: T) => void;
  className?: string;
  optionClassName?: string;
};

/** Radio buttons rendered as cards, for choices that benefit from a picture. */
export function ChoiceField<T extends string>({ label, hint, error, name, options, value, onChange, className, optionClassName }: ChoiceProps<T>) {
  const id = useId();
  return (
    <fieldset
      className="ui-field"
      aria-describedby={describedBy(hint && `${id}-hint`, error && `${id}-error`)}
    >
      <legend className="ui-label">{label}</legend>
      {hint ? <p id={`${id}-hint`} className="ui-hint">{hint}</p> : null}
      <div className={className}>
        {options.map((option) => (
          <label key={option.value} className={optionClassName} data-checked={value === option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.visual}
            <span data-part="label">{option.label}</span>
            {option.description ? <span data-part="description">{option.description}</span> : null}
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </fieldset>
  );
}
