"use client";

import { useCallback, useRef, useState } from "react";
import { Segmented, useUndoShortcuts } from "@/components/brand-system/controls";
import { ButtonLink } from "@/components/ui/Button";
import { SiteMediaContext, type SiteTarget } from "@/components/website/WebsiteContext";
import { EMPTY_BRIEF } from "@/lib/brief";
import { useSiteMediaUrls } from "@/lib/site-media";
import type { DirectorMessage } from "@/state/project";
import { dispatch, useProject } from "@/state/project-store";
import { DirectorPanel, previewDirection } from "./DirectorPanel";
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
  // This only renders in the browser (the project loads client-side), so window is available.
  // On a phone a desktop-width frame is too small to read, so start with the mobile one.
  const [viewport, setViewport] = useState<Viewport>(() => (window.matchMedia("(max-width: 47.99rem)").matches ? "mobile" : "desktop"));
  const [compare, setCompare] = useState(false);
  // The section list starts open beside the site on wide screens, and closed above it on narrow ones.
  const [railOpen, setRailOpen] = useState(() => window.matchMedia("(min-width: 90rem)").matches);
  const [previewing, setPreviewing] = useState(true);
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
  const media = useSiteMediaUrls(project?.state.brief ?? EMPTY_BRIEF);
  if (!project || !brand) return null;

  const { direction, previewMode, past, future } = brand;
  const source = project.state.directions?.items.find((d) => d.id === brand.sourceId) ?? null;
  const brandName = project.state.brief.name.trim();
  const unchanged = !source || JSON.stringify(source) === JSON.stringify(direction);
  const lastEdit = past.at(-1);

  const jump = (target: SiteTarget) => {
    canvases.current.after?.goTo(target, true);
    if (comparing) canvases.current.before?.goTo(target);
  };

  // A suggestion waiting for Apply or Cancel is shown on the page, unless the preview is switched off.
  const proposed = previewDirection(brand, project.state.brief);
  const shown = previewing && proposed ? proposed : direction;
  // With a suggestion showing, before and after compares the page now against the suggestion.
  // Otherwise it compares the direction as generated against your edits.
  const suggestionCompare = previewing && proposed !== null;
  const beforeDirection = suggestionCompare ? direction : unchanged ? null : source;
  const beforeLabel = suggestionCompare ? "Before: as it is now" : `Before: ${source?.name ?? direction.name} as generated`;
  const afterLabel = suggestionCompare ? "After: with the suggestion" : "After: with your changes";
  const comparing = compare && beforeDirection !== null;

  const onReply = (message: DirectorMessage) => {
    const reply = message.reply;
    if (reply.kind === "proposal" && reply.viewport) setViewport(reply.viewport);
    const focus = reply.kind === "unknown" ? null : reply.focus;
    // Give the page a moment to render the preview before scrolling to it.
    if (focus) window.setTimeout(() => jump(focus as SiteTarget), 350);
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
          <label className={styles.compareToggle} data-disabled={!beforeDirection}>
            <input type="checkbox" checked={comparing} disabled={!beforeDirection} onChange={(e) => setCompare(e.target.checked)} />
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
          {/* Below the two-column layout the panel sits under a tall preview, so offer a way down to it. */}
          <a href="#creative-director" className={`ui-button ui-button--small ${styles.directorJump}`}>
            Creative Director <span aria-hidden="true">&darr;</span>
          </a>
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

        <SiteMediaContext.Provider value={media}>
        <div className={styles.stage} data-compare={comparing}>
          {previewing && proposed ? (
            <p className={styles.previewBanner} role="status">
              Previewing a suggested change. Apply or cancel it in the Creative Director.
            </p>
          ) : null}
          {comparing && beforeDirection ? (
            <div className={styles.pane}>
              <p className={styles.paneLabel}>{beforeLabel}</p>
              <div className={styles.canvasBox}>
                <StudioCanvas
                  brandName={brandName}
                  direction={beforeDirection}
                  mode={previewMode}
                  viewport={viewport}
                  label={`${brandName} homepage: ${beforeLabel}`}
                  onApi={setBeforeApi}
                  onScrollRatio={syncFromBefore}
                />
              </div>
            </div>
          ) : null}
          <div className={styles.pane}>
            {comparing ? <p className={styles.paneLabel}>{afterLabel}</p> : null}
            <div className={styles.canvasBox}>
              <StudioCanvas
                brandName={brandName}
                direction={shown}
                mode={previewMode}
                viewport={viewport}
                label={`${brandName} homepage preview, ${VIEWPORTS[viewport].label.toLowerCase()} width. Scroll within it to explore.`}
                onApi={setAfterApi}
                onScrollRatio={comparing ? syncFromAfter : undefined}
              />
            </div>
          </div>
        </div>
        </SiteMediaContext.Provider>

        <div id="creative-director" className={styles.directorWrap}>
          <DirectorPanel
            brand={brand}
            brief={project.state.brief}
            previewing={previewing}
            onPreviewChange={setPreviewing}
            onReply={onReply}
            onShow={(section) => jump(section as SiteTarget)}
          />
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
