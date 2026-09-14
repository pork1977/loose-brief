"use client";

import { useId } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { BrandIllustration } from "@/components/brand/BrandIllustration";
import { TagField } from "@/components/form/fields";
import { isDemoDirection } from "@/data/demo-ids";
import { VISUAL_STYLES, type Direction, type VisualStyle } from "@/lib/direction";
import { LAYOUTS, LAYOUT_LABELS, MOTIFS, motif, type MotifId } from "@/lib/motifs";
import type { Mode } from "@/lib/tokens";
import { DraftField, EditorSection, Segmented, brandEdit, useInspect } from "./controls";
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

      <EditorSection title="Homepage copy" description="The hero and navigation. Every other section of the homepage can be edited in the Studio.">
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

/*
 * Which shapes the illustration is built from, and how they're arranged.
 * Ebbfield starts with its own coastline drawing and can switch to shapes;
 * anything else always uses shapes.
 */
function ShapesEditor({ direction }: { direction: Direction }) {
  const { illustration } = direction;
  const demo = isDemoDirection(direction.id);

  if (!illustration) {
    return (
      <EditorSection
        title="Shapes"
        description={demo ? "The illustration is Ebbfield's coastline drawing, made for the demo." : "This brand was made before illustrations used shapes, so it still has the demo's abstract drawing."}
      >
        <div>
          <button
            type="button"
            className="ui-button ui-button--small"
            onClick={() =>
              brandEdit("Build the illustration from shapes", [
                { path: "illustration", value: demo ? { motifs: ["wave", "pin", "chart"], layout: "journey" } : { motifs: ["spark"], layout: "hero" } },
              ])
            }
          >
            Build it from shapes instead
          </button>
        </div>
      </EditorSection>
    );
  }

  const toggle = (id: MotifId, on: boolean) => {
    const motifs = on ? [...illustration.motifs, id] : illustration.motifs.filter((m) => m !== id);
    if (!motifs.length || motifs.length > 3) return;
    brandEdit(`${on ? "Add" : "Remove"} ${motif(id).label.toLowerCase()} shape`, [{ path: "illustration.motifs", value: motifs }]);
  };

  return (
    <EditorSection
      title="Shapes"
      description={`Pick up to three shapes that say something about the business. The first is the largest. ${illustration.motifs.length} of 3 chosen.`}
      actions={
        demo ? (
          <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => brandEdit("Back to the coastline drawing", [{ path: "illustration", value: null }])}>
            Use the coastline again
          </button>
        ) : undefined
      }
    >
      <Segmented
        label="Arrangement"
        value={illustration.layout}
        options={LAYOUTS.map((layout) => ({ value: layout, label: LAYOUT_LABELS[layout].label }))}
        onChange={(layout) => brandEdit(`${LAYOUT_LABELS[layout].label} arrangement`, [{ path: "illustration.layout", value: layout }])}
      />
      <fieldset className={styles.motifGrid}>
        <legend className="ui-label">Shapes</legend>
        <div className="ui-toggles">
          {MOTIFS.map((m) => {
            const chosen = illustration.motifs.includes(m.id);
            const locked = chosen ? illustration.motifs.length === 1 : illustration.motifs.length >= 3;
            return (
              <label key={m.id} className="ui-toggle" title={locked && !chosen ? "Remove a shape to add another" : undefined}>
                <input type="checkbox" checked={chosen} disabled={locked} onChange={(e) => toggle(m.id, e.target.checked)} />
                <svg viewBox="0 0 48 48" className={styles.motifIcon} aria-hidden="true">
                  {m.paths.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </svg>
                {m.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </EditorSection>
  );
}

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
                <BrandIllustration direction={direction} style={style} />
              </BrandScope>
              <span className={styles.presetName}>{STYLE_LABELS[style].label}</span>
              <span className={styles.presetDescription}>{STYLE_LABELS[style].description}</span>
            </label>
          ))}
        </fieldset>
      </EditorSection>

      <ShapesEditor direction={direction} />

      <EditorSection title="Image direction" description="Guidance for anyone choosing or making imagery for the brand.">
        <DraftField label="Style" max={120} value={imagery.style} onCommit={text("Image style", "imagery.style")} />
        <DraftField label="Treatment" max={120} value={imagery.treatment} onCommit={text("Image treatment", "imagery.treatment")} />
        <DraftField label="Illustration direction" multiline max={160} value={imagery.illustration} onCommit={text("Illustration direction", "imagery.illustration")} />
      </EditorSection>
    </div>
  );
}
