import { connection } from "next/server";
import { isLiveConfigured } from "@/lib/live/anthropic";
import type { LiveStatus } from "@/lib/live/protocol";

/** GET /api/live: whether live generation is switched on, so the interface only offers what works. */
export async function GET() {
  // Read at request time, so adding or removing the key takes effect without a rebuild.
  await connection();
  return Response.json({ live: isLiveConfigured() } satisfies LiveStatus, { headers: { "Cache-Control": "no-store" } });
}
