"use client";

import { createContext, useContext } from "react";
import type { SectionType } from "@/lib/website";

/*
 * How the rendered homepage talks to whatever frame it's in.
 *
 * In the Studio it's a working site: links scroll its own frame and the form
 * responds. In a thumbnail (brand system, direction cards) it's a picture, so
 * `interactive` is false and nothing takes focus or animates in. When
 * `exporting`, it renders plain HTML for the downloadable site: real anchor
 * links and section ids, with the behaviour supplied by a small script.
 */
export type SiteTarget = SectionType | "top";

export type WebsiteFrame = {
  interactive: boolean;
  exporting: boolean;
  /** The element the page scrolls inside. Null when the page isn't scrolling on its own. */
  scrollRoot: HTMLElement | null;
  goTo: (target: SiteTarget) => void;
};

export const WebsiteFrameContext = createContext<WebsiteFrame>({
  interactive: false,
  exporting: false,
  scrollRoot: null,
  goTo: () => {},
});

export const useWebsiteFrame = () => useContext(WebsiteFrameContext);

/*
 * Images the visitor added to their brief and marked "Show it on the site":
 * the first logo goes in the navigation, the first other image replaces the
 * hero illustration. In the editor these are object URLs for files held in
 * this browser; in the export they're paths to files in the zip.
 */
export type SiteImage = { src: string; alt: string };
export type SiteMedia = { logo?: SiteImage; hero?: SiteImage };

export const SiteMediaContext = createContext<SiteMedia>({});

export const useSiteMedia = () => useContext(SiteMediaContext);
