"use client";

import { useId, useState } from "react";
import { DraftField, brandEdit } from "@/components/brand-system/controls";
import type { SiteTarget } from "@/components/website/WebsiteContext";
import { isDemoDirection } from "@/data/demo-ids";
import type { Direction } from "@/lib/direction";
import { LOCKED_SECTIONS, SECTION_LABELS, SECTION_ORDER, type Section } from "@/lib/website";
import styles from "./SectionRail.module.css";

type Field = { label: string; path: string; max: number; multiline?: boolean };

/** The editable text in a section, with the same limits the schema enforces. */
function fieldsFor(section: Section, index: number): Field[] {
  const p = (key: string) => `website.sections.${index}.${key}`;
  const eyebrowTitle = (titleMax = 90): Field[] => [
    { label: "Eyebrow", path: p("eyebrow"), max: 40 },
    { label: "Title", path: p("title"), max: titleMax },
  ];
  switch (section.type) {
    case "credibility":
      return [{ label: "Label", path: p("label"), max: 60 }, ...section.items.map((_, i) => ({ label: `Item ${i + 1}`, path: p(`items.${i}`), max: 40 }))];
    case "problem":
      return [
        ...eyebrowTitle(),
        { label: "Body", path: p("body"), max: 320, multiline: true },
        ...section.points.map((_, i) => ({ label: `Point ${i + 1}`, path: p(`points.${i}`), max: 120 })),
      ];
    case "how":
      return [
        ...eyebrowTitle(),
        ...section.steps.flatMap((_, i) => [
          { label: `Step ${i + 1} title`, path: p(`steps.${i}.title`), max: 40 },
          { label: `Step ${i + 1} text`, path: p(`steps.${i}.body`), max: 160, multiline: true },
        ]),
      ];
    case "data":
      return [...eyebrowTitle(), { label: "Body", path: p("body"), max: 220, multiline: true }];
    case "features":
      return [
        ...eyebrowTitle(),
        ...section.items.flatMap((_, i) => [
          { label: `Feature ${i + 1} title`, path: p(`items.${i}.title`), max: 40 },
          { label: `Feature ${i + 1} text`, path: p(`items.${i}.body`), max: 160, multiline: true },
        ]),
      ];
    case "impact":
      return [
        ...eyebrowTitle(),
        ...section.figures.flatMap((_, i) => [
          { label: `Figure ${i + 1}`, path: p(`figures.${i}.value`), max: 12 },
          { label: `Figure ${i + 1} label`, path: p(`figures.${i}.label`), max: 50 },
        ]),
        { label: "Quote", path: p("quote"), max: 240, multiline: true },
        { label: "Attribution", path: p("attribution"), max: 80 },
      ];
    case "cta":
      return [
        ...eyebrowTitle(80),
        { label: "Body", path: p("body"), max: 200, multiline: true },
        { label: "Message after sending", path: p("success"), max: 160, multiline: true },
      ];
    case "footer":
      return [
        { label: "Tagline", path: p("tagline"), max: 120 },
        ...section.links.map((_, i) => ({ label: `Link ${i + 1}`, path: p(`links.${i}`), max: 24 })),
        { label: "Small print", path: p("note"), max: 160, multiline: true },
      ];
  }
}

const HERO_FIELDS: Field[] = [
  { label: "Eyebrow", path: "sample.eyebrow", max: 60 },
  { label: "Headline", path: "sample.headline", max: 90 },
  { label: "Supporting line", path: "sample.body", max: 220, multiline: true },
  { label: "Main button", path: "sample.primaryCta", max: 40 },
  { label: "Second button", path: "sample.secondaryCta", max: 40 },
];
const NAV_FIELDS: Field[] = [0, 1, 2].map((i) => ({ label: `Link ${i + 1}`, path: `sample.nav.${i}`, max: 24 }));

const read = (direction: Direction, path: string) =>
  path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], direction) as string;

type Props = { direction: Direction; onJump: (target: SiteTarget) => void };

export function SectionRail({ direction, onJump }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  // The coastline explorer only exists for the Ebbfield demo, so a generated brand doesn't list it at all.
  const listed = direction.website.sections.map((section, index) => ({ section, index })).filter(({ section }) => section.type !== "data" || isDemoDirection(direction.id));
  const visibleCount = listed.filter(({ section }) => !section.hidden).length;

  return (
    <div className={styles.rail}>
      <p className={styles.summary}>
        {visibleCount + 2} of {listed.length + 2} sections showing. Select one to jump to it; open it to edit its words.
      </p>
      <ol className={styles.list}>
        <Row label={SECTION_LABELS.nav} target="top" fields={NAV_FIELDS} direction={direction} open={open === "nav"} onToggle={() => setOpen(open === "nav" ? null : "nav")} onJump={onJump} locked />
        <Row label={SECTION_LABELS.hero} target="top" fields={HERO_FIELDS} direction={direction} open={open === "hero"} onToggle={() => setOpen(open === "hero" ? null : "hero")} onJump={onJump} locked />
        {listed.map(({ section, index }) => (
          <Row
            key={section.id}
            label={SECTION_LABELS[section.type]}
            target={SECTION_ORDER[index]}
            fields={fieldsFor(section, index)}
            direction={direction}
            hidden={section.hidden}
            locked={LOCKED_SECTIONS.includes(section.type)}
            onVisibility={(visible) =>
              brandEdit(`${visible ? "Show" : "Hide"} ${SECTION_LABELS[section.type].toLowerCase()}`, [{ path: `website.sections.${index}.hidden`, value: !visible }])
            }
            open={open === section.id}
            onToggle={() => setOpen(open === section.id ? null : section.id)}
            onJump={onJump}
          />
        ))}
      </ol>
    </div>
  );
}

type RowProps = {
  label: string;
  target: SiteTarget;
  fields: Field[];
  direction: Direction;
  hidden?: boolean;
  locked?: boolean;
  onVisibility?: (visible: boolean) => void;
  open: boolean;
  onToggle: () => void;
  onJump: (target: SiteTarget) => void;
};

function Row({ label, target, fields, direction, hidden = false, locked = false, onVisibility, open, onToggle, onJump }: RowProps) {
  const panelId = useId();
  return (
    <li className={styles.row} data-hidden={hidden} data-open={open}>
      <div className={styles.rowHeader}>
        <button type="button" className={styles.jump} onClick={() => onJump(target)} disabled={hidden}>
          <span className={styles.rowLabel}>{label}</span>
          {hidden ? <span className={styles.hiddenTag}>Hidden</span> : null}
        </button>
        {!locked && onVisibility ? (
          <label className={styles.visibility} title={hidden ? `Show ${label.toLowerCase()}` : `Hide ${label.toLowerCase()}`}>
            <input type="checkbox" checked={!hidden} onChange={(e) => onVisibility(e.target.checked)} />
            <span className="visually-hidden">Show {label.toLowerCase()}</span>
            <span className={styles.switch} aria-hidden="true" />
          </label>
        ) : null}
        <button type="button" className={styles.expand} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span className="visually-hidden">{open ? "Close" : "Edit"} {label.toLowerCase()}</span>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div id={panelId} className={styles.fields} hidden={!open}>
        {open
          ? fields.map((field) => (
              <DraftField
                key={field.path}
                label={field.label}
                max={field.max}
                multiline={field.multiline}
                value={read(direction, field.path)}
                onCommit={(value) => brandEdit(`${label}: ${field.label.toLowerCase()}`, [{ path: field.path, value }], field.path)}
              />
            ))
          : null}
      </div>
    </li>
  );
}
