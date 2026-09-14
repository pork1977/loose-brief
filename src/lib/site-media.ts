"use client";

import { useEffect, useState } from "react";
import type { SiteMedia } from "@/components/website/WebsiteContext";
import type { BriefDraft, Material } from "./brief";
import { loadMaterialFile } from "./material-files";

/*
 * Turning "Show it on the site" into images on the site. The first logo marked
 * that way goes in the navigation and the first other image fills the hero.
 */

export function mediaMaterials(brief: BriefDraft): { logo?: Material; hero?: Material } {
  const shown = brief.materials.filter((m) => m.use === "in-site");
  return { logo: shown.find((m) => m.kind === "logo"), hero: shown.find((m) => m.kind !== "logo" && m.kind !== "document") };
}

const extension = (type: string) => (type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg");

/** Object URLs for the editor's previews. Revoked when the brief's choices change or the page goes away. */
export function useSiteMediaUrls(brief: BriefDraft): SiteMedia {
  const { logo, hero } = mediaMaterials(brief);
  const key = `${logo?.id}|${hero?.id}|${logo?.alt}|${hero?.alt}`;
  const [media, setMedia] = useState<{ key: string; value: SiteMedia }>({ key: "", value: {} });

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const load = async (material?: Material) => {
      const blob = material ? await loadMaterialFile(material.id) : null;
      if (!material || !blob) return undefined;
      const src = URL.createObjectURL(blob);
      urls.push(src);
      return { src, alt: material.alt };
    };
    void Promise.all([load(logo), load(hero)]).then(([l, h]) => {
      if (cancelled) return;
      setMedia({ key, value: { ...(l ? { logo: l } : {}), ...(h ? { hero: h } : {}) } });
    });
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // The key covers everything the effect reads from the brief.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return media.key === key ? media.value : {};
}

/** The files and paths for the downloadable site, read from this browser's storage. */
export async function siteMediaFiles(brief: BriefDraft): Promise<{ media: SiteMedia; files: Record<string, Uint8Array> }> {
  const { logo, hero } = mediaMaterials(brief);
  const media: SiteMedia = {};
  const files: Record<string, Uint8Array> = {};
  for (const [role, material] of [["logo", logo], ["hero", hero]] as const) {
    const blob = material ? await loadMaterialFile(material.id) : null;
    if (!material || !blob) continue;
    const path = `images/${role}.${extension(blob.type)}`;
    files[path] = new Uint8Array(await blob.arrayBuffer());
    media[role] = { src: path, alt: material.alt };
  }
  return { media, files };
}
