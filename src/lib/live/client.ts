"use client";

import { useSyncExternalStore } from "react";
import type { BriefDraft } from "../brief";
import type { Direction } from "../direction";
import { loadMaterialFile } from "../material-files";
import { MAX_IMAGES, MAX_IMAGE_CHARS, type DirectionsEvent, type DirectionsRequest, type LiveStatus, type RefineRequest, type RefineResponse } from "./protocol";

/*
 * The browser's side of live mode: asking whether it's on, preparing shared
 * images, reading the progress stream and asking Claude for a change.
 */

/* ------------------------------------------------------------- status */

let status: boolean | null = null;
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();

function load() {
  request ??= fetch("/api/live", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<LiveStatus>) : { live: false }))
    .then((s) => {
      status = s.live;
    })
    .catch(() => {
      status = false;
    })
    .finally(() => listeners.forEach((l) => l()));
}

/** Whether live generation is switched on. Null until the server has said. */
export function useLiveStatus(): boolean | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      load();
      return () => listeners.delete(listener);
    },
    () => status,
    () => null,
  );
}

/* ------------------------------------------------------------- images */

const SEND_MAX = 1024;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Scale a stored image down for sending. Keeps PNG (and transparency) when it's small enough, else JPEG on white. */
async function shrink(blob: Blob): Promise<{ mediaType: "image/png" | "image/jpeg"; data: string } | null> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, SEND_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const encode = (type: string, quality?: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

    if (blob.type === "image/png") {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const png = await encode("image/png");
      if (png) {
        const data = await blobToBase64(png);
        if (data.length <= MAX_IMAGE_CHARS) return { mediaType: "image/png", data };
      }
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const jpeg = await encode("image/jpeg", 0.82);
    if (!jpeg) return null;
    const data = await blobToBase64(jpeg);
    return data.length <= MAX_IMAGE_CHARS ? { mediaType: "image/jpeg", data } : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The images the visitor chose to share, ready to send. Ones that can't be read are left out. */
export async function sharedImages(brief: BriefDraft): Promise<DirectionsRequest["images"]> {
  const chosen = brief.materials.filter((m) => m.shareWithClaude).slice(0, MAX_IMAGES);
  const out: DirectionsRequest["images"] = [];
  for (const material of chosen) {
    const blob = await loadMaterialFile(material.id);
    const image = blob ? await shrink(blob) : null;
    if (image) out.push({ materialId: material.id, ...image });
  }
  return out;
}

/* --------------------------------------------------------- directions */

/**
 * Run a live generation, calling `onEvent` for each progress update. Resolves
 * with the three directions, or throws an Error whose message is fit to show.
 */
export async function streamDirections(body: DirectionsRequest, onEvent: (event: DirectionsEvent) => void, signal: AbortSignal): Promise<Direction[]> {
  let response: Response;
  try {
    response = await fetch("/api/directions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error("Couldn't reach Loose Brief. Check your connection and try again.");
  }
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Live generation didn't start. Try again in a moment.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Direction[] | null = null;

  const handle = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as DirectionsEvent;
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") result = event.directions;
    onEvent(event);
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);
  if (!result) throw new Error("The connection closed before the directions were finished. Try again.");
  return result;
}

/* ------------------------------------------------------------- refine */

export async function askClaude(body: RefineRequest, signal?: AbortSignal): Promise<RefineResponse> {
  try {
    const response = await fetch("/api/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    const payload = (await response.json().catch(() => null)) as RefineResponse | null;
    return payload ?? { ok: false, message: "Claude's reply couldn't be read. Try again." };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, message: "Couldn't reach Loose Brief. Check your connection and try again." };
  }
}
