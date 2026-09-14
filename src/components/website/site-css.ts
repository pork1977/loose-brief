/*
 * The generated homepage's stylesheet.
 *
 * One stylesheet serves the Studio preview and the downloaded site, so what
 * people see is exactly what they export. Class names are readable and
 * prefixed (ws- page, wx- coastline explorer, wv- illustrations) so they don't
 * collide with Loose Brief's own styles, or with a site they're pasted into.
 * Brand tokens only: no raw colours, fonts or radii.
 *
 * Generated once from the old CSS modules; edit this file directly now.
 */

export const SITE_CSS = String.raw`
/* ---------- Page (ws-) ---------- */

/*
 * The generated homepage. Brand tokens only: no raw colours, fonts or radii.
 * Breakpoints are container queries on the site's own width, so the Studio's
 * desktop (1280px), tablet (834px) and mobile (390px) frames get real layouts.
 */

.ws-site {
  container-type: inline-size;
  min-height: 100%;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-weight: var(--font-body-weight);
  line-height: var(--font-body-leading);
  --gutter: var(--space-m);
}

/* ---- Shared ---- */

.ws-reveal {
  transition:
    opacity var(--motion-slow) var(--motion-easing),
    transform var(--motion-slow) var(--motion-easing);
}
.ws-reveal[data-reveal="waiting"] {
  opacity: 0;
  transform: translateY(18px);
}

.ws-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
  padding: var(--space-2xl) var(--gutter);
}

.ws-heading {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 40rem;
}
.ws-eyebrow {
  font-family: var(--font-label);
  font-weight: var(--font-label-weight);
  letter-spacing: var(--font-label-tracking);
  text-transform: var(--font-label-transform);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
.ws-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  line-height: var(--font-display-leading);
  letter-spacing: var(--font-display-tracking);
  font-size: clamp(2rem, 5.5cqi, 3.5rem);
  color: var(--color-text-primary);
  text-wrap: balance;
}
.ws-lead {
  max-width: 38rem;
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  text-wrap: pretty;
}
.ws-body {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.ws-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  padding: 0 1.35rem;
  border: 1px solid transparent;
  border-radius: var(--radius-button);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform var(--motion-fast) var(--motion-easing),
    box-shadow var(--motion-fast) var(--motion-easing),
    background-color var(--motion-fast) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing);
}
.ws-button-primary {
  background: var(--color-button-primary);
  color: var(--color-button-primary-text);
}
.ws-button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px -12px var(--color-button-primary);
}
.ws-button-secondary {
  border-color: var(--color-border);
  color: var(--color-text-primary);
}
.ws-button-secondary:hover {
  border-color: var(--color-text-primary);
}
.ws-button:focus-visible,
.ws-nav-link:focus-visible,
.ws-logo:focus-visible,
.ws-footer-link:focus-visible,
.ws-menu-button:focus-visible {
  outline: 3px solid var(--color-brand-accent);
  outline-offset: 3px;
}

/* ---- Nav ---- */

.ws-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-background) 92%, transparent);
  backdrop-filter: blur(8px);
}
.ws-nav-inner {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: 4rem;
  padding: 0 var(--gutter);
}
.ws-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-right: auto;
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  font-size: 1.375rem;
  line-height: 1;
  color: var(--color-text-primary);
  text-decoration: none;
}
.ws-logo-mark {
  width: 1.1rem;
  height: 1.1rem;
  border-radius: var(--radius-small);
  background: linear-gradient(135deg, var(--color-button-primary) 55%, var(--color-brand-accent) 55%);
}
.ws-nav-links {
  display: none;
  gap: var(--space-m);
}
.ws-nav-link {
  position: relative;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color var(--motion-fast) var(--motion-easing);
}
.ws-nav-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.35rem;
  height: 2px;
  background: var(--color-brand-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--motion-normal) var(--motion-easing);
}
.ws-nav-link:hover {
  color: var(--color-text-primary);
}
.ws-nav-link:hover::after {
  transform: scaleX(1);
}
.ws-nav-cta {
  display: none;
  min-height: 2.5rem;
  padding: 0 1rem;
  font-size: 0.875rem;
}
.ws-menu-button {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: transparent;
  color: var(--color-text-primary);
  cursor: pointer;
}
.ws-menu-icon,
.ws-menu-icon::before,
.ws-menu-icon::after {
  display: block;
  width: 1.1rem;
  height: 2px;
  background: currentColor;
  transition: transform var(--motion-normal) var(--motion-easing), opacity var(--motion-fast);
}
.ws-menu-icon {
  position: relative;
}
.ws-menu-icon::before,
.ws-menu-icon::after {
  content: "";
  position: absolute;
  left: 0;
}
.ws-menu-icon::before {
  top: -6px;
}
.ws-menu-icon::after {
  top: 6px;
}
.ws-nav[data-open="true"] .ws-menu-icon {
  background: transparent;
}
.ws-nav[data-open="true"] .ws-menu-icon::before {
  transform: translateY(6px) rotate(45deg);
}
.ws-nav[data-open="true"] .ws-menu-icon::after {
  transform: translateY(-6px) rotate(-45deg);
}
.ws-mobile-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  padding: var(--space-m) var(--gutter) var(--space-l);
  border-top: 1px solid var(--color-border);
  animation: ws-menu-in var(--motion-normal) var(--motion-easing);
}
.ws-mobile-menu nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}
.ws-mobile-menu .ws-nav-link {
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

/* ---- Hero ---- */

.ws-hero {
  display: grid;
  gap: var(--space-l);
  padding: var(--space-xl) var(--gutter) var(--space-2xl);
  align-items: center;
}
.ws-hero-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-s);
  min-width: 0;
  animation: ws-rise var(--motion-slow) var(--motion-easing) both;
}
.ws-hero-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  line-height: var(--font-display-leading);
  letter-spacing: var(--font-display-tracking);
  font-size: clamp(2.5rem, 10cqi, 5.5rem);
  color: var(--color-text-primary);
  text-wrap: balance;
  overflow-wrap: anywhere;
}
.ws-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}
.ws-hero-visual {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  animation: ws-rise var(--motion-slow) var(--motion-easing) 120ms both;
}
.ws-caption {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-small);
  background: var(--color-background);
  font-family: var(--font-label);
  font-size: 0.6875rem;
  letter-spacing: var(--font-label-tracking);
  text-transform: var(--font-label-transform);
  color: var(--color-text-secondary);
}

/* ---- Credibility ---- */

.ws-credibility {
  padding: var(--space-m) var(--gutter);
  border-block: 1px solid var(--color-border);
}
.ws-credibility-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}
.ws-credibility-label {
  font-family: var(--font-label);
  font-weight: var(--font-label-weight);
  letter-spacing: var(--font-label-tracking);
  text-transform: var(--font-label-transform);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
.ws-credibility-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs) var(--space-l);
}
.ws-credibility-list li {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  font-size: 1.125rem;
  color: var(--color-text-primary);
  opacity: 0.75;
}

/* ---- Problem ---- */

.ws-split {
  display: grid;
  gap: var(--space-l);
}
.ws-problem-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}
.ws-points {
  display: flex;
  flex-direction: column;
}
.ws-points li {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: var(--space-s);
  padding-block: var(--space-s);
  border-top: 1px solid var(--color-border);
  font-size: 1rem;
  color: var(--color-text-primary);
}
.ws-point-number {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  padding-top: 0.15rem;
}

/* ---- How ---- */

.ws-steps {
  display: grid;
  gap: var(--space-m);
  counter-reset: step;
}
.ws-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-m);
  border-top: 2px solid var(--color-border);
}
.ws-step-number {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-button);
  background: var(--color-button-primary);
  color: var(--color-button-primary-text);
  font-family: var(--font-label);
  font-weight: 600;
}
.ws-step-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  line-height: 1.15;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

/* ---- Data ---- */

.ws-data {
  background: color-mix(in srgb, var(--color-surface) 60%, var(--color-background));
  border-block: 1px solid var(--color-border);
}
.ws-data-header {
  display: grid;
  gap: var(--space-s);
  align-items: end;
}

/* ---- Features ---- */

.ws-feature-grid {
  display: grid;
  gap: var(--space-s);
}
.ws-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-m);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--motion-normal) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing),
    opacity var(--motion-slow) var(--motion-easing);
}
.ws-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-text-secondary);
}
.ws-icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-small);
  background: color-mix(in srgb, var(--color-brand-accent) 22%, transparent);
  color: var(--color-text-primary);
}
.ws-icon svg {
  width: 1.4rem;
  height: 1.4rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ws-card-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  line-height: 1.15;
  font-size: 1.375rem;
  color: var(--color-text-primary);
}

/* ---- Impact ---- */

.ws-impact {
  padding: var(--space-2xl) var(--gutter);
  background: var(--color-surface-inverse);
  color: var(--color-text-inverse);
}
.ws-impact .ws-eyebrow,
.ws-impact .ws-title {
  color: var(--color-text-inverse);
}
.ws-impact .ws-eyebrow {
  opacity: 0.8;
}
.ws-impact-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}
.ws-figures {
  display: grid;
  gap: var(--space-m);
}
.ws-figure {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-2xs);
  padding-top: var(--space-s);
  border-top: 2px solid var(--color-brand-secondary);
}
.ws-figure-value {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  line-height: 1;
  font-size: clamp(2.75rem, 7cqi, 4.5rem);
}
.ws-figure-label {
  font-size: 1rem;
  opacity: 0.85;
}
.ws-quote {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  max-width: 48rem;
  padding-left: var(--space-m);
  border-left: 3px solid var(--color-brand-accent);
}
.ws-quote blockquote {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  line-height: 1.25;
  font-size: clamp(1.375rem, 3.2cqi, 2rem);
}
.ws-quote figcaption {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  letter-spacing: var(--font-label-tracking);
  opacity: 0.8;
}

/* ---- CTA ---- */

.ws-cta-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-s);
  max-width: 40rem;
  margin-inline: auto;
  text-align: center;
}
.ws-cta-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  line-height: var(--font-display-leading);
  letter-spacing: var(--font-display-tracking);
  font-size: clamp(2.25rem, 7cqi, 4rem);
  color: var(--color-text-primary);
  text-wrap: balance;
}
.ws-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
  margin-top: var(--space-s);
  padding: var(--space-m);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  text-align: left;
}
.ws-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
.ws-field input {
  min-height: 2.9rem;
  padding: 0 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  background: var(--color-background);
  color: var(--color-text-primary);
  font: inherit;
  font-weight: 400;
}
.ws-field input:focus-visible {
  outline: 3px solid var(--color-brand-accent);
  outline-offset: 1px;
  border-color: var(--color-text-primary);
}
.ws-field input[aria-invalid="true"] {
  border-color: var(--color-text-primary);
  border-width: 2px;
}
.ws-form-error {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}
.ws-form-error::before {
  content: "! ";
}
.ws-form-note {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: center;
}
.ws-success {
  width: 100%;
  margin-top: var(--space-s);
  padding: var(--space-m);
  border-left: 4px solid var(--color-brand-accent);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text-primary);
  text-align: left;
}

/* ---- Footer ---- */

.ws-footer {
  padding: var(--space-xl) var(--gutter) var(--space-m);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.ws-footer-top {
  display: grid;
  gap: var(--space-l);
}
.ws-footer-brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
  max-width: 24rem;
}
.ws-footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s) var(--space-m);
}
.ws-footer-link {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  text-decoration: none;
}
.ws-footer-link:hover {
  text-decoration: underline;
  text-decoration-color: var(--color-brand-accent);
  text-underline-offset: 0.3em;
}
.ws-footer-bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-xs);
  margin-top: var(--space-xl);
  padding-top: var(--space-m);
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
}

/* ---- Tablet and up ---- */

@container (min-width: 600px) {
  .ws-site {
    --gutter: var(--space-l);
  }
  .ws-menu-button,
  .ws-mobile-menu {
    display: none !important;
  }
  .ws-nav-links {
    display: flex;
  }
  .ws-steps,
  .ws-figures {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ws-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ws-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
  }
  .ws-form .ws-button,
  .ws-form-error,
  .ws-form-note {
    grid-column: 1 / -1;
  }
  .ws-footer-top {
    grid-template-columns: 1fr auto;
    align-items: start;
  }
}

/* ---- Desktop ---- */

@container (min-width: 1000px) {
  .ws-site {
    --gutter: max(var(--space-xl), calc((100cqi - 72rem) / 2));
  }
  .ws-nav-cta {
    display: inline-flex;
  }
  .ws-hero {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: var(--space-xl);
    padding-block: var(--space-2xl) var(--space-3xl);
    min-height: 40rem;
  }
  .ws-hero-visual {
    aspect-ratio: 4 / 5;
  }
  .ws-credibility-inner {
    flex-direction: row;
    align-items: center;
    gap: var(--space-xl);
  }
  .ws-split {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-2xl);
  }
  .ws-data-header {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--space-xl);
  }
  .ws-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ws-impact-inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: var(--space-xl) var(--space-2xl);
    align-items: end;
  }
  .ws-quote {
    grid-column: 1 / -1;
  }
}

@keyframes ws-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
@keyframes ws-menu-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
}


/* ---- Simplified mobile layout (a website layout setting) ---- */

@container (max-width: 599px) {
  .ws-site[data-mobile-simple="true"] {
    --gutter: var(--space-s);
  }
  .ws-site[data-mobile-simple="true"] .ws-credibility,
  .ws-site[data-mobile-simple="true"] .ws-hero-visual,
  .ws-site[data-mobile-simple="true"] .ws-quote,
  .ws-site[data-mobile-simple="true"] .ws-feature-grid > li:nth-child(n + 4),
  .ws-site[data-mobile-simple="true"] .ws-points li:nth-child(n + 3) {
    display: none;
  }
  .ws-site[data-mobile-simple="true"] .ws-section,
  .ws-site[data-mobile-simple="true"] .ws-impact {
    padding-block: var(--space-xl);
  }
}

/* ---------- Coastline explorer (wx-) ---------- */

/* Brand tokens only. */

.wx-explorer {
  display: grid;
  gap: var(--space-m);
  min-width: 0;
}

.wx-map-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}
.wx-map {
  width: 100%;
  height: 100%;
}

.wx-sea {
  fill: var(--color-surface);
}
.wx-grid-line {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
}
.wx-contour {
  fill: none;
  stroke: var(--color-brand-primary);
  stroke-width: 1.2;
  transition: d var(--motion-normal) var(--motion-easing);
}
.wx-land {
  fill: var(--color-brand-secondary);
  opacity: 0.55;
}
.wx-lost {
  opacity: 0.9;
}
.wx-hatch-line {
  stroke: var(--color-brand-accent);
  stroke-width: 3;
}
.wx-old-shore {
  fill: none;
  stroke: var(--color-text-secondary);
  stroke-width: 1.5;
  stroke-dasharray: 5 6;
  opacity: 0.7;
}
.wx-shore {
  fill: none;
  stroke: var(--color-text-primary);
  stroke-width: 2.5;
}
.wx-tide {
  fill: none;
  stroke: var(--color-button-primary);
  stroke-width: 2;
  stroke-dasharray: 2 9;
  stroke-linecap: round;
  animation: wx-tide 3.5s ease-in-out infinite alternate;
}
.wx-grain {
  pointer-events: none;
  mix-blend-mode: multiply;
}

.wx-site {
  cursor: pointer;
}
.wx-dot {
  fill: var(--color-surface);
  stroke: var(--color-text-primary);
  stroke-width: 3;
}
.wx-site[data-active="true"] .wx-dot {
  fill: var(--color-button-primary);
  stroke: var(--color-button-primary-text);
}
.wx-site:not([data-active="true"]) .wx-pulse {
  display: none;
}
.wx-pulse {
  fill: none;
  stroke: var(--color-button-primary);
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: wx-pulse 2.4s ease-out infinite;
}
.wx-site-label {
  fill: var(--color-text-primary);
  font-family: var(--font-label);
  font-size: 15px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 5px;
  stroke-linejoin: round;
}

/* Style variants follow the direction's illustration style. */
.wx-explorer[data-visual="grid"] .wx-shore {
  stroke-linejoin: miter;
  stroke-width: 2;
}
.wx-explorer[data-visual="grid"] .wx-land {
  opacity: 0.25;
}
.wx-explorer[data-visual="soft"] .wx-shore {
  stroke-width: 5;
  stroke-linecap: round;
  stroke: var(--color-brand-primary);
}
.wx-explorer[data-visual="soft"] .wx-contour {
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.18 !important;
}
.wx-explorer[data-visual="soft"] .wx-land {
  opacity: 0.85;
}

.wx-badge,
.wx-illustrative {
  position: absolute;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-small);
  font-family: var(--font-label);
  font-size: 0.75rem;
  letter-spacing: var(--font-label-tracking);
}
.wx-badge {
  top: 0.75rem;
  left: 0.75rem;
  background: var(--color-surface-inverse);
  color: var(--color-text-inverse);
  font-weight: 600;
}
.wx-illustrative {
  right: 0.75rem;
  bottom: 0.75rem;
  background: var(--color-background);
  color: var(--color-text-secondary);
  text-transform: var(--font-label-transform);
}

.wx-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  min-width: 0;
}
.wx-controls {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}
.wx-play {
  display: grid;
  place-items: center;
  flex: none;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: var(--radius-button);
  background: var(--color-button-primary);
  color: var(--color-button-primary-text);
  cursor: pointer;
  transition: transform var(--motion-fast) var(--motion-easing);
}
.wx-play:hover {
  transform: scale(1.06);
}
.wx-play svg {
  width: 1rem;
  height: 1rem;
  fill: currentColor;
}
.wx-slider {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 0;
}
.wx-slider-label {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}
.wx-slider-label strong {
  color: var(--color-text-primary);
}
.wx-slider-label em {
  font-style: normal;
}
.wx-slider input {
  width: 100%;
  accent-color: var(--color-button-primary);
}
.wx-scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-label);
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.wx-readout {
  padding: var(--space-s) var(--space-m);
  border-left: 3px solid var(--color-brand-accent);
  background: var(--color-surface);
  border-radius: 0 var(--radius-small) var(--radius-small) 0;
}
.wx-readout-name {
  font-family: var(--font-label);
  font-weight: var(--font-label-weight);
  letter-spacing: var(--font-label-tracking);
  text-transform: var(--font-label-transform);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
.wx-readout-value {
  font-family: var(--font-display);
  font-weight: var(--font-display-weight);
  letter-spacing: var(--font-display-tracking);
  font-size: 2.75rem;
  line-height: 1;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}
.wx-readout-text {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
}

.wx-sites {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2xs);
}
.wx-site-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--motion-easing), background-color var(--motion-fast) var(--motion-easing);
}
.wx-site-button:hover {
  border-color: var(--color-text-secondary);
}
.wx-site-button[aria-pressed="true"] {
  border-color: var(--color-button-primary);
  background: var(--color-button-primary);
  color: var(--color-button-primary-text);
}
.wx-site-value {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
}
.wx-site-button:focus-visible,
.wx-play:focus-visible {
  outline: 3px solid var(--color-brand-accent);
  outline-offset: 2px;
}

/* On narrow sites the labels crowd the map; the list below carries the names instead. */
@container (max-width: 599px) {
  .wx-site-label {
    display: none;
  }
  .wx-map-wrap {
    aspect-ratio: 4 / 5;
  }
  .wx-readout-value {
    font-size: 2.25rem;
  }
}

@container (min-width: 1000px) {
  .wx-explorer {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-l);
  }
  .wx-sites {
    grid-template-columns: 1fr;
  }
}

@keyframes wx-tide {
  from {
    transform: translateX(-4px);
  }
  to {
    transform: translateX(8px);
  }
}
@keyframes wx-pulse {
  from {
    transform: scale(0.6);
    opacity: 0.8;
  }
  to {
    transform: scale(1.6);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wx-tide,
  .wx-site:not([data-active="true"]) .wx-pulse {
  display: none;
}
.wx-pulse {
    animation: none;
  }
}

/* ---------- Illustrations (wv-) ---------- */

/* Brand tokens only. No raw colours in this file. */

.wv-visual {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Contours (editorial) */
.wv-contours-land {
  fill: var(--color-brand-secondary);
  opacity: 0.35;
}
.wv-contour-line {
  fill: none;
  stroke: var(--color-brand-primary);
  stroke-width: 1;
}
.wv-tide-line {
  fill: none;
  stroke: var(--color-brand-accent);
  stroke-width: 2;
  stroke-dasharray: 2 5;
  stroke-linecap: round;
  animation: wv-tide var(--motion-slow, 900ms) var(--motion-easing, ease-in-out) infinite alternate;
  animation-duration: 4.5s;
}
.wv-point-ring {
  fill: none;
  stroke: var(--color-brand-primary);
  stroke-width: 1;
  opacity: 0.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: wv-pulse 3.2s var(--motion-easing, ease-out) infinite;
}
.wv-point-dot {
  fill: var(--color-brand-primary);
}

/* Grid (technical) */
.wv-grid-line {
  fill: none;
  stroke: var(--color-border);
  stroke-width: 1;
}
.wv-grid-contour {
  fill: none;
  stroke: var(--color-brand-secondary);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.wv-scan-line {
  stroke: var(--color-brand-accent);
  stroke-width: 1;
  opacity: 0.7;
  animation: wv-scan 5s linear infinite;
}
.wv-grid-point {
  fill: var(--color-brand-accent);
}
.wv-grid-label {
  fill: var(--color-text-secondary);
  font-family: var(--font-label);
  font-size: 9px;
  letter-spacing: 0.04em;
  white-space: pre;
}

/* Soft (community) */
.wv-sun {
  fill: var(--color-brand-accent);
  opacity: 0.9;
}
.wv-soft-land {
  fill: var(--color-brand-secondary);
  opacity: 0.55;
}
.wv-soft-land-inner {
  fill: var(--color-brand-secondary);
}
.wv-wave {
  fill: none;
  stroke: var(--color-brand-primary);
  stroke-width: 5;
  stroke-linecap: round;
  opacity: 0.35;
  animation: wv-bob 4s var(--motion-easing, ease-in-out) infinite alternate;
}
.wv-wave:nth-of-type(2) {
  animation-delay: -1.3s;
}
.wv-wave:nth-of-type(3) {
  animation-delay: -2.6s;
}
.wv-soft-point {
  fill: var(--color-surface);
  stroke: var(--color-brand-primary);
  stroke-width: 3;
}

@keyframes wv-tide {
  from {
    transform: translateX(4px);
  }
  to {
    transform: translateX(16px);
  }
}
@keyframes wv-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
@keyframes wv-scan {
  from {
    transform: translateX(120px);
  }
  to {
    transform: translateX(400px);
  }
}
@keyframes wv-bob {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-5px);
  }
}
`;
