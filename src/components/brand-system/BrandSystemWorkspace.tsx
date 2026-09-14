"use client";

import { useCallback, useEffect, useId, useRef, useState, ViewTransition, type KeyboardEvent } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { ScaledPreview } from "@/components/brand/ScaledPreview";
import { Website } from "@/components/website/Website";
import { SiteMediaContext } from "@/components/website/WebsiteContext";
import { EMPTY_BRIEF } from "@/lib/brief";
import { useSiteMediaUrls } from "@/lib/site-media";
import { ButtonLink } from "@/components/ui/Button";
import { dispatch, useProject } from "@/state/project-store";
import { ColoursTab } from "./ColoursTab";
import { ComponentsTab } from "./ComponentsTab";
import { InspectContext, Segmented, useUndoShortcuts } from "./controls";
import { HealthMeter, OverviewTab, TokensTab } from "./OverviewTokensTabs";
import { TypeTab } from "./TypeTab";
import { ImageryTab, VoiceTab } from "./VoiceImageryTabs";
import styles from "./BrandSystemWorkspace.module.css";

const TABS = ["Overview", "Colours", "Type", "Voice", "Imagery", "Components", "Tokens"] as const;
type Tab = (typeof TABS)[number];

function initialTab(): Tab {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return TABS.find((t) => t.toLowerCase() === hash.toLowerCase()) ?? "Overview";
}

export function BrandSystemWorkspace() {
  const project = useProject();

  if (!project?.state.brand) {
    return (
      <p className="visually-hidden" role="status">
        Loading your brand
      </p>
    );
  }
  return <Workspace />;
}

function Workspace() {
  const project = useProject();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [highlighted, setHighlighted] = useState<string[] | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const tabIds = useId();

  const brand = project?.state.brand;
  const source = project?.state.directions?.items.find((d) => d.id === brand?.sourceId);

  useUndoShortcuts();

  // Light up the parts of the preview that read the hovered tokens.
  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    root.querySelectorAll("[data-inspect-hit]").forEach((el) => el.removeAttribute("data-inspect-hit"));
    if (!highlighted?.length) return;
    const selector = highlighted.map((name) => `[data-tokens~="${name}"]`).join(",");
    root.querySelectorAll(selector).forEach((el) => el.setAttribute("data-inspect-hit", "true"));
  }, [highlighted, brand?.direction]);

  const highlight = useCallback((tokens: string[] | null) => setHighlighted(tokens), []);

  const media = useSiteMediaUrls(project?.state.brief ?? EMPTY_BRIEF);
  if (!brand || !project) return null;
  const { direction, previewMode, past, future } = brand;
  const brandName = project.state.brief.name.trim();
  const lastEdit = past.at(-1);

  const selectTab = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next.toLowerCase()}`);
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.indexOf(tab);
    const move = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: TABS.length - 1 - index }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    const next = TABS[(index + move + TABS.length) % TABS.length];
    selectTab(next);
    document.getElementById(`${tabIds}-tab-${next}`)?.focus();
  };

  return (
    <InspectContext.Provider value={{ highlight }}>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className="ui-eyebrow">Stage 03 / Brand system</p>
            <h1 className={styles.title}>{brandName} brand system</h1>
            <p className={styles.intro}>
              Built on Direction {direction.letter}: {source?.name ?? direction.name}.{" "}
              <ButtonLink href="/directions" variant="ghost" size="small" transitionTypes={["nav-back"]}>
                Change direction
              </ButtonLink>
            </p>
          </div>

          <div className={styles.toolbar} role="toolbar" aria-label="Brand system">
            <Segmented
              label="Preview mode"
              hideLabel
              value={previewMode}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              onChange={(mode) => dispatch({ type: "brand/setPreviewMode", mode })}
            />
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
              <button
                type="button"
                className="ui-button ui-button--ghost ui-button--small"
                onClick={() => dispatch({ type: "brand/reset" })}
                disabled={!source || JSON.stringify(source) === JSON.stringify(direction)}
              >
                Reset
              </button>
            </div>
            <ButtonLink href="/studio" variant="primary" size="small" transitionTypes={["nav-forward"]}>
              Continue to studio <span aria-hidden="true">&rarr;</span>
            </ButtonLink>
          </div>
        </header>

        <p className={styles.lastEdit} role="status" aria-live="polite">
          {lastEdit ? (
            <>
              Last change: <strong>{lastEdit.label}</strong>. {past.length} change{past.length === 1 ? "" : "s"} you can undo.
            </>
          ) : (
            "No changes yet. Everything here is editable, and every change can be undone."
          )}
        </p>

        <div className={styles.mobileSwitch}>
          <Segmented
            label="Show"
            hideLabel
            value={mobileView}
            options={[
              { value: "edit", label: "Edit" },
              { value: "preview", label: "Preview" },
            ]}
            onChange={setMobileView}
          />
        </div>

        <div className={styles.columns} data-mobile-view={mobileView}>
          <div className={styles.editor}>
            <div className={styles.tabs} role="tablist" aria-label="Brand system sections">
              {TABS.map((t) => (
                <button
                  key={t}
                  id={`${tabIds}-tab-${t}`}
                  type="button"
                  role="tab"
                  className={styles.tab}
                  aria-selected={tab === t}
                  aria-controls={`${tabIds}-panel`}
                  tabIndex={tab === t ? 0 : -1}
                  onClick={() => selectTab(t)}
                  onKeyDown={onTabKey}
                >
                  {t}
                </button>
              ))}
            </div>
            <div id={`${tabIds}-panel`} role="tabpanel" aria-labelledby={`${tabIds}-tab-${tab}`} className={styles.panel} tabIndex={0}>
              {tab === "Overview" ? <OverviewTab direction={direction} brandName={brandName} mode={previewMode} sourceName={source?.name ?? direction.name} /> : null}
              {tab === "Colours" ? <ColoursTab direction={direction} mode={previewMode} /> : null}
              {tab === "Type" ? <TypeTab direction={direction} mode={previewMode} /> : null}
              {tab === "Voice" ? <VoiceTab direction={direction} /> : null}
              {tab === "Imagery" ? <ImageryTab direction={direction} mode={previewMode} /> : null}
              {tab === "Components" ? <ComponentsTab direction={direction} mode={previewMode} /> : null}
              {tab === "Tokens" ? <TokensTab direction={direction} mode={previewMode} brandName={brandName} /> : null}
            </div>
          </div>

          <aside className={styles.previewColumn} aria-label="Live preview">
            <div className={styles.previewHeader}>
              <p className="ui-panel__title">Live preview &middot; {previewMode}</p>
              <HealthMeter direction={direction} compact />
            </div>
            <div className={styles.previewScroll}>
              <BrandScope tokens={direction.tokens} mode={previewMode} className={styles.previewScope}>
                <ViewTransition name={`direction-preview-${brand.sourceId}`} share="auto" default="none">
                  <div>
                    <ScaledPreview designWidth={1200} label={`${brandName} homepage preview in ${previewMode} mode`} onContentElement={(node) => { previewRef.current = node; }}>
                      <SiteMediaContext.Provider value={media}>
                        <Website brandName={brandName} direction={direction} />
                      </SiteMediaContext.Provider>
                    </ScaledPreview>
                  </div>
                </ViewTransition>
              </BrandScope>
            </div>
            <p className={styles.previewNote}>A picture of the homepage. Try it out, and change its words, in the Studio.</p>
          </aside>
        </div>

        <nav className={styles.pager} aria-label="Stage navigation">
          <ButtonLink href="/directions" variant="ghost" transitionTypes={["nav-back"]}>
            <span aria-hidden="true">&larr;</span> Directions
          </ButtonLink>
          <ButtonLink href="/studio" variant="primary" transitionTypes={["nav-forward"]}>
            Continue to studio <span aria-hidden="true">&rarr;</span>
          </ButtonLink>
        </nav>
      </div>
    </InspectContext.Provider>
  );
}
