import { z } from "zod";
import { briefDraftSchema } from "../brief";
import { directionSchema, type Direction } from "../direction";

/*
 * What travels between the browser and the live routes. Both sides use these,
 * and the server checks every request against them before spending anything.
 */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGES = 4;
/** Base64 of an image already scaled down in the browser. About 1MB of image. */
export const MAX_IMAGE_CHARS = 1_400_000;

export const directionsRequestSchema = z.object({
  brief: briefDraftSchema,
  images: z
    .array(
      z.object({
        materialId: z.string().max(64),
        mediaType: z.enum(IMAGE_TYPES),
        data: z.string().max(MAX_IMAGE_CHARS).regex(/^[A-Za-z0-9+/]+=*$/),
      }),
    )
    .max(MAX_IMAGES),
});
export type DirectionsRequest = z.infer<typeof directionsRequestSchema>;

/** Stages of a live run, streamed to the browser one JSON object per line. */
export type DirectionsEvent =
  | { type: "stage"; stage: "planning" | "writing" }
  | { type: "planned"; names: string[] }
  | { type: "direction"; index: number; direction: Direction }
  | { type: "retry"; index: number }
  | { type: "done"; directions: Direction[]; model: string }
  | { type: "error"; message: string };

export const refineRequestSchema = z.object({
  request: z.string().trim().min(1).max(300),
  direction: directionSchema,
  brief: briefDraftSchema.pick({ name: true, oneLiner: true, description: true, audience: true, personality: true, avoid: true }),
});
export type RefineRequest = z.infer<typeof refineRequestSchema>;

export type RefineResponse =
  | {
      ok: true;
      possible: true;
      changeType: string;
      summary: string;
      because: string;
      changes: { path: string; from: unknown; to: unknown }[];
      affected: string[];
      focus: string | null;
    }
  | { ok: true; possible: false; text: string }
  | { ok: false; message: string };

export type LiveStatus = { live: boolean };
