import assert from "node:assert/strict";
import { test } from "node:test";
import { strFromU8, unzipSync } from "fflate";
import { SITE_CSS } from "../../components/website/site-css";
import { DEMO_BRIEF } from "../../data/demo-brief";
import { DEMO_DIRECTIONS, littoralIntelligence } from "../../data/demo-directions";
import { directionSchema } from "../direction";
import { LAYOUTS, motif, type MotifId } from "../motifs";
import { withToken } from "../tokens";
import { everythingZip, siteFiles, siteZip, textExports } from "./bundle";
import { googleFontsUrl } from "./fonts";
import { SITE_SCRIPT } from "./site-script";
import { slugify } from "./site";

const input = (direction = littoralIntelligence) => ({ brandName: "Ebbfield", direction, brief: DEMO_BRIEF });

test("the exported page contains every visible section with a working anchor, and nothing Studio-only", () => {
  for (const direction of DEMO_DIRECTIONS) {
    const { "index.html": html } = siteFiles(input(direction));
    for (const type of ["credibility", "problem", "how", "data", "features", "impact", "cta", "footer"]) {
      assert.match(html, new RegExp(`id="${type}"`), `${direction.name}: ${type}`);
    }
    for (const link of html.matchAll(/href="#([a-z-]+)"/g)) {
      assert.match(html, new RegExp(`id="${link[1]}"`), `${direction.name}: link to #${link[1]} has no target`);
    }
    assert.doesNotMatch(html, /tabindex="-1"/, "export must be keyboard usable");
    assert.doesNotMatch(html, /<style/, "styles belong in styles.css");
    assert.doesNotMatch(html, /data-tokens=/, "inspector attributes don't ship");
    assert.doesNotMatch(html, /Preview only/);
    assert.match(html, new RegExp(direction.sample.headline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("hidden sections are left out of the export, and so is the explorer data when its section is hidden", () => {
  const dataIndex = littoralIntelligence.website.sections.findIndex((s) => s.type === "data");
  const hidden = { ...littoralIntelligence, website: { ...littoralIntelligence.website, sections: littoralIntelligence.website.sections.map((s, i) => (i === dataIndex ? { ...s, hidden: true } : s)) } };
  const { "index.html": html } = siteFiles(input(hidden));
  assert.doesNotMatch(html, /id="data"/);
  assert.doesNotMatch(html, /coastline-frames/);
});

test("every class the exported page uses is defined in its stylesheet", () => {
  // The demo's coastline drawings, plus shape illustrations in every style and arrangement.
  const withShapes = (["contours", "grid", "soft"] as const).flatMap((visual) =>
    LAYOUTS.map((layout) => ({ ...littoralIntelligence, visual, illustration: { motifs: ["car", "pin", "route"] as MotifId[], layout } })),
  );
  for (const direction of [...DEMO_DIRECTIONS, ...withShapes]) {
    const { "index.html": html, "styles.css": css } = siteFiles(input(direction));
    const used = new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => /^w[svx]-/.test(c)));
    const missing = [...used].filter((c) => !css.includes(`.${c}`));
    // A few classes are hooks with no styling of their own.
    const unstyled = new Set(["ws-anchor", "ws-how", "ws-features"]);
    assert.deepEqual(missing.filter((c) => !unstyled.has(c)), [], `${direction.visual} ${direction.illustration?.layout ?? "coastline"}`);
  }
});

test("a shape illustration draws the chosen shapes, and only the demo's coastline has labels", () => {
  const car = motif("car").paths[0];
  for (const layout of LAYOUTS) {
    const direction = { ...littoralIntelligence, illustration: { motifs: ["car", "pin"] as MotifId[], layout } };
    const { "index.html": html } = siteFiles(input(direction));
    const hero = /<div class="ws-hero-visual">[\s\S]*?<\/div>/.exec(html)?.[0] ?? "";
    assert.ok(hero.includes(car), layout);
    assert.doesNotMatch(hero, /<text|Illustrative/, layout);
  }
  assert.ok(directionSchema.safeParse({ ...littoralIntelligence, illustration: { motifs: ["car", "car"], layout: "hero" } }).success === false, "a shape can't repeat");
  assert.ok(directionSchema.safeParse({ ...littoralIntelligence, illustration: { motifs: ["dragon"], layout: "hero" } }).success === false, "only library shapes");
  const older: Partial<typeof littoralIntelligence> = { ...littoralIntelligence };
  delete older.illustration;
  assert.equal(directionSchema.parse(older).illustration, null, "saves from before illustrations still load");
});

test("images marked 'show it on the site' go in the zip, the nav logo and the hero", () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  const siteMedia = { media: { logo: { src: "images/logo.png", alt: "" }, hero: { src: "images/hero.jpg", alt: "Loaves cooling on a rack" } }, files: { "images/logo.png": png, "images/hero.jpg": png } };
  const withMedia = { ...input(), siteMedia };
  const { "index.html": html } = siteFiles(withMedia);
  assert.match(html, /<img src="images\/logo\.png" alt="" class="ws-logo-image"/);
  assert.match(html, /<img src="images\/hero\.jpg" alt="Loaves cooling on a rack" class="ws-hero-image"/);
  assert.doesNotMatch(/<div class="ws-hero-visual">[\s\S]*?<\/div>/.exec(html)?.[0] ?? "", /<svg/, "the photo replaces the illustration");
  const site = unzipSync(siteZip(withMedia));
  assert.ok(site["images/logo.png"] && site["images/hero.jpg"]);
  const all = unzipSync(everythingZip(withMedia));
  assert.ok(all["website/images/hero.jpg"]);
  // Without any, nothing changes.
  assert.doesNotMatch(siteFiles(input())["index.html"], /<img/);
});

test("the explorer data has a frame for every year, matching the slider", () => {
  const { "index.html": html } = siteFiles(input());
  const json = html.match(/<script type="application\/json" id="coastline-frames">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(json);
  const data = JSON.parse(json);
  assert.equal(data.frames.length, data.lastYear - data.firstYear + 1);
  assert.match(html, new RegExp(`min="${data.firstYear}"`));
  assert.match(html, new RegExp(`max="${data.lastYear}"`));
});

test("the site script is valid JavaScript", () => {
  assert.doesNotThrow(() => new Function(SITE_SCRIPT));
});

test("styles.css leads with the brand tokens, including font family names", () => {
  const { "styles.css": css } = siteFiles(input());
  assert.ok(css.indexOf("--color-brand-primary: #083B66") < css.indexOf(".ws-site"));
  assert.match(css, /--face-instrument-serif: "Instrument Serif"/);
  assert.doesNotMatch(css, /__[A-Za-z0-9]{5,}/, "no CSS module hashes");
});

test("Google Fonts requests only the families and weights in use", () => {
  const url = googleFontsUrl(littoralIntelligence.tokens);
  assert.match(url, /family=Instrument\+Serif&/);
  assert.match(url, /family=Inter:wght@400;600/);
  assert.match(url, /family=IBM\+Plex\+Mono:wght@500/);
  const swapped = withToken(littoralIntelligence.tokens, "typography.body.family", "dm-sans");
  assert.doesNotMatch(googleFontsUrl(swapped), /Inter/);
});

test("the Tailwind theme, DESIGN.md, guidelines and copy deck reflect the brand", () => {
  const text = textExports(input());
  assert.match(text["tailwind-theme.css"], /@theme \{[\s\S]*--color-brand-primary: #083B66;[\s\S]*--font-display: "Instrument Serif"/);
  assert.match(text["tailwind-theme.css"], /\[data-theme="dark"\]/);
  assert.match(text["DESIGN.md"], /^# Ebbfield design system/);
  assert.match(text["DESIGN.md"], /\| Primary \| `--color-brand-primary` \| `#083B66` \|/);
  assert.match(text["DESIGN.md"], /Evidence you can plan around\./);
  assert.equal((text["brand-guidelines.html"].match(/class="chip"/g) ?? []).length, 24, "12 colour roles in two modes");
  for (const section of littoralIntelligence.website.sections) {
    if ("title" in section) assert.ok(text["copy-deck.md"].includes(section.title), section.type);
  }
  assert.doesNotThrow(() => JSON.parse(text["tokens.json"]));
  assert.doesNotThrow(() => JSON.parse(text["site-content.json"]));
});

test("zips contain the files they should", () => {
  const site = unzipSync(siteZip(input()));
  assert.deepEqual(Object.keys(site).sort(), ["README.txt", "index.html", "site.js", "styles.css"]);
  const all = unzipSync(everythingZip(input(), { "link-card.png": new Uint8Array([1, 2, 3]) }));
  const names = Object.keys(all);
  for (const name of ["social/link-card.png", "website/index.html", "tokens/tokens.css", "tokens/tailwind-theme.css", "DESIGN.md", "brand-guidelines.html", "copy-deck.md", "site-content.json"]) {
    assert.ok(names.includes(name), name);
  }
  assert.match(strFromU8(all["DESIGN.md"]), /Ebbfield/);
});

test("file names are safe slugs", () => {
  assert.equal(slugify("Ebbfield"), "ebbfield");
  assert.equal(slugify("  Harbour & Hill Co.  "), "harbour-hill-co");
  assert.equal(slugify("Café Noël"), "cafe-noel");
  assert.equal(slugify("!!!"), "brand");
});

test("the shared stylesheet has no editor-only rules", () => {
  assert.doesNotMatch(SITE_CSS, /inspect-hit|data-flash|--ui-/);
});
