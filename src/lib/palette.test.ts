import assert from "node:assert/strict";
import { test } from "node:test";
import { describePalette, extractPalette, hexToRgb, oklabToRgb, parseSvgColours, rgbToOklab } from "./palette";

function pixelsFrom(colours: { rgb: [number, number, number]; count: number; alpha?: number }[]) {
  const values: number[] = [];
  for (const { rgb, count, alpha = 255 } of colours) {
    for (let i = 0; i < count; i++) values.push(...rgb, alpha);
  }
  return new Uint8ClampedArray(values);
}

test("OKLab conversion round-trips sRGB colours", () => {
  for (const rgb of [[0, 0, 0], [255, 255, 255], [8, 59, 102], [224, 105, 74]] as [number, number, number][]) {
    assert.deepEqual(oklabToRgb(rgbToOklab(...rgb)), [...rgb]);
  }
});

test("finds the two colours of a two-colour image with their shares", () => {
  const pixels = pixelsFrom([
    { rgb: [8, 59, 102], count: 600 },
    { rgb: [216, 185, 130], count: 400 },
  ]);
  const palette = extractPalette(pixels);
  assert.equal(palette.length, 2);
  assert.equal(palette[0].hex, "#083B66");
  assert.equal(palette[1].hex, "#D8B982");
  assert.ok(Math.abs(palette[0].share - 0.6) < 0.001);
});

test("ignores transparent pixels, so a logo's background doesn't count", () => {
  const pixels = pixelsFrom([
    { rgb: [0, 0, 0], count: 900, alpha: 0 },
    { rgb: [200, 54, 27], count: 100 },
  ]);
  const palette = extractPalette(pixels);
  assert.equal(palette.length, 1);
  assert.equal(palette[0].hex, "#C8361B");
  assert.equal(palette[0].share, 1);
});

test("gives the same palette every time for the same pixels", () => {
  const pixels = new Uint8ClampedArray(4 * 2000);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = (i * 7) % 256;
    pixels[i + 1] = (i * 13) % 256;
    pixels[i + 2] = (i * 29) % 256;
    pixels[i + 3] = 255;
  }
  assert.deepEqual(extractPalette(pixels), extractPalette(pixels));
});

test("returns nothing for a fully transparent image", () => {
  assert.deepEqual(extractPalette(pixelsFrom([{ rgb: [255, 0, 0], count: 50, alpha: 0 }])), []);
});

test("describes a pale, grey image as light, muted and neutral", () => {
  const palette = extractPalette(pixelsFrom([{ rgb: [240, 240, 238], count: 100 }]));
  assert.deepEqual(describePalette(palette), { lightness: "light", saturation: "muted", temperature: "neutral" });
});

test("describes deep navy as dark and cool, and coral as warm", () => {
  const navy = extractPalette(pixelsFrom([{ rgb: [7, 27, 60], count: 100 }]));
  assert.equal(describePalette(navy).lightness, "dark");
  assert.equal(describePalette(navy).temperature, "cool");
  const coral = extractPalette(pixelsFrom([{ rgb: [240, 124, 94], count: 100 }]));
  assert.equal(describePalette(coral).temperature, "warm");
});

test("reads exact colours from SVG markup, most used first", () => {
  const svg = `<svg><path fill="#083b66"/><path fill="#083B66"/><rect style="fill:#fff"/><circle stroke="rgb(216, 185, 130)"/></svg>`;
  assert.deepEqual(parseSvgColours(svg), ["#083B66", "#FFFFFF", "#D8B982"]);
});

test("hexToRgb accepts short and long forms and rejects junk", () => {
  assert.deepEqual(hexToRgb("#fa0"), [255, 170, 0]);
  assert.deepEqual(hexToRgb("083B66"), [8, 59, 102]);
  assert.equal(hexToRgb("#12345"), null);
  assert.equal(hexToRgb("blue"), null);
});
