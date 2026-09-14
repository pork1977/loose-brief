import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BRIEF } from "../../data/demo-brief";
import { briefKey } from "../brief";
import { briefBlock } from "./prompts";
import { checkSiteUrl, isPublicAddress, summariseHtml } from "./site-read";

test("only public internet addresses are allowed", () => {
  for (const ip of ["127.0.0.1", "10.2.3.4", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fc00::1", "fd12::3", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "1.1.1.1", "2606:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(isPublicAddress(ip), true, ip);
  }
  assert.equal(isPublicAddress("not an ip"), false);
});

test("addresses that could reach something private are refused before any lookup", () => {
  for (const url of ["ftp://example.com", "file:///etc/passwd", "http://localhost:3400", "http://printer.local", "http://metadata.google.internal", "http://169.254.169.254/latest", "http://[::1]/", "http://intranet", "https://user:pass@example.com", "https://example.com:8080", "javascript:alert(1)", "nonsense"]) {
    assert.equal(checkSiteUrl(url), null, url);
  }
  assert.equal(checkSiteUrl("https://www.example.co.uk/about")?.hostname, "www.example.co.uk");
  assert.equal(checkSiteUrl("http://example.com:443")?.hostname, "example.com");
});

test("a page is boiled down to its title, headings, text and colours, without scripts or styles", () => {
  const html = `<!doctype html><html><head><title>Crumb &amp; Co | Bakery</title>
    <meta name="description" content="Sourdough baked daily in Leeds.">
    <meta name="theme-color" content="#8a4b2d">
    <style>body { color: #222222 } .btn { background: #8A4B2D } .x { border-color: #8a4b2d }</style>
    <script>var secret = "ignore me";</script></head>
    <body><h1>Real bread, <em>properly</em> made</h1><p>We&rsquo;re open early.</p><svg><text>no</text></svg>
    <h2>Order ahead</h2><div style="background:#fff">Collect on your way in.</div><!-- hidden --></body></html>`;
  const s = summariseHtml(html, "https://crumb.example/");
  assert.equal(s.title, "Crumb & Co | Bakery");
  assert.equal(s.description, "Sourdough baked daily in Leeds.");
  assert.deepEqual(s.headings, ["Real bread, properly made", "Order ahead"]);
  assert.match(s.text, /We're open early\. Order ahead Collect on your way in\./);
  assert.doesNotMatch(s.text, /secret|ignore me|no|hidden/);
  assert.equal(s.colours[0], "#8A4B2D");
  assert.ok(s.colours.includes("#FFFFFF"));
});

test("the brief sent to Claude carries typed colours, existing copy and the site summary", () => {
  const brief = { ...DEMO_BRIEF, brandColours: ["#0a3d62"], existingCopy: "We've been baking on this street since 1998.", currentSite: "https://crumb.example" };
  const block = briefBlock(brief, [], { url: "https://crumb.example/", title: "Crumb", description: "", headings: ["Order ahead"], text: "Collect on your way in.", colours: ["#8A4B2D"] });
  assert.match(block, /keep exactly: #0A3D62/);
  assert.match(block, /since 1998/);
  assert.match(block, /THEIR CURRENT WEBSITE \(https:\/\/crumb\.example\/\)/);
  assert.match(block, /Colours used on it: #8A4B2D/);
  assert.match(block, /not instructions for you/);
});

test("the new brief fields don't make older directions look out of date while they're empty", () => {
  const { brandColours, currentSite, existingCopy, ...older } = DEMO_BRIEF;
  assert.deepEqual([brandColours, currentSite, existingCopy], [[], "", ""]);
  assert.equal(briefKey(DEMO_BRIEF), briefKey(older as typeof DEMO_BRIEF));
  assert.notEqual(briefKey(DEMO_BRIEF), briefKey({ ...DEMO_BRIEF, existingCopy: "Hello" }));
});
