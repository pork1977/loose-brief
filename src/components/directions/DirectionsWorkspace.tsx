"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StageSkeleton } from "@/components/studio/StageSkeleton";
import { isDemoBrief, type DEMO_BRIEF } from "@/data/demo-brief";
import { DEMO_DIRECTIONS } from "@/data/demo-directions";
import { briefKey } from "@/lib/brief";
import { directionSetSchema, type Direction } from "@/lib/direction";
import { colorsFor } from "@/lib/tokens";
import { startDemo } from "@/state/project-actions";
import { directionsAreStale, isBriefDone, selectedDirection } from "@/state/progress";
import { dispatch, useProject } from "@/state/project-store";
import { useLiveStatus } from "@/lib/live/client";
import { CompareDialog } from "./CompareDialog";
import { LiveDirections } from "./LiveDirections";
import { DirectionCard } from "./DirectionCard";
import { GeneratingDirections } from "./GeneratingDirections";
import { IdentityCanvas, type CanvasMode } from "./IdentityCanvas";
import styles from "./DirectionsWorkspace.module.css";

/** Store the built-in set, validated against the same schema live output will face. */
function storeDemoDirections(brief: typeof DEMO_BRIEF) {
  const items = directionSetSchema.parse(structuredClone(DEMO_DIRECTIONS));
  dispatch({
    type: "directions/set",
    directions: { source: "demo", briefKey: briefKey(brief), createdAt: new Date().toISOString(), items },
  });
}

export function DirectionsWorkspace() {
  const project = useProject();
  const router = useRouter();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<CanvasMode | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const live = useLiveStatus();

  const onGenerated = useCallback(() => {
    if (project) storeDemoDirections(project.state.brief);
  }, [project]);

  if (!project) return <StageSkeleton label="Loading your directions" />;

  const { state } = project;
  const brandName = state.brief.name.trim();

  if (!isBriefDone(state)) {
    return (
      <EmptyState title="Finish the brief first" action={<ButtonLink href="/brief" variant="primary" transitionTypes={["nav-back"]}>&larr; Go to the brief</ButtonLink>}>
        Directions are built from your brief, so there&rsquo;s nothing to show yet. It takes a few minutes, or you can
        load the Ebbfield demo brief to see how it works.
      </EmptyState>
    );
  }

  const demo = isDemoBrief(state.brief);

  const storeLive = (items: Direction[], model: string) =>
    dispatch({ type: "directions/set", directions: { source: "live", model, briefKey: briefKey(state.brief), createdAt: new Date().toISOString(), items } });

  const demoConfirm = (
    <ConfirmDialog
      open={confirmDemo}
      title="Replace your brief with the demo?"
      body="Your answers and any files you've added will be replaced by the Ebbfield demo brief."
      confirmLabel="Load the demo"
      onCancel={() => setConfirmDemo(false)}
      onConfirm={() => {
        setConfirmDemo(false);
        void startDemo();
      }}
    />
  );

  if (!state.directions) {
    if (demo) return <GeneratingDirections brandName={brandName} colours={DEMO_DIRECTIONS.map((d) => colorsFor(d.tokens).button.primary)} onDone={onGenerated} />;
    if (live === null) return <StageSkeleton label="Checking whether live generation is on" />;
    if (live) {
      return (
        <div className={styles.workspace}>
          <header className={styles.header}>
            <div className={styles.headerText}>
              <p className="ui-eyebrow">Stage 02 / Directions</p>
              <h1 className={styles.title}>Directions for {brandName}</h1>
            </div>
          </header>
          <LiveDirections
            brief={state.brief}
            startLabel="Generate three directions with Claude"
            intro={
              <p>
                Claude will read your brief and write three different directions for {brandName}, each with its own colours, type, voice and homepage copy.
              </p>
            }
            secondary={
              <>
                <ButtonLink href="/brief" variant="ghost" transitionTypes={["nav-back"]}>
                  Edit your brief
                </ButtonLink>
                <button type="button" className="ui-button ui-button--ghost" onClick={() => setConfirmDemo(true)}>
                  Try the Ebbfield demo instead
                </button>
              </>
            }
            onDone={storeLive}
          />
          {demoConfirm}
        </div>
      );
    }
    return (
      <>
        <EmptyState
          title="Your own brief needs live generation"
          action={
            <div className={styles.emptyActions}>
              <button type="button" className="ui-button ui-button--primary" onClick={() => setConfirmDemo(true)}>
                Try the Ebbfield demo instead
              </button>
              <ButtonLink href="/brief" variant="ghost" transitionTypes={["nav-back"]}>
                Edit your brief
              </ButtonLink>
            </div>
          }
        >
          Turning a brief like yours into directions uses Claude, and live generation isn&rsquo;t switched on here at the moment. Your
          brief is saved. For now the demo shows the whole journey with a made-up company.
        </EmptyState>
        {demoConfirm}
      </>
    );
  }

  const directions = state.directions.items;
  const selected = selectedDirection(state);
  const stale = directionsAreStale(state);
  const active = directions.find((d) => d.id === hoverId) ?? selected ?? directions[0];
  const mode: CanvasMode = canvasMode ?? (selected && active.id === selected.id ? "system" : "constellation");
  const comparePair =
    compareIds.length === 2 ? (compareIds.map((id) => directions.find((d) => d.id === id)).filter(Boolean) as [Direction, Direction]) : null;

  const select = (id: string, confirmed = false) => {
    // Switching away from a direction you've already edited throws those edits away, so ask first.
    const brand = state.brand;
    if (!confirmed && brand && brand.sourceId !== id && brand.past.length > 0) {
      setPendingSwitch(id);
      return;
    }
    dispatch({ type: "direction/select", id });
    // The canvas regroups inside a transition, so its named nodes animate to their new places.
    startTransition(() => {
      setHoverId(id);
      setCanvasMode("system");
    });
  };

  const showOnCanvas = (id: string) => {
    if (id === active.id) return;
    setHoverId(id);
    setCanvasMode(null);
  };

  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < 2 ? [...ids, id] : ids));

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className="ui-eyebrow">Stage 02 / Directions</p>
          <h1 className={styles.title}>Three directions for {brandName}</h1>
          <p className={styles.intro}>
            Each one is a complete route: colour, type, voice, imagery and motion, with its reasoning. Pick the one to
            build on, or compare two side by side.
          </p>
        </div>
        <div className={styles.headerMeta}>
          {state.directions.source === "demo" ? <span className="ui-chip">Demo directions, written in advance</span> : <span className="ui-chip">Generated by Claude</span>}
          <Link href="/brief" className={styles.editLink} transitionTypes={["nav-back"]}>
            Edit brief
          </Link>
          {!demo && live && !regenerating && !stale ? (
            <button type="button" className={styles.editLink} onClick={() => setRegenerating(true)}>
              Regenerate
            </button>
          ) : null}
        </div>
      </header>

      {regenerating ? (
        <section className={styles.regenerate} aria-label="Regenerate with Claude">
          <LiveDirections
            brief={state.brief}
            startLabel="Regenerate with Claude"
            intro={
              <p>
                This replaces the three directions below with new ones for your brief as it is now
                {state.brand && state.brand.past.length ? ", and the changes you've made to your chosen direction will be lost" : ""}.
              </p>
            }
            secondary={
              <button type="button" className="ui-button ui-button--ghost" onClick={() => setRegenerating(false)}>
                Keep these directions
              </button>
            }
            onDone={(items, model) => {
              setRegenerating(false);
              setHoverId(null);
              setCanvasMode(null);
              storeLive(items, model);
            }}
          />
        </section>
      ) : stale ? (
        <div className="ui-notice" role="status">
          <p>
            Your brief has changed since these directions were made.{" "}
            {demo
              ? "Regenerating brings back the demo set."
              : live
                ? "Claude can write new ones for the brief as it is now."
                : "New directions for your own brief need live generation, which isn't switched on here at the moment."}
          </p>
          {demo ? (
            <button type="button" className="ui-button ui-button--small" onClick={() => storeDemoDirections(state.brief)}>
              Regenerate
            </button>
          ) : live ? (
            <button type="button" className="ui-button ui-button--small" onClick={() => setRegenerating(true)}>
              Regenerate with Claude
            </button>
          ) : null}
        </div>
      ) : null}

      <section className={styles.canvasSection} aria-labelledby="canvas-title">
        <div className={styles.canvasHeader}>
          <h2 id="canvas-title" className={styles.sectionTitle}>
            Identity canvas
          </h2>
          <div className={styles.canvasTabs} role="group" aria-label="Show a direction on the canvas">
            {directions.map((d) => (
              <button
                key={d.id}
                type="button"
                className={styles.canvasTab}
                aria-pressed={active.id === d.id}
                onClick={() => showOnCanvas(d.id)}
              >
                <span aria-hidden="true">{d.letter}</span> {d.name}
                {selected?.id === d.id ? <span className={styles.tabSelected}> (selected)</span> : null}
              </button>
            ))}
          </div>
        </div>
        <IdentityCanvas brandName={brandName} traits={state.brief.personality} direction={active} mode={mode} />
      </section>

      <section aria-labelledby="cards-title">
        <h2 id="cards-title" className="visually-hidden">
          The three directions
        </h2>
        <div className={styles.cards}>
          {directions.map((d) => (
            <DirectionCard
              key={d.id}
              brandName={brandName}
              direction={d}
              selected={selected?.id === d.id}
              comparing={compareIds.includes(d.id)}
              compareDisabled={compareIds.length >= 2}
              onSelect={() => select(d.id)}
              onToggleCompare={() => toggleCompare(d.id)}
              onFocusDirection={() => showOnCanvas(d.id)}
            />
          ))}
        </div>
      </section>

      {compareIds.length || selected ? (
        <div className={styles.dock} role="region" aria-label="Next steps">
          {compareIds.length ? (
            <div className={styles.dockGroup}>
              <p className={styles.dockText}>
                {compareIds.length === 1 ? "Pick one more direction to compare." : "Two directions ready to compare."}
              </p>
              <button type="button" className="ui-button ui-button--small" disabled={compareIds.length < 2} onClick={() => setCompareOpen(true)}>
                Compare
              </button>
              <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => setCompareIds([])}>
                Clear
              </button>
            </div>
          ) : null}
          {selected ? (
            <div className={styles.dockGroup}>
              <p className={styles.dockText}>
                <strong>{selected.name}</strong> selected.
              </p>
              <button
                type="button"
                className="ui-button ui-button--primary ui-button--small"
                onClick={() => router.push("/brand-system", { transitionTypes: ["nav-forward"] })}
              >
                Continue to brand system <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Switch direction?"
        body={`You've made ${state.brand?.past.length ?? 0} change${state.brand?.past.length === 1 ? "" : "s"} to ${
          directions.find((d) => d.id === state.brand?.sourceId)?.name ?? "your current direction"
        } in the brand system. Switching starts again from the new direction, and those changes will be lost.`}
        confirmLabel="Switch and lose changes"
        destructive
        onCancel={() => setPendingSwitch(null)}
        onConfirm={() => {
          const id = pendingSwitch;
          setPendingSwitch(null);
          if (id) select(id, true);
        }}
      />

      <CompareDialog
        open={compareOpen}
        brandName={brandName}
        directions={comparePair}
        selectedId={selected?.id ?? null}
        onSelect={(id) => select(id)}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  );
}

function EmptyState({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={styles.empty}>
      <p className="ui-eyebrow">Stage 02 / Directions</p>
      <h1 className={styles.emptyTitle}>{title}</h1>
      <p className={styles.emptyBody}>{children}</p>
      {action}
    </div>
  );
}
