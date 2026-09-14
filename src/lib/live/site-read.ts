import { isIP } from "node:net";
import type { SiteSummary } from "./prompts";

/*
 * Reading a visitor's current website: which addresses are safe to fetch, and
 * how a page's HTML is boiled down to what's useful for a brief. The fetching
 * itself is in site-fetch.ts; this file has no network code, so it can be
 * tested directly.
 */

const v4 = (ip: string) => ip.split(".").map(Number);

/**
 * True only for ordinary public internet addresses. Everything a server should
 * never be tricked into fetching (its own machine, private networks, cloud
 * metadata endpoints, link-local and reserved ranges) is refused.
 */
export function isPublicAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = v4(ip);
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
    if (a === 169 && b === 254) return false; // link-local, including cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && (b === 168 || (b === 0 && v4(ip)[2] === 0))) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a >= 224) return false; // multicast and reserved
    return true;
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return false;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPublicAddress(mapped[1]);
    if (/^f[cd]/.test(lower)) return false; // unique local
    if (/^fe[89ab]/.test(lower)) return false; // link-local
    if (/^ff/.test(lower)) return false; // multicast
    return true;
  }
  return false;
}

/** Checks on the address itself, before any lookup: web protocols, normal ports, no local names, no private literal IPs. */
export function checkSiteUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (isIP(host) && !isPublicAddress(host)) return null;
  if (!isIP(host) && !host.includes(".")) return null;
  return url;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: "..." };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : " ";
    }
    return ENTITIES[code.toLowerCase()] ?? whole;
  });
}

const plain = (html: string) => decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function metaContent(html: string, name: string): string {
  const tag = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*>`, "i").exec(html)?.[0];
  return tag ? plain(/content=["']([^"']*)["']/i.exec(tag)?.[1] ?? "") : "";
}

/** The parts of a page that tell you about a brand, trimmed to a size worth sending. */
export function summariseHtml(html: string, url: string): SiteSummary {
  const title = plain(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "").slice(0, 160);
  const description = (metaContent(html, "description") || metaContent(html, "og:description")).slice(0, 300);

  // Colours from inline styles, style blocks and the theme colour, most used first.
  const counts = new Map<string, number>();
  const styleText = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join(" ") + " " + [...html.matchAll(/style=["']([^"']*)["']/gi)].map((m) => m[1]).join(" ") + " " + metaContent(html, "theme-color");
  for (const m of styleText.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
    const key = `#${hex.toUpperCase()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const colours = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex).slice(0, 8);

  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|template|iframe|head)[\s\S]*?<\/\1>/gi, " ");
  const headings = [...body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => plain(m[1])).filter((h) => h.length > 1 && h.length < 160).slice(0, 12);
  const text = plain(body).slice(0, 4000);

  return { url, title, description, headings, text, colours };
}
