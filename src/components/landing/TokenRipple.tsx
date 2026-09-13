"use client";

import { useMemo, useState } from "react";
import { BrandScope } from "@/components/brand/BrandScope";
import { DEMO_BRAND_NAME, littoralIntelligence } from "@/data/demo-directions";
import { brandFont } from "@/lib/brand-fonts";
import { compileTokens, withToken, type BrandTokens, type Hex } from "@/lib/tokens";
import styles from "./TokenRipple.module.css";

/*
 * "Change it once": three controls edit tokens on the Littoral Intelligence
 * direction, and five unrelated-looking surfaces all update because they only
 * ever read those tokens.
 */

const PRIMARIES: { name: string; value: Hex }[] = [
  { name: "Ocean", value: "#083B66" },
  { name: "Kelp", value: "#1F5E52" },
  { name: "Harbour", value: "#3B4A6B" },
  { name: "Rust", value: "#9A3412" },
];

const CORNERS = {
  square: { label: "Square", medium: "4px", large: "6px", button: "small", card: "small" },
  soft: { label: "Soft", medium: "10px", large: "16px", button: "medium", card: "medium" },
  round: { label: "Round", medium: "14px", large: "22px", button: "pill", card: "large" },
} as const;
type Corner = keyof typeof CORNERS;

const TYPE = {
  editorial: { label: "Editorial", family: "instrument-serif", weight: 400, lineHeight: 0.95, letterSpacing: "-0.01em" },
  technical: { label: "Technical", family: "space-grotesk", weight: 600, lineHeight: 1, letterSpacing: "-0.03em" },
} as const;
type TypeStyle = keyof typeof TYPE;

type Changed = "color" | "radius" | "type";

function buildTokens(primary: Hex, corner: Corner, type: TypeStyle): BrandTokens {
  const c = CORNERS[corner];
  const t = TYPE[type];
  let tokens = littoralIntelligence.tokens;
  tokens = withToken(tokens, "color.brand.primary", primary);
  tokens = withToken(tokens, "color.button.primary", primary);
  tokens = withToken(tokens, "radius.medium", c.medium);
  tokens = withToken(tokens, "radius.large", c.large);
  tokens = withToken(tokens, "radius.button", c.button);
  tokens = withToken(tokens, "radius.card", c.card);
  tokens = withToken(tokens, "typography.display", {
    family: t.family,
    weight: t.weight,
    lineHeight: t.lineHeight,
    letterSpacing: t.letterSpacing,
  });
  return tokens;
}

export function TokenRipple() {
  const [primary, setPrimary] = useState<Hex>(PRIMARIES[0].value);
  const [corner, setCorner] = useState<Corner>("square");
  const [type, setType] = useState<TypeStyle>("editorial");
  const [changed, setChanged] = useState<{ what: Changed; n: number }>({ what: "color", n: 0 });

  const tokens = useMemo(() => buildTokens(primary, corner, type), [primary, corner, type]);
  const vars = compileTokens(tokens);
  const touch = (what: Changed) => setChanged((prev) => ({ what, n: prev.n + 1 }));

  return (
    <div className={styles.ripple}>
      <form className={styles.controls} onSubmit={(e) => e.preventDefault()}>
        <fieldset className={styles.field}>
          <legend>Primary colour</legend>
          <div className={styles.options}>
            {PRIMARIES.map((p) => (
              <label key={p.value} className={styles.option}>
                <input
                  type="radio"
                  name="primary"
                  value={p.value}
                  checked={primary === p.value}
                  onChange={() => {
                    setPrimary(p.value);
                    touch("color");
                  }}
                />
                <span className="ui-swatch" style={{ background: p.value }} aria-hidden="true" />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.field}>
          <legend>Corners</legend>
          <div className={styles.options}>
            {(Object.keys(CORNERS) as Corner[]).map((key) => (
              <label key={key} className={styles.option}>
                <input
                  type="radio"
                  name="corner"
                  value={key}
                  checked={corner === key}
                  onChange={() => {
                    setCorner(key);
                    touch("radius");
                  }}
                />
                {CORNERS[key].label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.field}>
          <legend>Display type</legend>
          <div className={styles.options}>
            {(Object.keys(TYPE) as TypeStyle[]).map((key) => (
              <label key={key} className={styles.option}>
                <input
                  type="radio"
                  name="type"
                  value={key}
                  checked={type === key}
                  onChange={() => {
                    setType(key);
                    touch("type");
                  }}
                />
                {TYPE[key].label}
              </label>
            ))}
          </div>
        </fieldset>

        <pre className={styles.code} aria-label="Tokens currently set">
          <code>
            <TokenLine name="--color-brand-primary" value={primary} flash={changed.what === "color"} n={changed.n} />
            <TokenLine name="--radius-button" value={vars["--radius-button"]} flash={changed.what === "radius"} n={changed.n} />
            <TokenLine
              name="--font-display"
              value={brandFont(tokens.typography.display.family).name}
              flash={changed.what === "type"}
              n={changed.n}
            />
          </code>
        </pre>
      </form>

      <BrandScope tokens={tokens} className={styles.surfaces} aria-hidden="true">
        <div className={`${styles.surface} ${styles.navSurface}`}>
          <span className={styles.logo}>{DEMO_BRAND_NAME}</span>
          <span className={styles.link}>Platform</span>
          <span className={styles.button}>Request a demo</span>
        </div>

        <div className={`${styles.surface} ${styles.statSurface}`}>
          <span className={styles.label}>Shoreline retreat</span>
          <span className={styles.stat}>1.4 m a year</span>
          <svg viewBox="0 0 200 60" className={styles.spark} preserveAspectRatio="none">
            <path d="M0,48 C30,46 40,40 70,38 C100,36 110,24 140,22 C165,20 180,12 200,8" />
          </svg>
          <span className={styles.label}>Illustrative figures</span>
        </div>

        <div className={`${styles.surface} ${styles.socialSurface}`}>
          <span className={styles.label}>{DEMO_BRAND_NAME} / Field notes</span>
          <span className={styles.socialHeadline}>What ten years of tides told us.</span>
        </div>

        <div className={`${styles.surface} ${styles.cardSurface}`}>
          <span className={styles.cardTitle}>Shoreline forecasts</span>
          <span className={styles.cardBody}>Projected change for every stretch of coast you manage.</span>
          <span className={styles.textLink}>Read more</span>
        </div>

        <div className={`${styles.surface} ${styles.phoneSurface}`}>
          <span className={styles.phoneHeadline}>See the shoreline before it changes.</span>
          <span className={`${styles.button} ${styles.phoneButton}`}>Request a demo</span>
        </div>
      </BrandScope>
    </div>
  );
}

function TokenLine({ name, value, flash, n }: { name: string; value: string; flash: boolean; n: number }) {
  return (
    <span key={flash ? n : undefined} className={flash && n > 0 ? styles.flash : undefined}>
      <span className={styles.codeName}>{name}</span>: {value};{"\n"}
    </span>
  );
}
