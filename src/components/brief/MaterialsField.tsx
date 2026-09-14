"use client";

import { useId, useRef, useState } from "react";
import { LIMITS, MATERIAL_KINDS, type Material, type MaterialKind } from "@/lib/brief";
import { ACCEPTED_TYPES, IntakeError, readMaterial } from "@/lib/image-intake";
import { useLiveStatus } from "@/lib/live/client";
import { MAX_IMAGES } from "@/lib/live/protocol";
import { saveMaterialFile } from "@/lib/material-files";
import { forgetThumbnail, rememberThumbnail, useThumbnail } from "@/lib/material-thumbnails";
import { dispatch } from "@/state/project-store";
import styles from "./MaterialsField.module.css";

/*
 * Files the visitor wants the brand built around: a logo, photos, textures,
 * screenshots of things they like. Colours are read in the browser the moment
 * a file lands, and nothing is uploaded anywhere.
 */

const KIND_LABELS: Record<MaterialKind, string> = {
  logo: "Logo",
  photo: "Photo",
  texture: "Pattern or texture",
  screenshot: "Screenshot of something I like",
  other: "Something else",
};

type Pending = { key: string; name: string; status: "reading" } | { key: string; name: string; status: "error"; message: string };

export function MaterialsField({ materials }: { materials: Material[] }) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);

  const live = useLiveStatus();
  const shared = materials.filter((m) => m.shareWithClaude).length;
  const reading = pending.filter((p) => p.status === "reading").length;
  const room = LIMITS.materials - materials.length - reading;

  async function intake(files: File[]) {
    let spaces = room;
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      if (spaces <= 0) {
        setPending((p) => [...p, { key, name: file.name, status: "error", message: `You can add ${LIMITS.materials} files at most.` }]);
        continue;
      }
      spaces--;
      setPending((p) => [...p, { key, name: file.name, status: "reading" }]);
      try {
        const { material, thumbnail } = await readMaterial(file);
        rememberThumbnail(material.id, thumbnail);
        await saveMaterialFile(material.id, thumbnail);
        dispatch({ type: "material/add", material });
        setPending((p) => p.filter((item) => item.key !== key));
      } catch (error) {
        const message = error instanceof IntakeError ? error.message : "Something went wrong reading that file.";
        setPending((p) => p.map((item) => (item.key === key ? { key, name: file.name, status: "error", message } : item)));
      }
    }
  }

  return (
    <div className="ui-field">
      <span className="ui-label">
        <span>
          Your own materials <span className="ui-label__optional">(optional)</span>
        </span>
        <span className="ui-counter">
          {materials.length} of {LIMITS.materials}
        </span>
      </span>
      <p id={hintId} className="ui-hint">
        A logo, photos, textures, or screenshots of things you like. Their colours are read straight away and shape
        the directions. Files stay in this browser
        {live ? ", unless you tick “Let Claude look at this” on one, in which case it's sent with your brief when directions are generated." : ". Nothing is uploaded."}
      </p>

      <div
        className={styles.drop}
        data-dragging={dragging}
        data-disabled={room <= 0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          intake([...e.dataTransfer.files]);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={styles.dropIcon}>
          <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p>
          <strong>Drop images here</strong> or{" "}
          <label htmlFor={inputId} className={styles.browse}>
            choose files
          </label>
        </p>
        <p className="ui-hint">PNG, JPG, WebP, AVIF, GIF or SVG, up to 10 MB each.</p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="visually-hidden"
          aria-describedby={hintId}
          disabled={room <= 0}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            intake(files);
          }}
        />
      </div>

      {pending.length ? (
        <ul className={styles.pending} aria-live="polite">
          {pending.map((item) => (
            <li key={item.key} className={item.status === "error" ? "ui-notice ui-notice--error" : "ui-notice"}>
              <span>
                <strong>{item.name}</strong>
                {item.status === "reading" ? " Reading colours..." : ` ${item.message}`}
              </span>
              {item.status === "error" ? (
                <button
                  type="button"
                  className="ui-button ui-button--ghost ui-button--small"
                  onClick={() => setPending((p) => p.filter((x) => x.key !== item.key))}
                >
                  Dismiss
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {materials.length ? (
        <ul className={styles.list}>
          {materials.map((material) => (
            <MaterialCard key={material.id} material={material} live={live === true} sharingFull={shared >= MAX_IMAGES} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MaterialCard({ material, live, sharingFull }: { material: Material; live: boolean; sharingFull: boolean }) {
  const id = useId();
  const thumbnail = useThumbnail(material.id);
  const update = (patch: Partial<Omit<Material, "id">>) => dispatch({ type: "material/update", id: material.id, patch });
  const colours = material.exactColours.length ? material.exactColours.slice(0, 6) : material.palette.map((s) => s.hex);

  return (
    <li className={styles.card}>
      <div className={styles.thumb} data-kind={material.kind}>
        {thumbnail === "loading" ? null : thumbnail ? (
          // Object URLs from the visitor's own file; next/image can't optimise those.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={material.alt || ""} />
        ) : (
          <span className={styles.noThumb}>Preview not kept in this browser</span>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.cardHeader}>
          <p className={styles.fileName} title={material.fileName}>
            {material.fileName}
          </p>
          <button
            type="button"
            className="ui-button ui-button--ghost ui-button--small"
            onClick={async () => {
              dispatch({ type: "material/remove", id: material.id });
              await forgetThumbnail(material.id);
            }}
            aria-label={`Remove ${material.fileName}`}
          >
            Remove
          </button>
        </div>

        <div className={styles.colours}>
          <span className="ui-hint">{material.exactColours.length ? "Colours in the file" : "Main colours"}</span>
          <ul className={styles.swatches}>
            {colours.map((hex, i) => (
              <li key={`${hex}-${i}`}>
                <span className={styles.swatch} style={{ background: hex }} aria-hidden="true" />
                <code>{hex}</code>
              </li>
            ))}
          </ul>
          <p className={styles.traits}>
            {[material.traits.lightness, material.traits.saturation, material.traits.temperature].map((t) => (
              <span key={t} className="ui-chip">
                {t}
              </span>
            ))}
          </p>
        </div>

        <div className={styles.controls}>
          <div className="ui-field">
            <label className="ui-label" htmlFor={`${id}-kind`}>
              What is it?
            </label>
            <select
              id={`${id}-kind`}
              className="ui-select ui-select--small"
              value={material.kind}
              onChange={(e) => {
                const kind = e.target.value as MaterialKind;
                update({ kind, keepColours: kind === "logo" ? material.keepColours : false });
              }}
            >
              {MATERIAL_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="ui-field">
            <legend className="ui-label">How should we use it?</legend>
            <div className="ui-toggles">
              <label className="ui-toggle">
                <input type="radio" name={`${id}-use`} checked={material.use === "in-site"} onChange={() => update({ use: "in-site" })} />
                Show it on the site
              </label>
              <label className="ui-toggle">
                <input
                  type="radio"
                  name={`${id}-use`}
                  checked={material.use === "inspiration"}
                  onChange={() => update({ use: "inspiration" })}
                />
                Inspiration only
              </label>
            </div>
          </fieldset>

          {live ? (
            <div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={material.shareWithClaude}
                  disabled={!material.shareWithClaude && sharingFull}
                  onChange={(e) => update({ shareWithClaude: e.target.checked })}
                />
                Let Claude look at this
              </label>
              <p className="ui-hint">
                {!material.shareWithClaude && sharingFull
                  ? `You can share ${MAX_IMAGES} images at most.`
                  : "Sent to Anthropic with your brief when you generate directions, so Claude can use its mood, shapes and style. Only its colours are used otherwise."}
              </p>
            </div>
          ) : null}

          {material.kind === "logo" ? (
            <label className={styles.checkbox}>
              <input type="checkbox" checked={material.keepColours} onChange={(e) => update({ keepColours: e.target.checked })} />
              Keep these colours exactly
            </label>
          ) : null}

          {material.use === "in-site" ? (
            <div className="ui-field">
              <label className="ui-label" htmlFor={`${id}-alt`}>
                <span>
                  Describe it for people who can&rsquo;t see it <span className="ui-label__optional">(recommended)</span>
                </span>
              </label>
              <input
                id={`${id}-alt`}
                className="ui-input ui-input--small"
                value={material.alt}
                maxLength={LIMITS.alt}
                placeholder={material.kind === "logo" ? "e.g. Ebbfield logo" : "e.g. Salt marsh at low tide"}
                onChange={(e) => update({ alt: e.target.value })}
              />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
