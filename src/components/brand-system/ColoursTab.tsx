"use client";

import { useState } from "react";
import { ContrastSummary } from "@/components/directions/DirectionParts";
import { deriveColorSet, shiftContrast } from "@/lib/color-modes";
import type { Direction } from "@/lib/direction";
import { TOKEN_INFO } from "@/lib/token-registry";
import { colorKey, colorsFor, getPath, type Mode } from "@/lib/tokens";
import { dispatch } from "@/state/project-store";
import { ColourField, EditorSection, Segmented, brandEdit } from "./controls";
import styles from "./tabs.module.css";

const GROUPS: { title: string; description: string; rows: { path: string; label: string; description: string }[] }[] = [
  {
    title: "Brand",
    description: "The colours people will remember.",
    rows: [
      { path: "brand.primary", label: "Primary", description: "The main brand colour" },
      { path: "brand.secondary", label: "Secondary", description: "Fills, dividers and supporting shapes" },
      { path: "brand.accent", label: "Accent", description: "Highlights, icons and data. Not for text" },
    ],
  },
  {
    title: "Surfaces",
    description: "What everything sits on.",
    rows: [
      { path: "surface.page", label: "Page", description: "The page background" },
      { path: "surface.card", label: "Card", description: "Raised panels and cards" },
      { path: "surface.inverse", label: "Inverse", description: "Contrasting bands and sections" },
    ],
  },
  {
    title: "Text",
    description: "Checked against the surfaces above.",
    rows: [
      { path: "text.primary", label: "Text", description: "Headlines and main text" },
      { path: "text.secondary", label: "Secondary text", description: "Body copy and labels" },
      { path: "text.inverse", label: "Inverse text", description: "Text on inverse sections" },
    ],
  },
  {
    title: "Buttons and lines",
    description: "Calls to action and hairlines.",
    rows: [
      { path: "button.primary", label: "Button", description: "The main call to action" },
      { path: "button.primaryText", label: "Button label", description: "Text on the button" },
      { path: "border.subtle", label: "Border", description: "Dividers and outlines" },
    ],
  },
];

const cssVarFor = (path: string) => Object.entries(TOKEN_INFO).find(([, info]) => info.source === `color.${path}`)?.[0];

export function ColoursTab({ direction, mode }: { direction: Direction; mode: Mode }) {
  const [notice, setNotice] = useState<string | null>(null);
  const tokens = direction.tokens;
  const set = colorsFor(tokens, mode);
  const key = colorKey(mode);
  const other: Mode = mode === "light" ? "dark" : "light";

  const contrast = (step: 1 | -1) => {
    const next = shiftContrast(set, step);
    if (!next) {
      setNotice(step === -1 ? "Contrast can't go lower without failing a check." : "Contrast is already as high as it goes.");
      return;
    }
    setNotice(null);
    brandEdit(step === 1 ? `More contrast (${mode})` : `Less contrast (${mode})`, [{ path: `tokens.${key}`, value: next }]);
  };

  return (
    <div className={styles.tab}>
      <EditorSection
        title={`${mode === "light" ? "Light" : "Dark"} colours`}
        description={`Editing the ${mode} set. Both sets use the same names, so the site switches between them without any changes.`}
      >
        <div className={styles.controlRow}>
          <Segmented
            label="Editing"
            value={mode}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(m) => dispatch({ type: "brand/setPreviewMode", mode: m })}
          />
          <Segmented
            label="Leads with"
            value={tokens.mode}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            onChange={(m) => brandEdit(`Lead with ${m} mode`, [{ path: "tokens.mode", value: m }])}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.buttonGroup} role="group" aria-label="Contrast">
            <button type="button" className="ui-button ui-button--small" onClick={() => contrast(-1)}>
              Less contrast
            </button>
            <button type="button" className="ui-button ui-button--small" onClick={() => contrast(1)}>
              More contrast
            </button>
          </div>
          <button
            type="button"
            className="ui-button ui-button--ghost ui-button--small"
            onClick={() =>
              brandEdit(`Rebuild ${other} colours from ${mode}`, [{ path: `tokens.${colorKey(other)}`, value: deriveColorSet(set, other) }])
            }
          >
            Rebuild {other} colours from these
          </button>
        </div>
        {notice ? (
          <p className="ui-notice" role="status">
            {notice}
          </p>
        ) : null}
      </EditorSection>

      {GROUPS.map((group) => (
        <EditorSection key={group.title} title={group.title} description={group.description}>
          <div className={styles.stack}>
            {group.rows.map((row) => {
              const cssVar = cssVarFor(row.path);
              return (
                <ColourField
                  key={row.path}
                  label={row.label}
                  description={row.description}
                  value={getPath(set, row.path) as string}
                  inspect={cssVar ? [cssVar] : []}
                  onChange={(hex, continuous) =>
                    brandEdit(`${row.label} colour (${mode})`, [{ path: `tokens.${key}.${row.path}`, value: hex }], continuous ? `colour-${key}-${row.path}` : `hex-${key}-${row.path}`)
                  }
                />
              );
            })}
          </div>
        </EditorSection>
      ))}

      <EditorSection title="Contrast checks" description="Run against the colours above every time one changes.">
        <ContrastSummary
          direction={direction}
          mode={mode}
          onFix={(r) => r.suggestion && brandEdit(`Contrast fix: ${r.label.toLowerCase()}`, [{ path: `tokens.${r.foreground}`, value: r.suggestion }])}
        />
      </EditorSection>
    </div>
  );
}
