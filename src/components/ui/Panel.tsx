import { useId, type ComponentProps, type ReactNode } from "react";

type PanelProps = {
  title: string;
  actions?: ReactNode;
  /** Set false for content that manages its own padding, such as a preview canvas. */
  padded?: boolean;
} & Omit<ComponentProps<"section">, "title">;

/** A labelled workspace container. The title doubles as the region's accessible name. */
export function Panel({ title, actions, padded = true, className, children, ...props }: PanelProps) {
  const titleId = useId();
  return (
    <section
      className={["ui-panel", className].filter(Boolean).join(" ")}
      aria-labelledby={titleId}
      {...props}
    >
      <header className="ui-panel__header">
        <h2 id={titleId} className="ui-panel__title">
          {title}
        </h2>
        {actions ? <div className="ui-panel__actions">{actions}</div> : null}
      </header>
      <div className={padded ? "ui-panel__body" : undefined}>{children}</div>
    </section>
  );
}
