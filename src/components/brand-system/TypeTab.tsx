"use client";

import { useId } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { BRAND_FONTS, brandFont, type BrandFontId, type FontCategory } from "@/lib/brand-fonts";
import { TYPE_PRESETS, withFamily } from "@/lib/brand-presets";
import type { Direction } from "@/lib/direction";
import type { Mode } from "@/lib/tokens";
import { EditorSection, Segmented, SliderField, brandEdit, useInspect } from "./controls";
import styles from "./tabs.module.css";

type Role = "display" | "body" | "label";

const ROLES: { role: Role; label: string; description: string; inspect: string[] }[] = [
  { role: "display", label: "Display", description: "Headlines, the logo and big figures", inspect: ["--font-display"] },
  { role: "body", label: "Body", description: "Paragraphs and interface text", inspect: ["--font-body"] },
  { role: "label", label: "Labels", description: "Eyebrows, small labels and data", inspect: ["--font-label"] },
];

const CATEGORY_LABELS: Record<FontCategory, string> = { serif: "Serif", sans: "Sans", rounded: "Rounded", mono: "Mono" };

export function TypeTab({ direction, mode }: { direction: Direction; mode: Mode }) {
  const typography = direction.tokens.typography;
  const activePreset = TYPE_PRESETS.find((p) => JSON.stringify(p.typography) === JSON.stringify(typography));

  return (
    <div className={styles.tab}>
      <EditorSection title="Pairings" description="Swap the whole type system in one go. Everything stays editable afterwards.">
        <div className={styles.presetGrid}>
          {TYPE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              aria-pressed={activePreset?.id === preset.id}
              onClick={() => brandEdit(`${preset.label} type`, [{ path: "tokens.typography", value: preset.typography }])}
            >
              <span className={styles.presetGlyph} style={{ fontFamily: brandFont(preset.typography.display.family).stack, fontWeight: preset.typography.display.weight }}>
                Ag
              </span>
              <span className={styles.presetName}>{preset.label}</span>
              <span className={styles.presetDescription}>{preset.description}</span>
            </button>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Specimen" description="Set in your current type tokens.">
        <BrandScope tokens={direction.tokens} mode={mode} className={styles.specimen}>
          <p className={styles.specimenLabel}>{direction.sample.eyebrow}</p>
          <p className={styles.specimenDisplay}>{direction.sample.headline}</p>
          <p className={styles.specimenBody}>{direction.sample.body}</p>
        </BrandScope>
      </EditorSection>

      {ROLES.map(({ role, label, description, inspect }) => (
        <EditorSection key={role} title={label} description={description}>
          <FontPicker
            role={role}
            label={label}
            value={typography[role].family}
            inspect={inspect}
            onChange={(family) => brandEdit(`${label} font: ${brandFont(family).name}`, [{ path: "tokens.typography", value: withFamily(typography, role, family) }])}
          />
          <div className={styles.sliderGrid}>
            <WeightField role={role} family={typography[role].family} value={typography[role].weight} label={label} />
            {role !== "label" ? (
              <SliderField
                label="Line height"
                value={typography[role].lineHeight}
                min={role === "display" ? 0.8 : 1.2}
                max={role === "display" ? 1.4 : 2}
                step={0.05}
                format={(v) => v.toFixed(2)}
                inspect={[`--font-${role}-leading`]}
                onChange={(v) => brandEdit(`${label} line height`, [{ path: `tokens.typography.${role}.lineHeight`, value: Math.round(v * 100) / 100 }], `${role}-leading`)}
              />
            ) : null}
            {role !== "body" ? (
              <SliderField
                label="Letter spacing"
                value={parseFloat(typography[role].letterSpacing)}
                min={-0.06}
                max={0.16}
                step={0.005}
                format={(v) => `${v.toFixed(3)}em`}
                inspect={[`--font-${role}-tracking`]}
                onChange={(v) =>
                  brandEdit(`${label} letter spacing`, [{ path: `tokens.typography.${role}.letterSpacing`, value: `${Math.round(v * 1000) / 1000}em` }], `${role}-tracking`)
                }
              />
            ) : null}
          </div>
          {role === "label" ? (
            <Segmented
              label="Case"
              value={typography.label.transform}
              options={[
                { value: "uppercase", label: "Capitals" },
                { value: "none", label: "As written" },
              ]}
              inspect={["--font-label-transform"]}
              onChange={(v) => brandEdit(v === "uppercase" ? "Labels in capitals" : "Labels as written", [{ path: "tokens.typography.label.transform", value: v }])}
            />
          ) : null}
        </EditorSection>
      ))}
    </div>
  );
}

function FontPicker({ role, label, value, onChange, inspect }: { role: Role; label: string; value: BrandFontId; onChange: (id: BrandFontId) => void; inspect: string[] }) {
  const name = useId();
  const inspectProps = useInspect(inspect);
  return (
    <fieldset className={styles.fontPicker} {...inspectProps}>
      <legend className="visually-hidden">{label} font</legend>
      {BRAND_FONTS.map((font) => (
        <label key={font.id} className={styles.fontOption} data-role={role}>
          <input type="radio" name={name} checked={value === font.id} onChange={() => onChange(font.id)} />
          <span className={styles.fontSample} style={{ fontFamily: font.stack }}>
            Ag
          </span>
          <span className={styles.fontName}>{font.name}</span>
          <span className={styles.fontCategory}>{CATEGORY_LABELS[font.category]}</span>
        </label>
      ))}
    </fieldset>
  );
}

function WeightField({ role, family, value, label }: { role: Role; family: BrandFontId; value: number; label: string }) {
  const id = useId();
  const weights = brandFont(family).weights;
  const inspectProps = useInspect([`--font-${role}-weight`]);
  return (
    <div className="ui-field" {...inspectProps}>
      <label className="ui-label" htmlFor={id}>
        Weight
      </label>
      <select
        id={id}
        className="ui-select ui-select--small"
        value={value}
        onChange={(e) => brandEdit(`${label} weight`, [{ path: `tokens.typography.${role}.weight`, value: Number(e.target.value) }])}
      >
        {weights.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
      {weights.length === 1 ? <p className="ui-hint">{brandFont(family).name} comes in one weight.</p> : null}
    </div>
  );
}
