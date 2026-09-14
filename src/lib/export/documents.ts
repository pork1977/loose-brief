import { formatRatio, runContrastChecks } from "../accessibility";
import type { BriefDraft } from "../brief";
import { brandFont } from "../brand-fonts";
import type { Direction } from "../direction";
import { healthChecks, healthScore } from "../health";
import { MODES, compileTokens, colorsFor, spaceScale, SPACE_STEPS, type Mode } from "../tokens";
import { SECTION_LABELS, type Section } from "../website";
import { faceVariables, googleFontsUrl } from "./fonts";

/*
 * Written exports: DESIGN.md, the brand guidelines page, the copy deck and
 * the site content as JSON. All of it is generated from the brand as it
 * stands, so it matches the tokens and the site exactly.
 */

type Doc = { brandName: string; direction: Direction; brief: BriefDraft };

const COLOUR_ROLES: { path: string; label: string; use: string }[] = [
  { path: "brand.primary", label: "Primary", use: "The main brand colour" },
  { path: "brand.secondary", label: "Secondary", use: "Fills, dividers, supporting shapes" },
  { path: "brand.accent", label: "Accent", use: "Highlights, icons and data. Not for text" },
  { path: "surface.page", label: "Page", use: "Page background" },
  { path: "surface.card", label: "Card", use: "Cards and raised panels" },
  { path: "surface.inverse", label: "Inverse", use: "Contrasting bands" },
  { path: "text.primary", label: "Text", use: "Headlines and main text" },
  { path: "text.secondary", label: "Secondary text", use: "Body copy and labels" },
  { path: "text.inverse", label: "Inverse text", use: "Text on inverse bands" },
  { path: "button.primary", label: "Button", use: "Main calls to action" },
  { path: "button.primaryText", label: "Button label", use: "Text on buttons" },
  { path: "border.subtle", label: "Border", use: "Hairlines and outlines" },
];

const pick = (obj: unknown, path: string) => path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], obj) as string;
const cssVarFor = (path: string) =>
  ({
    "brand.primary": "--color-brand-primary",
    "brand.secondary": "--color-brand-secondary",
    "brand.accent": "--color-brand-accent",
    "surface.page": "--color-background",
    "surface.card": "--color-surface",
    "surface.inverse": "--color-surface-inverse",
    "text.primary": "--color-text-primary",
    "text.secondary": "--color-text-secondary",
    "text.inverse": "--color-text-inverse",
    "button.primary": "--color-button-primary",
    "button.primaryText": "--color-button-primary-text",
    "border.subtle": "--color-border",
  })[path];

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------- DESIGN.md */

export function toDesignMd({ brandName, direction, brief }: Doc): string {
  const t = direction.tokens;
  const { display, body, label } = t.typography;
  const scale = spaceScale(t);
  const other: Mode = t.mode === "light" ? "dark" : "light";
  const checks = healthChecks(t);

  const colourTable = (mode: Mode) => {
    const set = colorsFor(t, mode);
    return [
      "| Role | Token | Hex | Use |",
      "| --- | --- | --- | --- |",
      ...COLOUR_ROLES.map((r) => `| ${r.label} | \`${cssVarFor(r.path)}\` | \`${pick(set, r.path)}\` | ${r.use} |`),
    ].join("\n");
  };

  const contrastList = (mode: Mode) =>
    runContrastChecks(t, mode)
      .map((r) => `- ${r.passes ? "Pass" : "**Fails**"}: ${r.label}, ${formatRatio(r.ratio)} (needs ${r.minimum}:1)`)
      .join("\n");

  return `# ${brandName} design system

Made with Loose Brief from the ${direction.name} direction. This file describes the brand for designers, developers and AI coding tools. The values here match \`tokens.css\`, \`tokens.json\` and the exported homepage exactly.

${brief.oneLiner.trim() ? `> ${brief.oneLiner.trim()}\n\n` : ""}## Strategy

**Positioning.** ${direction.strategy.positioning}

**Promise.** ${direction.strategy.promise}

**Audience.** ${brief.audience.join(", ") || "Not specified"}.

**Primary action.** ${brief.primaryAction.trim() || "Not specified"}.

## Voice

- **Tone:** ${direction.voice.tone}
- **Example:** "${direction.voice.example}"
- **Words it uses:** ${direction.voice.words.join(", ")}
${brief.avoid.length ? `- **Avoid:** ${brief.avoid.join(", ")}\n` : ""}
## Colour

The brand leads with **${t.mode} mode**. Both colour sets use the same token names, so components work in either without changes. To switch, set \`data-theme="${other}"\` on the \`<html>\` element.

### ${t.mode === "light" ? "Light" : "Dark"} (default)

${colourTable(t.mode)}

### ${other === "light" ? "Light" : "Dark"}

${colourTable(other)}

### Rules

- Put text only on Page, Card or Inverse surfaces, using the matching text token.
- The accent is for icons, lines and data highlights. Don't set text in it.
- Buttons use Button with Button label, nothing else.

### Contrast (WCAG 2)

${MODES.map((mode) => `**${mode === "light" ? "Light" : "Dark"}**\n\n${contrastList(mode)}`).join("\n\n")}

## Typography

| Role | Font | Weight | Line height | Letter spacing | Token |
| --- | --- | --- | --- | --- | --- |
| Display | ${brandFont(display.family).name} | ${display.weight} | ${display.lineHeight} | ${display.letterSpacing} | \`--font-display\` |
| Body | ${brandFont(body.family).name} | ${body.weight} | ${body.lineHeight} | normal | \`--font-body\` |
| Label | ${brandFont(label.family).name} | ${label.weight} | normal | ${label.letterSpacing} | \`--font-label\` |

- Display is for headlines, the logo and large figures. Keep headlines short.
- Body is for paragraphs, buttons and interface text.
- Labels are small${label.transform === "uppercase" ? ", set in capitals," : ""} and used for eyebrows, captions and data.
- All fonts are from Google Fonts: ${googleFontsUrl(t)}

## Spacing

A scale built from a base of ${t.space.base}, where each step up multiplies by ${t.space.ratio}. Use these steps rather than one-off values.

| Step | Token | Value |
| --- | --- | --- |
${SPACE_STEPS.map((s) => `| ${s} | \`--space-${s}\` | ${scale[s]}rem |`).join("\n")}

## Shape

- Corner radius: small ${t.radius.small}, medium ${t.radius.medium}, large ${t.radius.large}.
- Buttons use \`${t.radius.button}\` (\`--radius-button\`), cards use \`${t.radius.card}\` (\`--radius-card\`). Inputs, tags and icons use small.
- Card shadow (\`--shadow-card\`): \`${t.shadow.card}\`

## Motion

- ${direction.motion.style}. ${direction.motion.principle}
- Fast ${t.motion.fast} for hovers and small changes, normal ${t.motion.normal} for things appearing, slow ${t.motion.slow} for large movement.
- Easing: \`${t.motion.easing}\` (\`--motion-easing\`).
- Respect \`prefers-reduced-motion\`: remove movement for people who ask.

## Imagery

- **Style:** ${direction.imagery.style}
- **Treatment:** ${direction.imagery.treatment}
- **Illustration:** ${direction.imagery.illustration}

## Components

- **Primary button:** background \`--color-button-primary\`, text \`--color-button-primary-text\`, radius \`--radius-button\`, body font at 600.
- **Secondary button:** 1px \`--color-border\` outline, text \`--color-text-primary\`, same radius.
- **Card:** \`--color-surface\`, 1px \`--color-border\`, \`--radius-card\`, \`--shadow-card\`, padding \`--space-m\`.
- **Eyebrow label:** \`--font-label\`, \`--color-text-secondary\`${label.transform === "uppercase" ? ", uppercase" : ""}, letter spacing \`--font-label-tracking\`.
- **Section:** vertical padding \`--space-2xl\`, content gap \`--space-l\`.

## For AI coding tools

When building UI for ${brandName}:

1. Import \`tokens.css\` and use its custom properties for every colour, font, radius, shadow and space. Never hard-code a hex value or pixel radius.
2. Use semantic tokens by purpose (\`--color-text-secondary\`), not by appearance.
3. Keep text contrast at 4.5:1 or more, and check both colour sets.
4. Follow the voice notes above for any copy you write.

## Identity health

${healthScore(checks)}% of rule-based checks pass.

${checks.map((c) => `- ${c.passes ? "Pass" : "Needs attention"}: ${c.label}. ${c.detail}`).join("\n")}
`;
}

/* -------------------------------------------------------------- copy deck */

function sectionCopy(section: Section): string {
  const heading = `## ${SECTION_LABELS[section.type]}${section.hidden ? " (hidden on the site)" : ""}`;
  const lines: string[] = [];
  const field = (name: string, value: string) => lines.push(`**${name}:** ${value}`);
  switch (section.type) {
    case "credibility":
      field("Label", section.label);
      lines.push(...section.items.map((i) => `- ${i}`));
      break;
    case "problem":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      field("Body", section.body);
      lines.push(...section.points.map((p) => `- ${p}`));
      break;
    case "how":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      lines.push(...section.steps.map((s, i) => `${i + 1}. **${s.title}.** ${s.body}`));
      break;
    case "data":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      field("Body", section.body);
      break;
    case "features":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      lines.push(...section.items.map((s) => `- **${s.title}.** ${s.body}`));
      break;
    case "impact":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      lines.push(...section.figures.map((f) => `- **${f.value}** ${f.label}`));
      field("Quote", `"${section.quote}" (${section.attribution})`);
      break;
    case "cta":
      field("Eyebrow", section.eyebrow);
      field("Title", section.title);
      field("Body", section.body);
      field("After sending", section.success);
      break;
    case "footer":
      field("Tagline", section.tagline);
      field("Links", section.links.join(", "));
      field("Small print", section.note);
      break;
  }
  return `${heading}\n\n${lines.join("\n\n")}`;
}

export function toCopyDeck({ brandName, direction }: Doc): string {
  const { sample, voice } = direction;
  return `# ${brandName} homepage copy

Every word on the homepage, in page order. Made with Loose Brief.

**Tone of voice:** ${voice.tone}. For example: "${voice.example}"

## Navigation

**Links:** ${sample.nav.join(", ")}

**Button:** ${sample.primaryCta}

## Hero

**Eyebrow:** ${sample.eyebrow}

**Headline:** ${sample.headline}

**Supporting line:** ${sample.body}

**Buttons:** ${sample.primaryCta} / ${sample.secondaryCta}

${direction.website.sections.map(sectionCopy).join("\n\n")}
`;
}

export function toSiteContentJson({ brandName, direction }: Doc): string {
  return JSON.stringify(
    {
      brand: brandName,
      direction: direction.name,
      strategy: direction.strategy,
      voice: direction.voice,
      hero: direction.sample,
      website: direction.website,
    },
    null,
    2,
  );
}

/* ------------------------------------------------------ guidelines (HTML) */

export function toGuidelinesHtml({ brandName, direction, brief }: Doc): string {
  const t = direction.tokens;
  const vars = { ...faceVariables(t), ...compileTokens(t, t.mode) };
  const scale = spaceScale(t);
  const e = escapeHtml;

  const swatches = (mode: Mode) => {
    const set = colorsFor(t, mode);
    return COLOUR_ROLES.map((r) => {
      const hex = pick(set, r.path);
      return `<li><span class="chip" style="background:${hex}"></span><strong>${e(r.label)}</strong><code>${hex}</code><small>${e(r.use)}</small></li>`;
    }).join("");
  };

  const contrast = MODES.map(
    (mode) =>
      `<h3>${mode === "light" ? "Light" : "Dark"} mode</h3><table><thead><tr><th>Pairing</th><th>Ratio</th><th>Needs</th><th>Result</th></tr></thead><tbody>${runContrastChecks(t, mode)
        .map(
          (r) =>
            `<tr><td><span class="pair" style="background:${r.backgroundHex};color:${r.foregroundHex}">Aa</span> ${e(r.label)}</td><td>${formatRatio(r.ratio)}</td><td>${r.minimum}:1</td><td>${r.passes ? "Pass" : "<strong>Fails</strong>"}</td></tr>`,
        )
        .join("")}</tbody></table>`,
  ).join("");

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(brandName)} brand guidelines</title>
<link rel="stylesheet" href="${e(googleFontsUrl(t))}" />
<style>
:root { ${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ")} }
* { box-sizing: border-box; margin: 0; }
body { background: var(--color-background); color: var(--color-text-primary); font-family: var(--font-body); line-height: 1.6; }
main { max-width: 64rem; margin: 0 auto; padding: 0 1.5rem 4rem; }
section { padding: 3rem 0; border-top: 1px solid var(--color-border); break-inside: avoid; }
h1, h2, h3, .display { font-family: var(--font-display); font-weight: var(--font-display-weight); letter-spacing: var(--font-display-tracking); line-height: var(--font-display-leading); }
h1 { font-size: clamp(3rem, 8vw, 6rem); }
h2 { font-size: 2.25rem; margin-bottom: 1.25rem; }
h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; line-height: 1.2; }
p { max-width: 42rem; margin-bottom: 0.75rem; }
.label { font-family: var(--font-label); font-weight: var(--font-label-weight); letter-spacing: var(--font-label-tracking); text-transform: var(--font-label-transform); font-size: 0.8rem; color: var(--color-text-secondary); }
.cover { min-height: 70vh; display: flex; flex-direction: column; justify-content: flex-end; gap: 1rem; padding: 4rem 0 3rem; border-top: 0; }
.cover .promise { font-family: var(--font-display); font-size: 1.75rem; line-height: 1.2; max-width: 36rem; }
.swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1rem; list-style: none; padding: 0; }
.swatches li { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.85rem; }
.chip { display: block; height: 4.5rem; border-radius: var(--radius-small); box-shadow: inset 0 0 0 1px var(--color-border); margin-bottom: 0.4rem; }
.swatches small { color: var(--color-text-secondary); }
table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--color-border); }
.pair { display: inline-block; width: 2.25rem; text-align: center; border-radius: 4px; font-weight: 700; margin-right: 0.4rem; }
.specimen { padding: 1.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-card); background: var(--color-surface); margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1rem; }
.button { display: inline-block; padding: 0.75rem 1.25rem; border-radius: var(--radius-button); background: var(--color-button-primary); color: var(--color-button-primary-text); font-weight: 600; text-decoration: none; }
.button.secondary { background: transparent; color: var(--color-text-primary); box-shadow: inset 0 0 0 1px var(--color-border); }
.card { padding: 1.25rem; border: 1px solid var(--color-border); border-radius: var(--radius-card); background: var(--color-surface); box-shadow: var(--shadow-card); }
.space-row { display: grid; grid-template-columns: 3rem 1fr 5rem; gap: 0.75rem; align-items: center; font-size: 0.85rem; }
.space-row span:nth-child(2) { height: 0.6rem; background: var(--color-button-primary); border-radius: 2px; }
.inverse { background: var(--color-surface-inverse); color: var(--color-text-inverse); padding: 2rem; border-radius: var(--radius-card); }
footer { padding-top: 2rem; font-size: 0.8rem; color: var(--color-text-secondary); }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  section { padding: 1.5rem 0; }
  .cover { min-height: auto; page-break-after: always; }
  h2 { page-break-after: avoid; }
}
</style>
</head>
<body>
<main>
  <section class="cover">
    <p class="label">Brand guidelines</p>
    <h1>${e(brandName)}</h1>
    <p class="promise">${e(direction.strategy.promise)}</p>
    <p class="label">${e(direction.name)} &middot; Made with Loose Brief</p>
  </section>

  <section>
    <p class="label">01</p>
    <h2>Strategy</h2>
    <h3>Positioning</h3>
    <p>${e(direction.strategy.positioning)}</p>
    <h3>Audience</h3>
    <p>${e(brief.audience.join(", ") || "Not specified")}</p>
    <h3>Primary action</h3>
    <p>${e(brief.primaryAction.trim() || "Not specified")}</p>
  </section>

  <section>
    <p class="label">02</p>
    <h2>Voice</h2>
    <p><strong>${e(direction.voice.tone)}.</strong></p>
    <div class="inverse"><p class="display" style="font-size:1.75rem;line-height:1.2">&ldquo;${e(direction.voice.example)}&rdquo;</p></div>
    <h3>Words it uses</h3>
    <p>${e(direction.voice.words.join(", "))}</p>
    ${brief.avoid.length ? `<h3>Avoid</h3><p>${e(brief.avoid.join(", "))}</p>` : ""}
  </section>

  <section>
    <p class="label">03</p>
    <h2>Colour</h2>
    <p>The brand leads with ${t.mode} mode. Both sets share the same names, so any component works in either.</p>
    ${MODES.map((mode) => `<h3>${mode === "light" ? "Light" : "Dark"}${mode === t.mode ? " (default)" : ""}</h3><ul class="swatches">${swatches(mode)}</ul>`).join("")}
    <h3>Contrast</h3>
    ${contrast}
  </section>

  <section>
    <p class="label">04</p>
    <h2>Typography</h2>
    <div class="specimen"><p class="label">Display &middot; ${e(brandFont(t.typography.display.family).name)} ${t.typography.display.weight}</p><p class="display" style="font-size:3rem">${e(direction.sample.headline)}</p></div>
    <div class="specimen"><p class="label">Body &middot; ${e(brandFont(t.typography.body.family).name)} ${t.typography.body.weight}</p><p>${e(direction.sample.body)}</p></div>
    <div class="specimen"><p class="label">Label &middot; ${e(brandFont(t.typography.label.family).name)} ${t.typography.label.weight}</p><p class="label">${e(direction.sample.eyebrow)}</p></div>
  </section>

  <section>
    <p class="label">05</p>
    <h2>Spacing and shape</h2>
    ${SPACE_STEPS.map((s) => `<div class="space-row"><code>${s}</code><span style="width:${scale[s]}rem"></span><code>${scale[s]}rem</code></div>`).join("")}
    <h3>Corners and shadow</h3>
    <p>Small ${t.radius.small}, medium ${t.radius.medium}, large ${t.radius.large}. Buttons use ${t.radius.button}, cards use ${t.radius.card}.</p>
  </section>

  <section>
    <p class="label">06</p>
    <h2>Components</h2>
    <div class="grid">
      <div class="card"><p class="label">Buttons</p><p style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem"><a class="button" href="#">${e(direction.sample.primaryCta)}</a><a class="button secondary" href="#">${e(direction.sample.secondaryCta)}</a></p></div>
      <div class="card"><p class="label">Card</p><h3 style="margin-top:0.5rem">A card title</h3><p>Cards sit on the page in the card colour, with the card radius and shadow.</p></div>
    </div>
  </section>

  <section>
    <p class="label">07</p>
    <h2>Imagery and motion</h2>
    <h3>Imagery</h3>
    <p>${e(direction.imagery.style)}. ${e(direction.imagery.treatment)}.</p>
    <p>${e(direction.imagery.illustration)}</p>
    <h3>Motion</h3>
    <p>${e(direction.motion.style)}. ${e(direction.motion.principle)}</p>
    <p>Fast ${t.motion.fast}, normal ${t.motion.normal}, slow ${t.motion.slow}.</p>
  </section>

  <footer>Generated by Loose Brief. To save as a PDF, use your browser's Print option and choose Save as PDF.</footer>
</main>
</body>
</html>
`;
}
