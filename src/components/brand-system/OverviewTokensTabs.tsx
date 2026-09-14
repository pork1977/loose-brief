"use client";

import { useState } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { brandFont } from "@/lib/brand-fonts";
import type { Direction } from "@/lib/direction";
import { toCss, toDesignTokensJson } from "@/lib/exporters";
import { healthChecks, healthScore } from "@/lib/health";
import { TOKEN_GROUPS, TOKEN_INFO } from "@/lib/token-registry";
import { colorsFor, compileTokens, type Mode } from "@/lib/tokens";
import { EditorSection, useInspect } from "./controls";
import styles from "./tabs.module.css";

export function OverviewTab({ direction, brandName, mode, sourceName }: { direction: Direction; brandName: string; mode: Mode; sourceName: string }) {
  const c = colorsFor(direction.tokens, mode);
  const t = direction.tokens;
  return (
    <div className={styles.tab}>
      <EditorSection title="The brand in brief" description={`Started from ${sourceName}. Change anything in the other tabs.`}>
        <BrandScope tokens={t} mode={mode} className={styles.overviewCard}>
          <p className={styles.overviewLabel}>{brandName}</p>
          <p className={styles.overviewPromise}>{direction.strategy.promise}</p>
          <p className={styles.overviewPositioning}>{direction.strategy.positioning}</p>
          <div className={styles.overviewSwatches} aria-label="Key colours">
            {[c.brand.primary, c.brand.secondary, c.brand.accent, c.surface.page, c.text.primary].map((hex, i) => (
              <span key={`${hex}-${i}`} style={{ background: hex }} title={hex} />
            ))}
          </div>
        </BrandScope>
      </EditorSection>

      <EditorSection title="At a glance">
        <dl className={styles.glance}>
          <div>
            <dt>Tone of voice</dt>
            <dd>{direction.voice.tone}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>
              {brandFont(t.typography.display.family).name} with {brandFont(t.typography.body.family).name}
            </dd>
          </div>
          <div>
            <dt>Corners</dt>
            <dd>
              Buttons {t.radius.button}, cards {t.radius.card}
            </dd>
          </div>
          <div>
            <dt>Motion</dt>
            <dd>{direction.motion.style}</dd>
          </div>
          <div>
            <dt>Imagery</dt>
            <dd>{direction.imagery.style}</dd>
          </div>
          <div>
            <dt>Leads with</dt>
            <dd>{t.mode === "light" ? "Light mode" : "Dark mode"}</dd>
          </div>
        </dl>
      </EditorSection>

      <EditorSection title="Identity health" description="Rule-based checks, each explained. Contrast counts for most of the score.">
        <HealthList direction={direction} />
      </EditorSection>
    </div>
  );
}

export function HealthMeter({ direction, compact = false }: { direction: Direction; compact?: boolean }) {
  const checks = healthChecks(direction.tokens);
  const score = healthScore(checks);
  const passing = checks.filter((c) => c.passes).length;
  return (
    <div className={styles.meter} data-compact={compact}>
      <div
        className={styles.meterTrack}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-label="Identity health"
        aria-valuetext={`${score}%. ${passing} of ${checks.length} checks pass.`}
      >
        <span className={styles.meterFill} data-level={score >= 90 ? "good" : score >= 60 ? "fair" : "poor"} style={{ width: `${score}%` }} />
      </div>
      <p className={styles.meterText}>
        <strong>{score}%</strong> identity health &middot; {passing} of {checks.length} checks pass
      </p>
    </div>
  );
}

function HealthList({ direction }: { direction: Direction }) {
  const checks = healthChecks(direction.tokens);
  return (
    <>
      <HealthMeter direction={direction} />
      <ul className={styles.healthList}>
        {checks.map((check) => (
          <li key={check.id} data-passes={check.passes}>
            <span className={styles.healthIcon} aria-hidden="true">
              {check.passes ? "✓" : "!"}
            </span>
            <div>
              <p className={styles.healthLabel}>
                {check.label}
                <span className="visually-hidden">{check.passes ? " (passes)" : " (needs attention)"}</span>
              </p>
              <p className={styles.healthDetail}>{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function TokensTab({ direction, mode, brandName }: { direction: Direction; mode: Mode; brandName: string }) {
  const [format, setFormat] = useState<"table" | "css" | "json">("table");
  const [copied, setCopied] = useState(false);
  const compiled = compileTokens(direction.tokens, mode);
  const output = format === "css" ? toCss(direction.tokens, brandName) : format === "json" ? toDesignTokensJson(direction.tokens) : "";

  return (
    <div className={styles.tab}>
      <EditorSection
        title="Token inspector"
        description="Every value the site reads. Hover or focus a row to see where it's used in the preview."
        actions={
          <div className={styles.buttonGroup} role="group" aria-label="View as">
            {(["table", "css", "json"] as const).map((f) => (
              <button key={f} type="button" className="ui-button ui-button--small" aria-pressed={format === f} onClick={() => setFormat(f)}>
                {f === "table" ? "Table" : f.toUpperCase()}
              </button>
            ))}
          </div>
        }
      >
        {format === "table" ? (
          TOKEN_GROUPS.map((group) => (
            <div key={group} className={styles.tokenGroup}>
              <h4 className={styles.tokenGroupTitle}>{group}</h4>
              <ul className={styles.tokenList}>
                {Object.entries(TOKEN_INFO)
                  .filter(([, info]) => info.group === group)
                  .map(([name, info]) => (
                    <TokenRow key={name} name={name} value={compiled[name as `--${string}`] ?? ""} label={info.label} description={info.description} usedBy={info.usedBy} />
                  ))}
              </ul>
            </div>
          ))
        ) : (
          <div className={styles.codeWrap}>
            <button
              type="button"
              className="ui-button ui-button--small"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(output);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <pre className={styles.code} tabIndex={0} aria-label={`${format.toUpperCase()} tokens`}>
              <code>{output}</code>
            </pre>
          </div>
        )}
      </EditorSection>
    </div>
  );
}

function TokenRow({ name, value, label, description, usedBy }: { name: string; value: string; label: string; description: string; usedBy: string[] }) {
  const inspect = useInspect([name]);
  const isColour = /^#[0-9A-F]{6}$/i.test(value);
  return (
    <li className={styles.tokenRow} tabIndex={0} {...inspect}>
      <div className={styles.tokenName}>
        <code>{name}</code>
        <span>{label}</span>
      </div>
      <div className={styles.tokenValue}>
        {isColour ? <span className={styles.tokenSwatch} style={{ background: value }} aria-hidden="true" /> : null}
        <code title={value}>{value}</code>
      </div>
      <p className={styles.tokenUse}>
        {description} <span className={styles.tokenUsedBy}>Used by: {usedBy.join(", ")}.</span>
      </p>
    </li>
  );
}
