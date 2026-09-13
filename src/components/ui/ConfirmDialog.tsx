"use client";

import { useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

/**
 * Uses the native <dialog> element: it traps focus, closes on Escape and
 * returns focus to whatever opened it, without any extra code.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, destructive }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-dialog"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <div className="ui-dialog__body">
        <h2 id={titleId} className="ui-dialog__title">
          {title}
        </h2>
        <p id={bodyId} className="ui-hint" style={{ fontSize: "var(--ui-text-s)" }}>
          {body}
        </p>
      </div>
      <div className="ui-dialog__actions">
        <button type="button" className="ui-button ui-button--ghost" onClick={onCancel} autoFocus>
          Cancel
        </button>
        <button
          type="button"
          className={`ui-button ${destructive ? "" : "ui-button--primary"}`}
          style={destructive ? { borderColor: "var(--ui-color-error)", color: "var(--ui-color-error)" } : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
