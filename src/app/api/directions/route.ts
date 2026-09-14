import { firstInvalidStep } from "@/lib/brief";
import { anthropicCall, emptyUsage, friendlyError, isLiveConfigured, LIVE_MODEL } from "@/lib/live/anthropic";
import { runDirections } from "@/lib/live/generate";
import { clientIp, directionsLimit, limitMessage } from "@/lib/live/limits";
import { directionsRequestSchema, type DirectionsEvent } from "@/lib/live/protocol";

/*
 * POST /api/directions
 *
 * A finished brief (and any images the visitor chose to share) in, three
 * directions out. The reply is a stream of JSON lines so the browser can show
 * real progress: planning, then each direction as it's written.
 */

// Planning plus three directions written side by side takes around a minute.
export const maxDuration = 300;

const json = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isLiveConfigured()) return json("Live generation isn't switched on. The Ebbfield demo still works.", 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json("That request couldn't be read.", 400);
  }
  const parsed = directionsRequestSchema.safeParse(body);
  if (!parsed.success) return json("That request didn't look right. Refresh the page and try again.", 400);
  const { brief, images } = parsed.data;
  if (firstInvalidStep(brief) !== -1) return json("The brief isn't finished yet.", 400);

  // Only images the brief actually lists, with the details the visitor gave them.
  const notes = images.flatMap((img) => {
    const material = brief.materials.find((m) => m.id === img.materialId);
    return material ? [{ mediaType: img.mediaType, data: img.data, note: { fileName: material.fileName, kind: material.kind, alt: material.alt, use: material.use } }] : [];
  });

  const limit = directionsLimit(clientIp(request));
  if (!limit.ok) return json(limitMessage(limit, "live generations"), 429);

  const usage = emptyUsage();
  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let open = true;
      const emit = (event: DirectionsEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      try {
        const directions = await runDirections({ brief, images: notes, call: anthropicCall({ usage, signal: request.signal, tag: "directions" }), emit });
        emit({ type: "done", directions, model: LIVE_MODEL });
      } catch (error) {
        emit({ type: "error", message: friendlyError(error, "directions").message });
      } finally {
        console.log(
          `[live/directions] finished in ${Math.round((Date.now() - started) / 1000)}s calls=${usage.calls} in=${usage.input} out=${usage.output} cache_write=${usage.cacheWrite} cache_read=${usage.cacheRead} images=${notes.length}`,
        );
        if (open) controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
