"use client";

import { useState, useSyncExternalStore } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { MotionPreview } from "@/components/brand/MotionPreview";
import { MOTION_PRESETS, ROUNDNESS_MAX, SHADOW_PRESETS, radiusScale } from "@/lib/brand-presets";
import type { Direction } from "@/lib/direction";
import { RADIUS_STEPS, colorsFor, spaceScale, SPACE_STEPS, type Mode, type RadiusStep } from "@/lib/tokens";
import { DraftField, EditorSection, Segmented, SliderField, brandEdit, useInspect } from "./controls";
import styles from "./tabs.module.css";

const STEP_LABELS: Record<RadiusStep, string> = { none: "Square", small: "Small", medium: "Medium", large: "Large", pill: "Pill" };
const px = (value: string) => (value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value));

export function ComponentsTab({ direction, mode }: { direction: Direction; mode: Mode }) {
  const t = direction.tokens;
  const colours = colorsFor(t, mode);
  const scale = spaceScale(t);
  const currentShadow = SHADOW_PRESETS.find((p) => p.build(colours) === t.shadow.card)?.id;
  const currentMotion = MOTION_PRESETS.find((p) => JSON.stringify(p.motion) === JSON.stringify(t.motion))?.id;

  return (
    <div className={styles.tab}>
      <EditorSection title="Components" description="Built only from tokens. Hover a control to see which of these it touches.">
        <BrandScope tokens={t} mode={mode} className={styles.gallery}>
          <ComponentGallery direction={direction} />
        </BrandScope>
      </EditorSection>

      <EditorSection
        title="Corners"
        description="One roundness setting for the whole brand. It makes three sizes of corner in proportion: small for inputs, tags and icons, and medium or large for whichever buttons and cards pick."
      >
        <SliderField
          label="Roundness"
          value={Math.min(ROUNDNESS_MAX, px(t.radius.medium))}
          min={0}
          max={ROUNDNESS_MAX}
          step={1}
          format={(v) => {
            const s = radiusScale(v);
            return `Small ${s.small} · Medium ${s.medium} · Large ${s.large}`;
          }}
          inspect={["--radius-small", "--radius-button", "--radius-card"]}
          onChange={(v) => brandEdit("Roundness", [{ path: "tokens.radius", value: { ...t.radius, ...radiusScale(v) } }], "roundness")}
        />
        <div className={styles.cornerSamples} aria-hidden="true">
          {(["small", "medium", "large"] as const).map((step) => (
            <span key={step} className={styles.cornerSample} style={{ borderRadius: t.radius[step] }}>
              {STEP_LABELS[step]}
            </span>
          ))}
        </div>
        <div className={styles.controlRow}>
          <Segmented
            label="Buttons use"
            value={t.radius.button}
            options={RADIUS_STEPS.map((s) => ({ value: s, label: STEP_LABELS[s] }))}
            inspect={["--radius-button"]}
            onChange={(v) => brandEdit(`Button corners: ${STEP_LABELS[v].toLowerCase()}`, [{ path: "tokens.radius.button", value: v }])}
          />
          <Segmented
            label="Cards use"
            value={t.radius.card}
            options={RADIUS_STEPS.map((s) => ({ value: s, label: STEP_LABELS[s] }))}
            inspect={["--radius-card"]}
            onChange={(v) => brandEdit(`Card corners: ${STEP_LABELS[v].toLowerCase()}`, [{ path: "tokens.radius.card", value: v }])}
          />
        </div>
      </EditorSection>

      <EditorSection title="Spacing" description="A base step and a ratio. Every space on the site is a step up or down from the base.">
        <div className={styles.sliderGrid}>
          <SliderField
            label="Base step"
            value={parseFloat(t.space.base)}
            min={0.75}
            max={1.25}
            step={0.0625}
            format={(v) => `${v}rem`}
            inspect={["--space-s", "--space-m", "--space-l"]}
            onChange={(v) => brandEdit("Spacing base", [{ path: "tokens.space.base", value: `${v}rem` }], "space-base")}
          />
          <SliderField
            label="Ratio"
            value={t.space.ratio}
            min={1.2}
            max={2}
            step={0.05}
            format={(v) => `× ${v.toFixed(2)}`}
            inspect={["--space-l", "--space-xl", "--space-2xl"]}
            onChange={(v) => brandEdit("Spacing ratio", [{ path: "tokens.space.ratio", value: Math.round(v * 100) / 100 }], "space-ratio")}
          />
        </div>
        <ol className={styles.spaceScale} aria-label="Spacing scale">
          {SPACE_STEPS.map((step) => (
            <li key={step}>
              <span className={styles.spaceName}>{step}</span>
              <span className={styles.spaceBar} style={{ width: `${scale[step]}rem` }} aria-hidden="true" />
              <span className={styles.spaceValue}>{scale[step]}rem</span>
            </li>
          ))}
        </ol>
      </EditorSection>

      <EditorSection title="Shadow" description="Tinted with the brand's own text colour rather than plain grey.">
        <div className={styles.presetGrid}>
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              aria-pressed={currentShadow === preset.id}
              onClick={() => brandEdit(`${preset.label} shadow`, [{ path: "tokens.shadow.card", value: preset.build(colours) }])}
            >
              <BrandScope tokens={t} mode={mode} className={styles.shadowSwatch} aria-hidden="true">
                <span style={{ boxShadow: preset.build(colours) }} />
              </BrandScope>
              <span className={styles.presetName}>{preset.label}</span>
            </button>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Motion" description="How fast things move and how they settle. The demo replays each time you pick a style.">
        <BrandScope tokens={t} mode={mode} className={styles.motionStage}>
          <MotionDemo motion={t.motion} />
        </BrandScope>
        <div className={styles.presetGrid}>
          {MOTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              aria-pressed={currentMotion === preset.id}
              onClick={() => brandEdit(`${preset.label} motion`, [{ path: "tokens.motion", value: preset.motion }])}
            >
              <BrandScope tokens={{ ...t, motion: preset.motion }} mode={mode} className={styles.motionSwatch} aria-hidden="true">
                <MotionPreview label="" compact />
              </BrandScope>
              <span className={styles.presetName}>{preset.label}</span>
              <span className={styles.presetDescription}>{preset.description}</span>
            </button>
          ))}
        </div>
        <DraftField label="Motion style" max={80} value={direction.motion.style} onCommit={(v) => brandEdit("Motion style", [{ path: "motion.style", value: v }], "motion.style")} />
        <DraftField
          label="Motion principle"
          multiline
          max={160}
          value={direction.motion.principle}
          onCommit={(v) => brandEdit("Motion principle", [{ path: "motion.principle", value: v }], "motion.principle")}
        />
      </EditorSection>
    </div>
  );
}

const EASING_NAMES: Record<string, string> = {
  "cubic-bezier(0.22, 1, 0.36, 1)": "gentle ease out",
  "cubic-bezier(0.2, 0, 0, 1)": "sharp ease out",
  "cubic-bezier(0.34, 1.56, 0.64, 1)": "springy overshoot",
  "ease-in-out": "even ease in and out",
};

/*
 * Motion only shows when something moves, and a still preview never does. This
 * plays a short sequence using the current motion tokens: a card arriving at
 * the slow speed, rows following at the normal speed, a switch and a button at
 * the fast speed. It replays whenever the tokens change, or on request.
 */
function MotionDemo({ motion }: { motion: Direction["tokens"]["motion"] }) {
  const [runs, setRuns] = useState(0);
  const reduced = useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  return (
    <div className={styles.motionDemo}>
      <div key={`${JSON.stringify(motion)}-${runs}`} className={styles.motionScene} aria-hidden="true">
        <div className={styles.mCard}>
          <span className={styles.mTitle}>New site flagged</span>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.mRow} style={{ animationDelay: `calc(var(--motion-slow) * 0.5 + var(--motion-fast) * ${i})` }} />
          ))}
          <span className={styles.mFooter}>
            <span className={styles.mSwitch}>
              <span />
            </span>
            <span className={styles.mButton}>View</span>
          </span>
        </div>
      </div>
      <div className={styles.motionMeta}>
        <p className={styles.motionTimings}>
          Fast {motion.fast} · Normal {motion.normal} · Slow {motion.slow} · {EASING_NAMES[motion.easing] ?? "custom easing"}
        </p>
        <button type="button" className="ui-button ui-button--small" onClick={() => setRuns((r) => r + 1)}>
          Replay
        </button>
      </div>
      {reduced ? (
        <p className="ui-notice" role="note">
          Your device is set to reduce motion, so Loose Brief switches animations off, this demo included. The motion settings still apply to your exported site for visitors who haven&rsquo;t turned that on.
        </p>
      ) : null}
    </div>
  );
}

function ComponentGallery({ direction }: { direction: Direction }) {
  const button = useInspect(["--color-button-primary", "--color-button-primary-text", "--radius-button"]);
  return (
    <div className={styles.galleryGrid}>
      <div className={styles.galleryItem} {...button}>
        <span className={styles.galleryLabel}>Buttons</span>
        <div className={styles.galleryRow}>
          <span className={styles.gButtonPrimary}>{direction.sample.primaryCta}</span>
          <span className={styles.gButtonSecondary}>{direction.sample.secondaryCta}</span>
        </div>
      </div>
      <div className={styles.galleryItem}>
        <span className={styles.galleryLabel}>Card</span>
        <div className={styles.gCard}>
          <span className={styles.gCardTitle}>Shoreline forecasts</span>
          <span className={styles.gCardBody}>Projected change for every stretch of coast.</span>
          <span className={styles.gLink}>Read more</span>
        </div>
      </div>
      <div className={styles.galleryItem}>
        <span className={styles.galleryLabel}>Form field</span>
        <div className={styles.gField}>
          <span className={styles.gFieldLabel}>Work email</span>
          <span className={styles.gInput}>name@council.gov.uk</span>
        </div>
      </div>
      <div className={styles.galleryItem}>
        <span className={styles.galleryLabel}>Badges and quote</span>
        <div className={styles.galleryRow}>
          <span className={styles.gBadge}>Live data</span>
          <span className={styles.gBadgeAccent}>New</span>
        </div>
        <span className={styles.gQuote}>{direction.voice.example}</span>
      </div>
    </div>
  );
}
