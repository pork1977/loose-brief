import { renderToStaticMarkup } from "react-dom/server";
import { SITE_CSS } from "@/components/website/site-css";
import { Website } from "@/components/website/Website";
import { SiteMediaContext, WebsiteFrameContext, type SiteMedia, type WebsiteFrame } from "@/components/website/WebsiteContext";
import { COAST, coastlineFrame } from "../coastline";
import type { Direction } from "../direction";
import { toCss } from "../exporters";
import { sectionOf } from "../website";
import { googleFontsUrl } from "./fonts";
import { SITE_SCRIPT } from "./site-script";

/*
 * The downloadable homepage: index.html, styles.css, site.js and a README.
 *
 * The page is rendered by the same Website component the Studio shows, in
 * export mode, and styled by the same stylesheet with the brand's tokens on
 * top. So the download is the page people designed, not a re-creation of it.
 */

export type ExportFiles = Record<string, string>;

const EXPORT_FRAME: WebsiteFrame = { interactive: true, exporting: true, scrollRoot: null, goTo: () => {} };

/** A small reset so the page looks the same without Loose Brief's own styles around it. */
const BASE_CSS = String.raw`*,
*::before,
*::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
}
body {
  min-height: 100vh;
  background: var(--color-background);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}
img,
svg {
  display: block;
  max-width: 100%;
}
input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}
ol,
ul {
  padding: 0;
  list-style: none;
}
a {
  color: inherit;
}
[hidden] {
  display: none !important;
}
.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* Leave room for the sticky navigation when jumping to a section. */
.ws-anchor,
#top {
  scroll-margin-top: 4.5rem;
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "brand";

type SiteOptions = { brandName: string; direction: Direction; followSystem: boolean; media?: SiteMedia };

export function buildStaticSite({ brandName, direction, followSystem, media = {} }: SiteOptions): ExportFiles {
  const markup = renderToStaticMarkup(
    <WebsiteFrameContext.Provider value={EXPORT_FRAME}>
      <SiteMediaContext.Provider value={media}>
        <Website brandName={brandName} direction={direction} />
      </SiteMediaContext.Provider>
    </WebsiteFrameContext.Provider>,
  )
    // The illustration puts the stylesheet inline for the Studio; the download links styles.css instead.
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    // Token inspector hooks are for the editor only.
    .replace(/ data-tokens="[^"]*"/g, "");

  const showsExplorer = !sectionOf(direction.website, "data").hidden;
  const frames = showsExplorer
    ? JSON.stringify({
        firstYear: COAST.firstYear,
        lastYear: COAST.lastYear,
        frames: Array.from({ length: COAST.lastYear - COAST.firstYear + 1 }, (_, i) => {
          const { contours, lost, land, shore, tide, sites, projected } = coastlineFrame(COAST.firstYear + i);
          return { contours, lost, land, shore, tide, sites, projected };
        }),
      }).replace(/</g, "\\u003c")
    : null;

  const title = escapeHtml(brandName);
  const description = escapeHtml(direction.sample.body);

  const html = `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="generator" content="Loose Brief" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${escapeHtml(googleFontsUrl(direction.tokens))}" />
    <link rel="stylesheet" href="styles.css" />
    <script src="site.js" defer></script>
  </head>
  <body>
    ${markup}
${frames ? `    <script type="application/json" id="coastline-frames">${frames}</script>\n` : ""}  </body>
</html>
`;

  const css = [
    `/*\n * ${brandName} homepage styles. Made with Loose Brief.\n * 1. Brand tokens (change a value here and it changes everywhere)\n * 2. A small reset\n * 3. Page styles, which only ever read the tokens\n */`,
    toCss(direction.tokens, brandName, { followSystem }),
    BASE_CSS,
    SITE_CSS.trim(),
    "",
  ].join("\n\n");

  return {
    "index.html": html,
    "styles.css": css,
    "site.js": SITE_SCRIPT,
    "README.txt": siteReadme(brandName, followSystem, showsExplorer, Object.keys(media).length > 0),
  };
}

function siteReadme(brandName: string, followSystem: boolean, showsExplorer: boolean, hasImages: boolean): string {
  return `${brandName} homepage
${"=".repeat(brandName.length + 9)}

Made with Loose Brief.

What's in this folder
---------------------
index.html   The page.
styles.css   Your brand tokens at the top, then the page styles. The page styles
             only read the tokens, so changing a colour or font at the top
             changes it everywhere.
site.js      The mobile menu, the form, sections fading in${showsExplorer ? " and the coastline explorer" : ""}.
             Plain JavaScript, no libraries.
${hasImages ? "images/      The logo and photo you chose to show on the site.\n" : ""}
Looking at it
-------------
Open index.html in any browser. Fonts load from Google Fonts, so you need an
internet connection for the page to look right.

Putting it online
-----------------
It's a static site: upload the whole folder to any web host. Services such as
Netlify Drop, Cloudflare Pages or GitHub Pages will host a folder like this.

Before you publish
------------------
- The form doesn't send anything yet. It checks the email address and shows a
  thank-you message. To receive requests, point the form at a form service or
  your own server: add action="..." and method="post" to the <form> tag in
  index.html, and remove the submit handler in site.js.
- Check every figure, name and quote on the page is real and yours to use.
  The demo brand's content is made up and labelled as illustrative.
${followSystem ? "- The page follows the visitor's light or dark setting. To lock it to one,\n  add data-theme=\"light\" or data-theme=\"dark\" to the <html> tag.\n" : "- To use the other colour set, add data-theme=\"light\" or data-theme=\"dark\"\n  to the <html> tag.\n"}
Fonts
-----
The fonts are served by Google Fonts under the SIL Open Font License, which
allows use on websites.
`;
}
