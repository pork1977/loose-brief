"use client";

import { useEffect, useState } from "react";
import { deleteMaterialFile, loadMaterialFile } from "./material-files";

/*
 * Object URLs for material thumbnails, shared by every component that shows
 * one. A URL is made once per material and released when it's removed.
 */

const urls = new Map<string, string>();

export function rememberThumbnail(id: string, blob: Blob) {
  const existing = urls.get(id);
  if (existing) URL.revokeObjectURL(existing);
  urls.set(id, URL.createObjectURL(blob));
}

export async function forgetThumbnail(id: string) {
  const url = urls.get(id);
  if (url) URL.revokeObjectURL(url);
  urls.delete(id);
  await deleteMaterialFile(id);
}

export function forgetAllThumbnails() {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}

/** "loading" until IndexedDB answers, then a URL, or null if the file isn't stored. */
export function useThumbnail(id: string): string | null | "loading" {
  const [url, setUrl] = useState<string | null | "loading">(() => urls.get(id) ?? "loading");

  useEffect(() => {
    if (urls.has(id)) return;
    let cancelled = false;
    loadMaterialFile(id).then((blob) => {
      if (cancelled) return;
      if (blob) rememberThumbnail(id, blob);
      setUrl(urls.get(id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return urls.get(id) ?? url;
}
