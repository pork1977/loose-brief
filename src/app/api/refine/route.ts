import { anthropicCall, emptyUsage, friendlyError, isLiveConfigured } from "@/lib/live/anthropic";
import { runRefine } from "@/lib/live/generate";
import { clientIp, limitMessage, refineLimit } from "@/lib/live/limits";
import { refineRequestSchema, type RefineResponse } from "@/lib/live/protocol";

/*
 * POST /api/refine
 *
 * A Creative Director request the built-in rules couldn't match, answered by
 * Claude as a set of changes. The changes are checked here, and again in the
 * browser before they're previewed or applied.
 */

export const maxDuration = 120;

const reply = (body: RefineResponse, status = 200) => Response.json(body, { status });

export async function POST(request: Request) {
  if (!isLiveConfigured()) return reply({ ok: false, message: "Live requests aren't switched on. The built-in suggestions still work." }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, message: "That request couldn't be read." }, 400);
  }
  const parsed = refineRequestSchema.safeParse(body);
  if (!parsed.success) return reply({ ok: false, message: "That request didn't look right. Refresh the page and try again." }, 400);

  const limit = refineLimit(clientIp(request));
  if (!limit.ok) return reply({ ok: false, message: limitMessage(limit, "Claude requests") }, 429);

  const usage = emptyUsage();
  try {
    const result = await runRefine(parsed.data, anthropicCall({ usage, signal: request.signal, tag: "refine" }));
    return reply(result);
  } catch (error) {
    const { message, status } = friendlyError(error, "refine");
    return reply({ ok: false, message }, status);
  } finally {
    console.log(`[live/refine] calls=${usage.calls} in=${usage.input} out=${usage.output} cache_write=${usage.cacheWrite} cache_read=${usage.cacheRead}`);
  }
}
