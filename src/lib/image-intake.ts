"use client";

import type { Material, MaterialKind } from "./brief";
import { describePalette, extractPalette, parseSvgColours, swatchesFromHexes } from "./palette";

/*
 * Turns a dropped file into a material: a stored thumbnail plus the colours
 * and traits read from it. All of it happens in the browser.
 */

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const THUMB_MAX = 1200;
const SAMPLE_SIZE = 96;

export class IntakeError extends Error {}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (file.type !== "image/svg+xml") {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }
  // SVGs go through an <img>, which never runs scripts inside the file.
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    // The load event, not img.decode(): decode() doesn't settle while the tab is in the background.
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("load failed"));
      img.src = url;
    });
  } catch {
    URL.revokeObjectURL(url);
    throw new IntakeError("That SVG couldn't be read.");
  }
  // SVGs without a width and height report 0; give them a sensible canvas.
  const width = img.naturalWidth || 800;
  const height = img.naturalHeight || 800;
  return { source: img, width, height, release: () => URL.revokeObjectURL(url) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new IntakeError("Couldn't make a preview."))), type, quality),
  );
}

function guessKind(file: File, hasAlpha: boolean): MaterialKind {
  const name = file.name.toLowerCase();
  if (file.type === "image/svg+xml" || name.includes("logo")) return "logo";
  if (name.includes("screenshot") || name.includes("screen shot")) return "screenshot";
  if (hasAlpha) return "logo";
  return "photo";
}

export async function readMaterial(file: File): Promise<{ material: Material; thumbnail: Blob }> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new IntakeError("Use a PNG, JPG, WebP, AVIF, GIF or SVG image.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new IntakeError("That file is over 10 MB. Try a smaller copy.");
  }

  let decoded;
  try {
    decoded = await decode(file);
  } catch (error) {
    if (error instanceof IntakeError) throw error;
    throw new IntakeError("That image couldn't be opened. It may be damaged.");
  }

  try {
    const { source, width, height } = decoded;

    // Colours come from a small copy: plenty for a palette and quick to cluster.
    const sample = document.createElement("canvas");
    const sampleScale = SAMPLE_SIZE / Math.max(width, height);
    sample.width = Math.max(1, Math.round(width * sampleScale));
    sample.height = Math.max(1, Math.round(height * sampleScale));
    const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleCtx) throw new IntakeError("This browser can't read image colours.");
    sampleCtx.drawImage(source, 0, 0, sample.width, sample.height);

    let pixels: Uint8ClampedArray | null = null;
    try {
      pixels = sampleCtx.getImageData(0, 0, sample.width, sample.height).data;
    } catch {
      // Some browsers refuse to read pixels back from SVGs. Colours then come
      // from the file's own markup below.
    }

    let hasAlpha = false;
    if (pixels) {
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 250) {
          hasAlpha = true;
          break;
        }
      }
    }

    const exactColours = file.type === "image/svg+xml" ? parseSvgColours(await file.text()).slice(0, 12) : [];
    const palette = pixels ? extractPalette(pixels) : swatchesFromHexes(exactColours).slice(0, 6);
    if (!palette.length && !exactColours.length) {
      throw new IntakeError("No colours could be read from that image.");
    }

    // Thumbnail: up to 1200px on the long edge. PNG keeps transparency for
    // logos; everything else is a JPEG to keep storage small.
    const thumbScale = Math.min(1, THUMB_MAX / Math.max(width, height));
    const thumb = document.createElement("canvas");
    thumb.width = Math.max(1, Math.round(width * thumbScale));
    thumb.height = Math.max(1, Math.round(height * thumbScale));
    thumb.getContext("2d")?.drawImage(source, 0, 0, thumb.width, thumb.height);
    const thumbnail = hasAlpha || file.type === "image/svg+xml"
      ? await canvasToBlob(thumb, "image/png")
      : await canvasToBlob(thumb, "image/jpeg", 0.86);

    const kind = guessKind(file, hasAlpha);
    const material: Material = {
      id: crypto.randomUUID(),
      fileName: file.name.slice(0, 200),
      mimeType: file.type,
      kind,
      use: kind === "screenshot" ? "inspiration" : "in-site",
      keepColours: kind === "logo",
      alt: "",
      width: Math.round(width),
      height: Math.round(height),
      palette,
      exactColours,
      traits: describePalette(palette),
      addedAt: new Date().toISOString(),
      shareWithClaude: false,
    };
    return { material, thumbnail };
  } finally {
    decoded.release();
  }
}
