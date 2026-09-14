"use client";

import { useCallback, useRef, useState } from "react";
import { Segmented, useUndoShortcuts } from "@/components/brand-system/controls";
import { ButtonLink } from "@/components/ui/Button";
import type { SiteTarget } from "@/components/website/WebsiteContext";
import { dispatch, useProject } from "@/state/project-store";
import { SectionRail } from "./SectionRail";
import { StudioCanvas, VIEWPORTS, type CanvasApi, type Viewport } from "./StudioCanvas";
import styles from "./StudioWorkspace.module.css";

export function StudioWorkspace() {
  const project = useProject();
  if (!project?.state.brand) {
    return (
      <p className="visually-hidden" role="status">
        Loading your studio
      </p>
    );
  }
  return <Workspace />;
}

function Workspace() {
  const project = useProject();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [compare, setCompare] = useState(false);
  // The section list starts open beside the site on wide screens, and closed above it on narrow ones.
  // This only renders in the browser (the project loads client-side), so window is available.
  const [railOpen, setRailOpen] = useState(() => window.matchMedia("(min-width: 64rem)").matches);
  const canvases = useRef<{ before: CanvasApi | null; after: CanvasApi | null }>({ before: null, after: null });

  useUndoShortcuts();

  const setAfterApi = useCallback((api: CanvasApi) => {
    canvases.current.after = api;
  }, []);
  const setBeforeApi = useCallback((api: CanvasApi) => {
    canvases.current.before = api;
  }, []);
  // In before-and-after mode the two sites scroll together.
  const syncFromAfter = useCallback((ratio: number) => canvases.current.before?.setScrollRatio(ratio), []);
  const syncFromBefore = useCallback((ratio: number) => canvases.current.after?.setScrollRatio(ratio), []);

  const brand = project?.state.brand;
  if (!project || !brand) return null;

  const { direction, previewMode, past, future } = brand;
  const source = project.state.directions?.items.find((d) => d.id === brand.sourceId) ?? null;
  const brandName = project.state.brief.name.trim();
  const unchanged = !source || JSON.stringify(source) === JSON.stringify(direction);
  const comparing = compare && !unchanged && source !== null;
  const lastEdit = past.at(-1);

  const jump = (target: SiteTarget) => {
    canvases.current.after?.goTo(target, true);
    if (comparing) canvases.current.before?.goTo(target);
  };

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className="ui-eyebrow">Stage 04 / Studio</p>
          <h1 className={styles.title}>{brandName} homepage</h1>
          <p className={styles.intro}>
            A working page built from your brand system. Click around it, switch devices, and edit any section from the list.
          </p>
        </div>
        <div className={styles.toolbar} role="toolbar" aria-label="Studio">
          <Segmented
            label="Device"
            hideLabel
            value={viewport}
            options={(Object.keys(VIEWPORTS) as Viewport[]).map((v) => ({ value: v, label: VIEWPORTS[v].label }))}
            onChange={setViewport}
          />
          <Segmented
            label="Colour mode"
            hideLabel
            value={previewMode}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(mode) => dispatch({ type: "brand/setPreviewMode", mode })}
          />
          <label className={styles.compareToggle} data-disabled={unchanged}>
            <input type="checkbox" checked={comparing} disabled={unchanged} onChange={(e) => setCompare(e.target.checked)} />
            <span>Before and after</span>
          </label>
          <div className={styles.history}>
            <button
              type="button"
              className="ui-button ui-button--small"
              onClick={() => dispatch({ type: "brand/undo" })}
              disabled={!past.length}
              aria-keyshortcuts="Control+Z Meta+Z"
              title={lastEdit ? `Undo: ${lastEdit.label}` : "Nothing to undo"}
            >
              Undo
            </button>
            <button
              type="button"
              className="ui-button ui-button--small"
              onClick={() => dispatch({ type: "brand/redo" })}
              disabled={!future.length}
              aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
              title={future[0] ? `Redo: ${future[0].label}` : "Nothing to redo"}
            >
              Redo
            </button>
          </div>
          <ButtonLink href="/export" variant="primary" size="small" transitionTypes={["nav-forward"]}>
            Continue to export <span aria-hidden="true">&rarr;</span>
          </ButtonLink>
        </div>
      </header>

      <p className={styles.status} role="status" aria-live="polite">
        {unchanged
          ? `Showing ${source?.name ?? direction.name} as generated. Before and after becomes available once you change something.`
          : lastEdit
            ? `Last change: ${lastEdit.label}.`
            : "Edited in the brand system."}
      </p>

      <div className={styles.columns}>
        <details className={styles.railWrap} open={railOpen} onToggle={(e) => setRailOpen(e.currentTarget.open)}>
          <summary className={styles.railSummary}>Sections</summary>
          <SectionRail direction={direction} onJump={jump} />
        </details>

        <div className={styles.stage} data-compare={comparing}>
          {comparing && source ? (
            <div className={styles.pane}>
              <p className={styles.paneLabel}>Before: {source.name} as generated</p>
              <div className={styles.canvasBox}>
                <StudioCanvas
                  brandName={brandName}
                  direction={source}
                  mode={previewMode}
                  viewport={viewport}
                  label={`${brandName} homepage before your changes`}
                  onApi={setBeforeApi}
                  onScrollRatio={syncFromBefore}
                />
              </div>
            </div>
          ) : null}
          <div className={styles.pane}>
            {comparing ? <p className={styles.paneLabel}>After: with your changes</p> : null}
            <div className={styles.canvasBox}>
              <StudioCanvas
                brandName={brandName}
                direction={direction}
                mode={previewMode}
                viewport={viewport}
                label={`${brandName} homepage preview, ${VIEWPORTS[viewport].label.toLowerCase()} width. Scroll within it to explore.`}
                onApi={setAfterApi}
                onScrollRatio={comparing ? syncFromAfter : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.pager} aria-label="Stage navigation">
        <ButtonLink href="/brand-system" variant="ghost" transitionTypes={["nav-back"]}>
          <span aria-hidden="true">&larr;</span> Brand system
        </ButtonLink>
        <ButtonLink href="/export" variant="primary" transitionTypes={["nav-forward"]}>
          Continue to export <span aria-hidden="true">&rarr;</span>
        </ButtonLink>
      </nav>
    </div>
  );
}
