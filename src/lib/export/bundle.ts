import { strToU8, zipSync, type Zippable } from "fflate";
import type { BriefDraft } from "../brief";
import type { Direction } from "../direction";
import { toCss, toDesignTokensJson, toTailwindTheme } from "../exporters";
import { toCopyDeck, toDesignMd, toGuidelinesHtml, toSiteContentJson } from "./documents";
import { buildStaticSite, slugify, type ExportFiles } from "./site";

/*
 * Every export in one place, and the zip files people download. Text exports
 * are built here; social card images are drawn in the browser and passed in.
 */

export type ExportInput = { brandName: string; direction: Direction; brief: BriefDraft };

export function exportFileName(brandName: string, suffix: string) {
  return `${slugify(brandName)}-${suffix}`;
}

export function siteFiles({ brandName, direction, brief }: ExportInput): ExportFiles {
  return buildStaticSite({ brandName, direction, followSystem: brief.theme === "both" });
}

export function textExports(input: ExportInput) {
  const { brandName, direction } = input;
  return {
    "tokens.css": toCss(direction.tokens, brandName, { followSystem: input.brief.theme === "both" }),
    "tokens.json": toDesignTokensJson(direction.tokens),
    "tailwind-theme.css": toTailwindTheme(direction.tokens, brandName),
    "DESIGN.md": toDesignMd(input),
    "brand-guidelines.html": toGuidelinesHtml(input),
    "copy-deck.md": toCopyDeck(input),
    "site-content.json": toSiteContentJson(input),
  };
}

const zip = (tree: Zippable) => zipSync(tree, { level: 6 });

const asZippable = (files: Record<string, string | Uint8Array>): Zippable =>
  Object.fromEntries(Object.entries(files).map(([name, content]) => [name, typeof content === "string" ? strToU8(content) : content]));

/** The homepage on its own: index.html, styles.css, site.js, README.txt. */
export function siteZip(input: ExportInput): Uint8Array {
  return zip(asZippable(siteFiles(input)));
}

/** Everything: the site in its own folder, tokens, documents and any social images. */
export function everythingZip(input: ExportInput, images: Record<string, Uint8Array> = {}): Uint8Array {
  const text = textExports(input);
  return zip({
    website: asZippable(siteFiles(input)),
    tokens: asZippable({ "tokens.css": text["tokens.css"], "tokens.json": text["tokens.json"], "tailwind-theme.css": text["tailwind-theme.css"] }),
    "DESIGN.md": strToU8(text["DESIGN.md"]),
    "brand-guidelines.html": strToU8(text["brand-guidelines.html"]),
    "copy-deck.md": strToU8(text["copy-deck.md"]),
    "site-content.json": strToU8(text["site-content.json"]),
    ...(Object.keys(images).length ? { social: images } : {}),
  });
}
