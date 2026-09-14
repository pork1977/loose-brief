"use client";

import { BrandScope } from "@/components/brand/BrandScope";
import { MotionPreview } from "@/components/brand/MotionPreview";
import { MOTION_PRESETS, SHADOW_PRESETS } from "@/lib/brand-presets";
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

      <EditorSection title="Corners" description="A three-step radius scale. Buttons and cards each pick a step.">
        <div className={styles.sliderGrid}>
          {(["small", "medium", "large"] as const).map((step) => (
            <SliderField
              key={step}
              label={`${STEP_LABELS[step]} radius`}
              value={px(t.radius[step])}
              min={0}
              max={step === "large" ? 40 : 24}
              step={1}
              format={(v) => `${v}px`}
              inspect={[`--radius-${step}`, "--radius-button", "--radius-card"]}
              onChange={(v) => brandEdit(`${STEP_LABELS[step]} radius`, [{ path: `tokens.radius.${step}`, value: `${v}px` }], `radius-${step}`)}
            />
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

      <EditorSection title="Motion" description="How fast things move and how they settle.">
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
