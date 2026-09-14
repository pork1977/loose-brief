import "server-only";
import { lookup, type LookupAddress } from "node:dns";
import { Agent, fetch } from "undici";
import type { SiteSummary } from "./prompts";
import { checkSiteUrl, isPublicAddress, summariseHtml } from "./site-read";

/*
 * Fetching the front page of a visitor's current website, on the server.
 *
 * A server that fetches any address it's given can be pointed at things it
 * shouldn't reach, so every connection is checked at the moment it's made: the
 * name is looked up, and if any address it resolves to isn't public, the
 * connection is refused. Checking at connect time (not just once beforehand)
 * means a name can't pass the check and then switch to a private address.
 * Redirects are followed by hand, a few at most, each checked the same way.
 * Only HTML is read, only the first 1.5MB, and it gives up after 8 seconds.
 */

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

class Blocked extends Error {
  code = "EBLOCKED";
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

function guardedLookup(hostname: string, options: { all?: boolean; family?: number }, callback: LookupCallback) {
  lookup(hostname, { family: options.family, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address))) return callback(new Blocked("That address isn't a public website."), "");
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

const agent = new Agent({ connect: { lookup: guardedLookup as never }, headersTimeout: TIMEOUT_MS, bodyTimeout: TIMEOUT_MS });

export async function readSite(raw: string, signal?: AbortSignal): Promise<SiteSummary | null> {
  const start = checkSiteUrl(raw);
  if (!start) return null;
  let url: URL = start;
  const abort = AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(url, {
      dispatcher: agent,
      redirect: "manual",
      signal: abort,
      headers: { "User-Agent": "LooseBrief/1.0 (reads one page to help design a brand)", Accept: "text/html" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      const next: URL | null = location ? checkSiteUrl(new URL(location, url).toString()) : null;
      if (!next) return null;
      url = next;
      continue;
    }
    if (!response.ok || !/text\/html|application\/xhtml/i.test(response.headers.get("content-type") ?? "")) {
      await response.body?.cancel();
      return null;
    }

    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of response.body ?? []) {
      chunks.push(chunk);
      size += chunk.byteLength;
      if (size >= MAX_BYTES) break;
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
    return summariseHtml(html, url.toString());
  }
  return null;
}
