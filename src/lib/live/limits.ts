/*
 * Per-visitor and daily ceilings for live generation.
 *
 * These live in memory, so on a serverless host they count per instance, not
 * across the whole site. They slow down one person hammering the button; they
 * are not a guarantee. The real ceiling is the spend limit set on the Anthropic
 * key in the console.
 */

type Options = { perIp: number; windowMs: number; perDay: number; now?: () => number };

export type LimitResult = { ok: true } | { ok: false; reason: "visitor" | "daily"; retryAfterSeconds: number };

export function createLimiter({ perIp, windowMs, perDay, now = Date.now }: Options) {
  const seen = new Map<string, number[]>();
  let day = "";
  let dayCount = 0;

  return function check(ip: string): LimitResult {
    const t = now();
    const today = new Date(t).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      dayCount = 0;
    }
    if (dayCount >= perDay) {
      const midnight = Date.parse(`${today}T00:00:00.000Z`) + 86_400_000;
      return { ok: false, reason: "daily", retryAfterSeconds: Math.ceil((midnight - t) / 1000) };
    }
    const hits = (seen.get(ip) ?? []).filter((at) => t - at < windowMs);
    if (hits.length >= perIp) {
      return { ok: false, reason: "visitor", retryAfterSeconds: Math.ceil((hits[0] + windowMs - t) / 1000) };
    }
    hits.push(t);
    seen.set(ip, hits);
    if (seen.size > 5000) seen.clear();
    dayCount += 1;
    return { ok: true };
  };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

const HOUR = 60 * 60 * 1000;
const envNumber = (name: string, fallback: number) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Generating directions is the expensive call, so it gets the tighter limits. */
export const directionsLimit = createLimiter({ perIp: envNumber("LIVE_DIRECTIONS_PER_HOUR", 3), windowMs: HOUR, perDay: envNumber("LIVE_DIRECTIONS_PER_DAY", 30) });
export const refineLimit = createLimiter({ perIp: envNumber("LIVE_REFINE_PER_HOUR", 20), windowMs: HOUR, perDay: envNumber("LIVE_REFINE_PER_DAY", 300) });

export function limitMessage(result: Extract<LimitResult, { ok: false }>, what: string): string {
  if (result.reason === "daily") return `Loose Brief has reached its daily limit for ${what}. The demo still works, and the limit resets at midnight (UTC).`;
  const minutes = Math.max(1, Math.round(result.retryAfterSeconds / 60));
  return `That's the most ${what} one visitor can run in an hour. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
