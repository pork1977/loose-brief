import { z } from "zod";
import { briefDraftSchema } from "../brief";
import { directionSchema, type Direction } from "../direction";

/*
 * What travels between the browser and the live routes. Both sides use these,
 * and the server checks every request against them before spending anything.
 */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const FILE_TYPES = [...IMAGE_TYPES, "application/pdf"] as const;
export const MAX_IMAGES = 4;
export const MAX_DOCUMENTS = 2;
/** Base64 of an image already scaled down in the browser. About 1MB of image. */
export const MAX_IMAGE_CHARS = 1_400_000;
/** A PDF can't be scaled down, so it gets more room: about 2.2MB of file. */
export const MAX_DOCUMENT_CHARS = 3_000_000;
/** All shared files together, kept under what a serverless request body allows. */
export const MAX_TOTAL_CHARS = 4_000_000;

export const directionsRequestSchema = z.object({
  brief: briefDraftSchema,
  images: z
    .array(
      z
        .object({
          materialId: z.string().max(64),
          mediaType: z.enum(FILE_TYPES),
          data: z.string().max(MAX_DOCUMENT_CHARS).regex(/^[A-Za-z0-9+/]+=*$/),
        })
        .refine((f) => f.mediaType === "application/pdf" || f.data.length <= MAX_IMAGE_CHARS, "Image too large."),
    )
    .max(MAX_IMAGES + MAX_DOCUMENTS)
    .refine((files) => files.filter((f) => f.mediaType === "application/pdf").length <= MAX_DOCUMENTS, "Too many documents.")
    .refine((files) => files.filter((f) => f.mediaType !== "application/pdf").length <= MAX_IMAGES, "Too many images.")
    .refine((files) => files.reduce((n, f) => n + f.data.length, 0) <= MAX_TOTAL_CHARS, "Files too large together."),
});
export type DirectionsRequest = z.infer<typeof directionsRequestSchema>;

/** Stages of a live run, streamed to the browser one JSON object per line. */
export type DirectionsEvent =
  | { type: "stage"; stage: "planning" | "writing" }
  | { type: "planned"; names: string[] }
  | { type: "direction"; index: number; direction: Direction }
  | { type: "retry"; index: number }
  | { type: "notice"; message: string }
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
