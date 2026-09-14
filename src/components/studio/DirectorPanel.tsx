"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { BriefDraft } from "@/lib/brief";
import type { Direction } from "@/lib/direction";
import { CHANGE_TYPE_LABELS, commandById, diffRows, proposalJson, type ChangeType } from "@/lib/refinement";
import { askDirector, changesToApply, SUGGESTIONS } from "@/state/director";
import { applyBrandChanges, type BrandState, type DirectorMessage } from "@/state/project";
import { dispatch } from "@/state/project-store";
import styles from "./DirectorPanel.module.css";

type Props = {
  brand: BrandState;
  brief: BriefDraft;
  previewing: boolean;
  onPreviewChange: (on: boolean) => void;
  /** Called after a request, so the Studio can switch device or scroll to the section concerned. */
  onReply: (message: DirectorMessage) => void;
  onShow: (section: string) => void;
};

export function DirectorPanel({ brand, brief, previewing, onPreviewChange, onReply, onShow }: Props) {
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLOListElement>(null);
  const inputId = useId();
  const messages = brand.director;
  const count = messages.length;

  // Keep the newest exchange in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [count]);

  const ask = (text: string) => {
    const request = text.trim();
    if (!request) return;
    const message = askDirector(request, { direction: brand.direction, brief });
    dispatch({ type: "director/ask", message });
    setDraft("");
    onPreviewChange(true);
    onReply(message);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
      <header className={styles.header}>
        <div>
          <h2 id={`${inputId}-title`} className={styles.title}>
            Creative Director
          </h2>
          <p className={styles.subtitle}>Built-in rules, not AI yet</p>
        </div>
        {count ? (
          <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => dispatch({ type: "director/clear" })}>
            Clear
          </button>
        ) : null}
      </header>

      <ol ref={logRef} className={styles.log} aria-live="polite" aria-relevant="additions">
        {count === 0 ? (
          <li className={styles.intro}>
            <p>
              Ask for a change in plain words, like &ldquo;make it feel more premium&rdquo;. I&rsquo;ll tell you exactly what I&rsquo;d change and show it on the page before anything is saved.
            </p>
            <p className={styles.note}>
              In this version requests are matched to rules written in advance, so wording close to the suggestions below works best. Free-text requests handled by an AI model come later.
            </p>
          </li>
        ) : null}
        {messages.map((message, i) => (
          <MessageView
            key={message.id}
            message={message}
            brand={brand}
            brief={brief}
            latest={i === count - 1}
            previewing={previewing}
            onPreviewChange={onPreviewChange}
            onShow={onShow}
            onSuggest={ask}
          />
        ))}
      </ol>

      <div className={styles.composer}>
        <div className={styles.suggestions} role="group" aria-label="Suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={styles.suggestion} onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <form className={styles.form} onSubmit={submit}>
          <label htmlFor={inputId} className="visually-hidden">
            Ask the Creative Director for a change
          </label>
          <textarea
            id={inputId}
            className={styles.input}
            rows={2}
            maxLength={300}
            value={draft}
            placeholder="Ask for a change"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(draft);
              }
            }}
          />
          <button type="submit" className="ui-button ui-button--primary ui-button--small" disabled={!draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

type MessageProps = {
  message: DirectorMessage;
  brand: BrandState;
  brief: BriefDraft;
  latest: boolean;
  previewing: boolean;
  onPreviewChange: (on: boolean) => void;
  onShow: (section: string) => void;
  onSuggest: (text: string) => void;
};

function MessageView({ message, brand, brief, latest, previewing, onPreviewChange, onShow, onSuggest }: MessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { reply } = message;

  return (
    <li className={styles.exchange}>
      <p className={styles.request}>
        <span className="visually-hidden">You asked: </span>
        {message.request}
      </p>

      <div className={styles.reply} data-status={message.status}>
        <span className="visually-hidden">Creative Director: </span>

        {reply.kind === "unknown" ? (
          <>
            <p>{reply.text}</p>
            {latest ? (
              <div className={styles.inlineSuggestions}>
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button key={s} type="button" className={styles.suggestion} onClick={() => onSuggest(s)}>
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {reply.kind === "noop" ? (
          <>
            <p>{reply.text}</p>
            {reply.focus ? (
              <button type="button" className="ui-button ui-button--small" onClick={() => onShow(reply.focus as string)}>
                Show me
              </button>
            ) : null}
          </>
        ) : null}

        {reply.kind === "proposal" ? (
          <>
            <div className={styles.replyHead}>
              <span className="ui-chip">{CHANGE_TYPE_LABELS[reply.changeType as ChangeType] ?? reply.changeType}</span>
              <span className={styles.rule}>Rule: {commandById(reply.commandId)?.label}</span>
            </div>
            <p className={styles.summary}>{reply.summary}</p>
            <p className={styles.updateLabel}>{message.status === "applied" ? "I updated:" : "I'll update:"}</p>
            <ul className={styles.affected}>
              {reply.affected.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>

            <div className={styles.disclosures}>
              <button type="button" className={styles.disclosure} aria-expanded={showDetails} onClick={() => setShowDetails((s) => !s)}>
                {showDetails ? "Hide" : "Show"} every change ({diffRows(reply.changes).length})
              </button>
              <button type="button" className={styles.disclosure} aria-expanded={showJson} onClick={() => setShowJson((s) => !s)}>
                {showJson ? "Hide" : "View as"} JSON
              </button>
            </div>

            <details className={styles.why}>
              <summary>Show me why</summary>
              <p>{reply.because}</p>
            </details>

            {showDetails ? <DiffTable changes={reply.changes} /> : null}
            {showJson ? (
              <pre className={styles.json} tabIndex={0} aria-label="Proposal as JSON">
                <code>{JSON.stringify(proposalJson(reply), null, 2)}</code>
              </pre>
            ) : null}

            {message.status === "pending" ? (
              <div className={styles.actions}>
                <label className={styles.previewToggle}>
                  <input type="checkbox" checked={previewing} onChange={(e) => onPreviewChange(e.target.checked)} />
                  Preview on the page
                </label>
                <div className={styles.buttons}>
                  <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => dispatch({ type: "director/cancel", messageId: message.id })}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ui-button ui-button--primary ui-button--small"
                    onClick={() => {
                      const ctx = { direction: brand.direction, brief };
                      const changes = changesToApply(message, ctx);
                      if (!changes || !applyBrandChanges(ctx.direction, changes)) {
                        setError("The brand has changed since I suggested this, and it no longer applies. Ask again for a fresh suggestion.");
                        dispatch({ type: "director/cancel", messageId: message.id });
                        return;
                      }
                      dispatch({ type: "director/apply", messageId: message.id, label: `Creative Director: ${commandById(reply.commandId)?.label ?? "change"}`, changes });
                    }}
                  >
                    Apply changes
                  </button>
                </div>
              </div>
            ) : null}

            <StatusLine message={message} brand={brand} />
            {error ? (
              <p className="ui-error" role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

function StatusLine({ message, brand }: { message: DirectorMessage; brand: BrandState }) {
  if (message.status === "cancelled") return <p className={styles.status}>Cancelled. Nothing was changed.</p>;
  if (message.status !== "applied" || !message.editId) return null;

  const isLatest = brand.past.at(-1)?.id === message.editId;
  const undone = brand.future.some((e) => e.id === message.editId);
  const canRedo = brand.future[0]?.id === message.editId;

  if (undone) {
    return (
      <p className={styles.status}>
        <span>Undone.</span>
        {canRedo ? (
          <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => dispatch({ type: "brand/redo" })}>
            Redo
          </button>
        ) : null}
      </p>
    );
  }
  return (
    <p className={styles.status} data-applied="true">
      <span>
        <span aria-hidden="true">✓ </span>Applied.
      </span>
      {isLatest ? (
        <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => dispatch({ type: "brand/undo" })}>
          Undo
        </button>
      ) : (
        <span className={styles.later}>Undo it from the toolbar history.</span>
      )}
    </p>
  );
}

function DiffTable({ changes }: { changes: { path: string; from: unknown; to: unknown }[] }) {
  const rows = diffRows(changes);
  return (
    <div className={styles.diffWrap}>
      <table className={styles.diff}>
        <thead>
          <tr>
            <th scope="col">Area</th>
            <th scope="col">Before</th>
            <th scope="col">After</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.area}-${row.label}-${i}`}>
              <th scope="row">
                <span className={styles.diffArea}>{row.area}</span>
                {row.label}
              </th>
              <td>
                {row.colour ? <span className={styles.swatch} style={{ background: row.from }} aria-hidden="true" /> : null}
                <span className={styles.diffValue}>{row.from}</span>
              </td>
              <td>
                {row.colour ? <span className={styles.swatch} style={{ background: row.to }} aria-hidden="true" /> : null}
                <span className={styles.diffValue}>{row.to}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The brand with a pending proposal applied, for previewing on the page. Null when there's nothing to preview. */
export function previewDirection(brand: BrandState, brief: BriefDraft): Direction | null {
  const pending = brand.director.findLast((m) => m.status === "pending");
  if (!pending) return null;
  const changes = changesToApply(pending, { direction: brand.direction, brief });
  return changes ? applyBrandChanges(brand.direction, changes)?.direction ?? null : null;
}
