"use client";

import { useId } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { CoastlineVisual } from "@/components/brand/CoastlineVisual";
import { TagField } from "@/components/form/fields";
import { VISUAL_STYLES, type Direction, type VisualStyle } from "@/lib/direction";
import type { Mode } from "@/lib/tokens";
import { DraftField, EditorSection, brandEdit, useInspect } from "./controls";
import styles from "./tabs.module.css";

const text = (label: string, path: string) => (value: string) => brandEdit(label, [{ path, value }], path);

export function VoiceTab({ direction }: { direction: Direction }) {
  const { strategy, voice, sample } = direction;
  return (
    <div className={styles.tab}>
      <EditorSection title="Strategy" description="What the brand stands for, in words the whole team can repeat.">
        <DraftField label="Positioning statement" multiline max={280} value={strategy.positioning} onCommit={text("Positioning statement", "strategy.positioning")} />
        <DraftField label="Brand promise" max={120} value={strategy.promise} onCommit={text("Brand promise", "strategy.promise")} />
      </EditorSection>

      <EditorSection title="Tone of voice" description="How the brand sounds, with an example line to hold writing up against.">
        <DraftField label="Tone" max={80} value={voice.tone} onCommit={text("Tone", "voice.tone")} />
        <DraftField label="Example line" max={140} value={voice.example} onCommit={text("Example line", "voice.example")} />
        <TagField
          label="Words it uses"
          name="voice-words"
          hint={
            voice.words.length <= 2
              ? "Two to five words that should turn up in the brand's writing. Add another before removing one of these."
              : "Two to five words that should turn up in the brand's writing."
          }
          values={voice.words}
          maxItems={5}
          maxLength={24}
          onChange={(words) => {
            if (words.length >= 2) brandEdit("Voice words", [{ path: "voice.words", value: words }]);
          }}
        />
      </EditorSection>

      <EditorSection title="Homepage copy" description="The hero on the site preview. Every word can be changed.">
        <DraftField label="Eyebrow" max={60} value={sample.eyebrow} onCommit={text("Eyebrow", "sample.eyebrow")} inspect={["--font-label"]} />
        <DraftField label="Headline" max={90} value={sample.headline} onCommit={text("Headline", "sample.headline")} inspect={["--font-display"]} />
        <DraftField label="Supporting line" multiline max={220} value={sample.body} onCommit={text("Supporting line", "sample.body")} inspect={["--font-body"]} />
        <div className={styles.twoUp}>
          <DraftField label="Main button" max={40} value={sample.primaryCta} onCommit={text("Main button", "sample.primaryCta")} inspect={["--color-button-primary"]} />
          <DraftField label="Second button" max={40} value={sample.secondaryCta} onCommit={text("Second button", "sample.secondaryCta")} inspect={["--color-border"]} />
        </div>
        <div className={styles.threeUp}>
          {sample.nav.map((item, i) => (
            <DraftField key={i} label={`Nav link ${i + 1}`} max={24} value={item} onCommit={text(`Nav link ${i + 1}`, `sample.nav.${i}`)} />
          ))}
        </div>
      </EditorSection>
    </div>
  );
}

const STYLE_LABELS: Record<VisualStyle, { label: string; description: string }> = {
  contours: { label: "Contours", description: "Fine lines and survey marks" },
  grid: { label: "Grid", description: "Schematic, data-led" },
  soft: { label: "Soft shapes", description: "Rounded and warm" },
};

export function ImageryTab({ direction, mode }: { direction: Direction; mode: Mode }) {
  const name = useId();
  const inspectProps = useInspect(["--color-brand-primary", "--color-brand-secondary", "--color-brand-accent"]);
  const { imagery } = direction;

  return (
    <div className={styles.tab}>
      <EditorSection title="Illustration style" description="Drawn in code from the brand colours, so it changes when they do.">
        <fieldset className={styles.styleGrid} {...inspectProps}>
          <legend className="visually-hidden">Illustration style</legend>
          {VISUAL_STYLES.map((style) => (
            <label key={style} className={styles.styleOption}>
              <input
                type="radio"
                name={name}
                checked={direction.visual === style}
                onChange={() => brandEdit(`${STYLE_LABELS[style].label} illustrations`, [{ path: "visual", value: style }])}
              />
              <BrandScope tokens={direction.tokens} mode={mode} className={styles.styleThumb} aria-hidden="true">
                <CoastlineVisual style={style} />
              </BrandScope>
              <span className={styles.presetName}>{STYLE_LABELS[style].label}</span>
              <span className={styles.presetDescription}>{STYLE_LABELS[style].description}</span>
            </label>
          ))}
        </fieldset>
      </EditorSection>

      <EditorSection title="Image direction" description="Guidance for anyone choosing or making imagery for the brand.">
        <DraftField label="Style" max={120} value={imagery.style} onCommit={text("Image style", "imagery.style")} />
        <DraftField label="Treatment" max={120} value={imagery.treatment} onCommit={text("Image treatment", "imagery.treatment")} />
        <DraftField label="Illustration direction" multiline max={160} value={imagery.illustration} onCommit={text("Illustration direction", "imagery.illustration")} />
      </EditorSection>
    </div>
  );
}
