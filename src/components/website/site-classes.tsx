import { SITE_CSS } from "./site-css";

/*
 * Class names for the generated homepage. `siteClasses("ws").heroTitle` gives
 * "ws-hero-title", matching the selectors in site-css.ts, so components read
 * like they did with CSS modules but the names are readable in exported code.
 */
export function siteClasses(prefix: "ws" | "wx" | "wv"): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_, key) => (typeof key === "string" ? `${prefix}-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}` : undefined),
  });
}

/**
 * Puts the site stylesheet in the document once, however many previews are on
 * screen (React hoists and de-duplicates styles that share an href).
 */
export function SiteStyles() {
  return (
    <style href="loose-brief-site" precedence="default">
      {SITE_CSS}
    </style>
  );
}
