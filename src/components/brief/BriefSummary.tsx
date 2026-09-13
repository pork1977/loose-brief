"use client";

import { isDemoBrief } from "@/data/demo-brief";
import { answeredCount, summaryLine, type BriefDraft, type Material } from "@/lib/brief";
import { useThumbnail } from "@/lib/material-thumbnails";
import { describeAxis, readPersonality } from "@/lib/personality";
import styles from "./BriefSummary.module.css";

const THEME_LABELS = { light: "Light", dark: "Dark", both: "Light and dark", "": "" } as const;

function Missing() {
  return <span className={styles.missing}>Not answered yet</span>;
}

/*
 * The live summary beside the brief. It restates the answers in the shape
 * the rest of the studio will use them, with a rough personality reading.
 * Nothing here is AI output.
 */
export function BriefSummary({ brief }: { brief: BriefDraft }) {
  const { answered, total } = answeredCount(brief);
  const line = summaryLine(brief);
  const reading = readPersonality(brief.personality);
  const colours = collectColours(brief.materials);

  return (
    <section className={styles.summary} aria-labelledby="brief-summary-title">
      <header className={styles.header}>
        <h2 id="brief-summary-title" className="ui-panel__title">
          Live summary
        </h2>
        {isDemoBrief(brief) ? <span className="ui-chip ui-chip--accent">Demo brief</span> : null}
      </header>

      <div className={styles.progress}>
        <span className={styles.progressLabel}>
          {answered} of {total} answered
        </span>
        <span className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${(answered / total) * 100}%` }} />
        </span>
      </div>

      <div className={styles.identity}>
        <p className={styles.name}>{brief.name.trim() || <span className={styles.placeholderName}>Your brand</span>}</p>
        <p className={styles.line}>{line || <Missing />}</p>
      </div>

      <dl className={styles.list}>
        <div>
          <dt>Audience</dt>
          <dd>{brief.audience.length ? brief.audience.join(", ") : <Missing />}</dd>
        </div>
        <div>
          <dt>Problem solved</dt>
          <dd className={styles.clamp}>{brief.problem.trim() || <Missing />}</dd>
        </div>
        <div>
          <dt>Brand personality</dt>
          <dd>
            {brief.personality.length ? (
              <>
                <span>{brief.personality.join(" · ")}</span>
                {reading.placed > 0 ? (
                  <div className={styles.map}>
                    {reading.axes.map((axis) => (
                      <div key={axis.id} className={styles.axis}>
                        <span className={styles.axisLow}>{axis.low}</span>
                        <span className={styles.axisTrack} role="img" aria-label={`${axis.low} to ${axis.high}: ${describeAxis(axis)}`}>
                          <span className={styles.axisMarker} style={{ left: `${((axis.value + 1) / 2) * 100}%` }} />
                        </span>
                        <span className={styles.axisHigh}>{axis.high}</span>
                      </div>
                    ))}
                    <p className={styles.footnote}>
                      A rough reading from fixed rules, not AI.
                      {reading.custom ? " Your own traits aren't placed on it." : ""}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <Missing />
            )}
          </dd>
        </div>
        <div>
          <dt>Primary conversion</dt>
          <dd>{brief.primaryAction.trim() || <Missing />}</dd>
        </div>
        <div>
          <dt>Look</dt>
          <dd>
            {brief.theme ? THEME_LABELS[brief.theme] : <Missing />}
            {brief.avoid.length ? <span className={styles.sub}>Avoid: {brief.avoid.join(", ")}</span> : null}
            {brief.references.length ? (
              <span className={styles.sub}>
                {brief.references.length} reference{brief.references.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>{brief.pages.join(", ")}</dd>
        </div>
        {brief.materials.length ? (
          <div>
            <dt>Your materials</dt>
            <dd>
              <ul className={styles.thumbs}>
                {brief.materials.map((m) => (
                  <SummaryThumb key={m.id} material={m} />
                ))}
              </ul>
              {colours.keep.length ? (
                <ColourRow label="Colours to keep" hexes={colours.keep} />
              ) : null}
              {colours.hints.length ? <ColourRow label="Colours to draw from" hexes={colours.hints} /> : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function ColourRow({ label, hexes }: { label: string; hexes: string[] }) {
  return (
    <div className={styles.colourRow}>
      <span className={styles.sub}>{label}</span>
      <ul className={styles.colourList}>
        {hexes.map((hex) => (
          <li key={hex} title={hex}>
            <span className={styles.colour} style={{ background: hex }} aria-hidden="true" />
            <span className="visually-hidden">{hex}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryThumb({ material }: { material: Material }) {
  const url = useThumbnail(material.id);
  return (
    <li className={styles.thumb} title={material.fileName}>
      {typeof url === "string" && url !== "loading" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        <span style={{ background: material.palette[0]?.hex ?? "transparent" }} />
      )}
      <span className="visually-hidden">{material.fileName}</span>
    </li>
  );
}

/** Logo colours marked "keep" first, then the two strongest colours from everything else. */
function collectColours(materials: Material[]) {
  const keep: string[] = [];
  const hints: string[] = [];
  for (const m of materials) {
    if (m.kind === "logo" && m.keepColours) {
      const source = m.exactColours.length ? m.exactColours : m.palette.map((s) => s.hex);
      keep.push(...source.slice(0, 4));
    } else {
      hints.push(...m.palette.slice(0, 2).map((s) => s.hex));
    }
  }
  const unique = (list: string[]) => [...new Set(list)];
  const keepSet = unique(keep).slice(0, 8);
  return { keep: keepSet, hints: unique(hints).filter((h) => !keepSet.includes(h)).slice(0, 8) };
}
