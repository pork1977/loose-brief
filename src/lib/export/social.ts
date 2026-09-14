"use client";

import { brandFont } from "../brand-fonts";
import { coastlineFrame } from "../coastline";
import type { Direction } from "../direction";
import { colorsFor, type Mode } from "../tokens";

/*
 * Social cards drawn on a canvas with the brand's fonts and colours, then saved
 * as PNG. Two sizes: a link preview card (1200x630, the size most sites use
 * for shared links) and a square post (1080x1080).
 *
 * Drawing needs the real fonts loaded in this page, so it runs in the browser.
 */

export const SOCIAL_FORMATS = {
  link: { label: "Link preview card", width: 1200, height: 630, file: "link-card.png" },
  square: { label: "Square post", width: 1080, height: 1080, file: "square-post.png" },
} as const;
export type SocialFormat = keyof typeof SOCIAL_FORMATS;

/** The family name the browser actually uses for a brand font, resolved from its CSS variable. */
function resolvedFamily(id: Parameters<typeof brandFont>[0]): string {
  const probe = document.createElement("span");
  probe.style.fontFamily = brandFont(id).stack;
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily;
  probe.remove();
  return family;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrink the headline until it fits in the lines available. */
function fitHeadline(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, maxWidth: number, maxLines: number, start: number) {
  for (let size = start; size >= 28; size -= 4) {
    ctx.font = font(size);
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = font(28);
  return { size: 28, lines: wrap(ctx, text, maxWidth).slice(0, maxLines) };
}

export async function drawSocialCard(canvas: HTMLCanvasElement, direction: Direction, brandName: string, mode: Mode, format: SocialFormat) {
  const { width, height } = SOCIAL_FORMATS[format];
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const t = direction.tokens;
  const c = colorsFor(t, mode);
  const display = resolvedFamily(t.typography.display.family);
  const body = resolvedFamily(t.typography.body.family);
  const label = resolvedFamily(t.typography.label.family);
  const dw = t.typography.display.weight;
  const lw = t.typography.label.weight;

  // Make sure the faces are downloaded before drawing, or the canvas falls back to system fonts.
  await Promise.all([
    document.fonts.load(`${dw} 64px ${display}`),
    document.fonts.load(`400 32px ${body}`),
    document.fonts.load(`${lw} 24px ${label}`),
  ]).catch(() => undefined);

  const square = format === "square";
  const pad = square ? 88 : 72;

  // Background and illustration.
  ctx.fillStyle = c.surface.page;
  ctx.fillRect(0, 0, width, height);

  const frame = coastlineFrame(2050);
  const artW = square ? width : width * 0.42;
  const artH = square ? height * 0.42 : height;
  const artX = square ? 0 : width - artW;
  const artY = square ? height - artH : 0;
  ctx.save();
  ctx.beginPath();
  ctx.rect(artX, artY, artW, artH);
  ctx.clip();
  ctx.fillStyle = c.surface.card;
  ctx.fillRect(artX, artY, artW, artH);
  // Scale the 800x440 drawing to cover the art area.
  const scale = Math.max(artW / 800, artH / 440);
  ctx.translate(artX + (artW - 800 * scale) / 2, artY + (artH - 440 * scale) / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = c.brand.secondary;
  ctx.fill(new Path2D(frame.land));
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.4 / Math.min(1, scale);
  frame.contours.forEach((d, i) => {
    ctx.globalAlpha = 0.5 - i * 0.1;
    ctx.strokeStyle = c.brand.primary;
    ctx.stroke(new Path2D(d));
  });
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = c.text.primary;
  ctx.stroke(new Path2D(frame.shore));
  for (const site of frame.sites) {
    ctx.beginPath();
    ctx.arc(site.x, site.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = c.button.primary;
    ctx.fill();
  }
  ctx.restore();

  // Accent bar.
  ctx.fillStyle = c.button.primary;
  ctx.fillRect(pad, pad, 56, 6);

  // Eyebrow.
  const textWidth = square ? width - pad * 2 : width * 0.58 - pad * 1.5;
  ctx.fillStyle = c.text.secondary;
  ctx.textBaseline = "top";
  const eyebrow = t.typography.label.transform === "uppercase" ? direction.sample.eyebrow.toUpperCase() : direction.sample.eyebrow;
  ctx.font = `${lw} ${square ? 26 : 22}px ${label}`;
  ctx.fillText(eyebrow, pad, pad + 32);

  // Headline.
  const { size, lines } = fitHeadline(ctx, direction.sample.headline, (s) => `${dw} ${s}px ${display}`, textWidth, 4, square ? 104 : 76);
  ctx.fillStyle = c.text.primary;
  const lineHeight = size * Math.max(1, t.typography.display.lineHeight + 0.05);
  lines.forEach((line, i) => ctx.fillText(line, pad, pad + 84 + i * lineHeight));

  // Brand name and call to action at the bottom of the text column.
  const baseY = square ? artY - pad * 0.9 : height - pad - 30;
  ctx.font = `600 ${square ? 26 : 22}px ${body}`;
  const cta = direction.sample.primaryCta;
  const ctaWidth = ctx.measureText(cta).width + 40;
  const ctaX = pad + textWidth - ctaWidth;
  // The brand name shares the line with the button, so shrink it if it would collide.
  let nameSize = square ? 44 : 36;
  ctx.font = `${dw} ${nameSize}px ${display}`;
  while (nameSize > 20 && ctx.measureText(brandName).width > textWidth - ctaWidth - 24) {
    nameSize -= 2;
    ctx.font = `${dw} ${nameSize}px ${display}`;
  }
  ctx.fillStyle = c.text.primary;
  ctx.fillText(brandName, pad, baseY);
  ctx.font = `600 ${square ? 26 : 22}px ${body}`;
  ctx.fillStyle = c.button.primary;
  roundRect(ctx, ctaX, baseY - 6, ctaWidth, square ? 54 : 46, t.radius.button === "pill" ? 999 : t.radius.button === "none" ? 0 : 8);
  ctx.fill();
  ctx.fillStyle = c.button.primaryText;
  ctx.fillText(cta, ctaX + 20, baseY + (square ? 8 : 6));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error("Couldn't create the image."));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png"),
  );
}
