"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CoastlineVisual } from "@/components/brand/CoastlineVisual";
import type { Direction } from "@/lib/direction";
import { navTarget, type Section, type SectionOf } from "@/lib/website";
import { CoastlineExplorer } from "./CoastlineExplorer";
import { Reveal } from "./Reveal";
import { useWebsiteFrame, type SiteTarget } from "./WebsiteContext";
import { SiteStyles, siteClasses } from "./site-classes";

const styles = siteClasses("ws");

/*
 * The generated homepage: navigation, hero, then the direction's website
 * sections, rendered only from brand tokens (it must sit inside a BrandScope).
 *
 * The same component is a working site in the Studio and a static picture in
 * thumbnails; see WebsiteContext. Layouts respond to the width of the frame,
 * using container queries, so desktop, tablet and mobile previews are real
 * layouts rather than scaled screenshots.
 *
 * data-tokens on elements lists the tokens they read, for the token inspector.
 */
export function Website({ brandName, direction }: { brandName: string; direction: Direction }) {
  const { website } = direction;
  const { exporting } = useWebsiteFrame();
  return (
    <div
      className={styles.site}
      id={exporting ? "top" : undefined}
      data-mobile-simple={website.layout.mobileSimplified}
      data-tokens="--color-background --font-body"
    >
      {exporting ? null : <SiteStyles />}
      <Nav brandName={brandName} direction={direction} />
      <main>
        <Hero direction={direction} />
        {website.sections.map((section) => (section.hidden ? null : <SectionView key={section.id} section={section} direction={direction} brandName={brandName} />))}
      </main>
    </div>
  );
}

function SectionView({ section, direction, brandName }: { section: Section; direction: Direction; brandName: string }) {
  const { exporting } = useWebsiteFrame();
  // Exported pages link to sections by id; in the Studio, links scroll the frame instead, and two
  // previews side by side would otherwise repeat the same ids.
  if (exporting) {
    return (
      <div id={section.type} className={styles.anchor}>
        <SectionBody section={section} direction={direction} brandName={brandName} />
      </div>
    );
  }
  return <SectionBody section={section} direction={direction} brandName={brandName} />;
}

function SectionBody({ section, direction, brandName }: { section: Section; direction: Direction; brandName: string }) {
  switch (section.type) {
    case "credibility":
      return <Credibility section={section} />;
    case "problem":
      return <Problem section={section} />;
    case "how":
      return <How section={section} />;
    case "data":
      return <Data section={section} direction={direction} />;
    case "features":
      return <Features section={section} />;
    case "impact":
      return <Impact section={section} />;
    case "cta":
      return <Cta section={section} direction={direction} />;
    case "footer":
      return <Footer section={section} direction={direction} brandName={brandName} />;
  }
}

/* ------------------------------------------------------------------ links */

function SiteLink({ to, className, children, tokens, onNavigate }: { to: SiteTarget; className?: string; children: ReactNode; tokens?: string; onNavigate?: () => void }) {
  const { interactive, exporting, goTo } = useWebsiteFrame();
  if (exporting) {
    // A plain in-page link; the exported stylesheet handles smooth scrolling and the sticky nav offset.
    return (
      <a href={`#${to}`} className={className} data-ws-link="">
        {children}
      </a>
    );
  }
  return (
    <a
      href={`#${to}`}
      className={className}
      data-tokens={tokens}
      tabIndex={interactive ? undefined : -1}
      onClick={(e) => {
        e.preventDefault();
        if (!interactive) return;
        goTo(to);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

function Heading({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <Reveal className={styles.heading}>
      <p className={styles.eyebrow} data-tokens="--font-label --font-label-transform --color-text-secondary">
        {eyebrow}
      </p>
      <h2 id={id} className={styles.title} data-tokens="--font-display --font-display-weight --font-display-leading --color-text-primary">
        {title}
      </h2>
    </Reveal>
  );
}

/* -------------------------------------------------------------------- nav */

function Nav({ brandName, direction }: { brandName: string; direction: Direction }) {
  const [open, setOpen] = useState(false);
  const { interactive } = useWebsiteFrame();
  const menuId = useId();
  const { sample, website } = direction;

  const links = sample.nav.map((label, i) => (
    <SiteLink key={label + i} to={navTarget(website, i)} className={styles.navLink} tokens="--font-body --color-text-secondary" onNavigate={() => setOpen(false)}>
      {label}
    </SiteLink>
  ));

  return (
    <header className={styles.nav} data-open={open} data-tokens="--color-background --color-border --space-s">
      <div className={styles.navInner}>
        <SiteLink to="top" className={styles.logo} tokens="--font-display --color-text-primary">
          <span className={styles.logoMark} aria-hidden="true" data-tokens="--color-button-primary --radius-small" />
          {brandName}
        </SiteLink>
        <nav className={styles.navLinks} aria-label="Main">
          {links}
        </nav>
        <SiteLink to="cta" className={`${styles.button} ${styles.buttonPrimary} ${styles.navCta}`} tokens="--color-button-primary --color-button-primary-text --radius-button">
          {sample.primaryCta}
        </SiteLink>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls={menuId}
          data-ws="menu-button"
          tabIndex={interactive ? undefined : -1}
          onClick={() => setOpen((o) => !o)}
          data-tokens="--color-border --radius-button"
        >
          <span className="visually-hidden">{open ? "Close menu" : "Open menu"}</span>
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>
      <div id={menuId} className={styles.mobileMenu} hidden={!open}>
        <nav aria-label="Main (mobile)">{links}</nav>
        <SiteLink to="cta" className={`${styles.button} ${styles.buttonPrimary}`} onNavigate={() => setOpen(false)}>
          {sample.primaryCta}
        </SiteLink>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------- hero */

function Hero({ direction }: { direction: Direction }) {
  const { sample, visual, website } = direction;
  const id = useId();
  return (
    <section className={styles.hero} data-section="hero" aria-labelledby={id} data-tokens="--space-2xl --space-l">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow} data-tokens="--font-label --font-label-transform --color-text-secondary">
          {sample.eyebrow}
        </p>
        <h1 id={id} className={styles.heroTitle} data-tokens="--font-display --font-display-weight --font-display-leading --font-display-tracking --color-text-primary">
          {sample.headline}
        </h1>
        <p className={styles.lead} data-tokens="--font-body --font-body-leading --color-text-secondary">
          {sample.body}
        </p>
        <div className={styles.actions}>
          <SiteLink to="cta" className={`${styles.button} ${styles.buttonPrimary}`} tokens="--color-button-primary --color-button-primary-text --radius-button">
            {sample.primaryCta}
          </SiteLink>
          <SiteLink to={navTarget(website, 0)} className={`${styles.button} ${styles.buttonSecondary}`} tokens="--color-border --color-text-primary --radius-button">
            {sample.secondaryCta}
          </SiteLink>
        </div>
      </div>
      <div className={styles.heroVisual} data-tokens="--color-surface --color-border --radius-card --shadow-card --color-brand-primary --color-brand-secondary --color-brand-accent">
        <CoastlineVisual style={visual} />
        <span className={styles.caption}>Illustrative</span>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- sections */

function Credibility({ section }: { section: SectionOf<"credibility"> }) {
  return (
    <section className={styles.credibility} data-section="credibility" aria-label={section.label} data-tokens="--color-border --color-text-secondary">
      <Reveal className={styles.credibilityInner}>
        <p className={styles.credibilityLabel} data-tokens="--font-label --color-text-secondary">
          {section.label}
        </p>
        <ul className={styles.credibilityList}>
          {section.items.map((item) => (
            <li key={item} data-tokens="--font-display --color-text-primary">
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

function Problem({ section }: { section: SectionOf<"problem"> }) {
  const id = useId();
  return (
    <section className={`${styles.section} ${styles.problem}`} data-section="problem" aria-labelledby={id}>
      <div className={styles.split}>
        <Heading id={id} eyebrow={section.eyebrow} title={section.title} />
        <Reveal className={styles.problemBody} delay={80}>
          <p className={styles.lead} data-tokens="--font-body --color-text-secondary">
            {section.body}
          </p>
          <ol className={styles.points}>
            {section.points.map((point, i) => (
              <li key={i} data-tokens="--color-border --color-brand-accent">
                <span className={styles.pointNumber} aria-hidden="true" data-tokens="--font-label --color-text-secondary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {point}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

function How({ section }: { section: SectionOf<"how"> }) {
  const id = useId();
  return (
    <section className={`${styles.section} ${styles.how}`} data-section="how" aria-labelledby={id}>
      <Heading id={id} eyebrow={section.eyebrow} title={section.title} />
      <ol className={styles.steps}>
        {section.steps.map((step, i) => (
          <Reveal as="li" key={i} className={styles.step} delay={i * 90}>
            <span className={styles.stepNumber} aria-hidden="true" data-tokens="--color-button-primary --color-button-primary-text --radius-button --font-label">
              {i + 1}
            </span>
            <h3 className={styles.stepTitle} data-tokens="--font-display --color-text-primary">
              {step.title}
            </h3>
            <p className={styles.body} data-tokens="--font-body --color-text-secondary">
              {step.body}
            </p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Data({ section, direction }: { section: SectionOf<"data">; direction: Direction }) {
  const id = useId();
  return (
    <section className={`${styles.section} ${styles.data}`} data-section="data" aria-labelledby={id} data-tokens="--color-surface --space-2xl">
      <div className={styles.dataHeader}>
        <Heading id={id} eyebrow={section.eyebrow} title={section.title} />
        <Reveal delay={60}>
          <p className={styles.lead} data-tokens="--font-body --color-text-secondary">
            {section.body}
          </p>
        </Reveal>
      </div>
      <Reveal delay={120}>
        <CoastlineExplorer visual={direction.visual} title={section.title} />
      </Reveal>
    </section>
  );
}

const FEATURE_ICONS = [
  "M4 18 C 8 10, 12 14, 16 6 M4 22h16",
  "M4 20 L10 12 L14 16 L20 6 M16 6h4v4",
  "M5 5h14v14H5z M5 10h14 M10 10v9",
  "M6 4h9l3 3v13H6z M9 11h6 M9 15h6",
  "M12 4v10 M12 18v2 M5 20h14L12 4z",
  "M12 4v11 M7 10l5 5 5-5 M5 20h14",
];

function Features({ section }: { section: SectionOf<"features"> }) {
  const id = useId();
  return (
    <section className={`${styles.section} ${styles.features}`} data-section="features" aria-labelledby={id}>
      <Heading id={id} eyebrow={section.eyebrow} title={section.title} />
      <ul className={styles.featureGrid}>
        {section.items.map((item, i) => (
          <Reveal as="li" key={i} className={styles.card} delay={(i % 3) * 70}>
            <span className={styles.icon} aria-hidden="true" data-tokens="--color-brand-accent --color-text-primary --radius-small">
              <svg viewBox="0 0 24 24">
                <path d={FEATURE_ICONS[i % FEATURE_ICONS.length]} />
              </svg>
            </span>
            <h3 className={styles.cardTitle} data-tokens="--font-display --color-text-primary">
              {item.title}
            </h3>
            <p className={styles.body} data-tokens="--font-body --color-text-secondary">
              {item.body}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function Impact({ section }: { section: SectionOf<"impact"> }) {
  const id = useId();
  return (
    <section className={styles.impact} data-section="impact" aria-labelledby={id} data-tokens="--color-surface-inverse --color-text-inverse">
      <div className={styles.impactInner}>
        <Reveal className={styles.heading}>
          <p className={styles.eyebrow}>{section.eyebrow}</p>
          <h2 id={id} className={styles.title}>
            {section.title}
          </h2>
        </Reveal>
        <dl className={styles.figures}>
          {section.figures.map((figure, i) => (
            <Reveal key={i} className={styles.figure} delay={i * 90}>
              <dt className={styles.figureLabel}>{figure.label}</dt>
              <dd className={styles.figureValue} data-tokens="--font-display --color-brand-secondary">
                {figure.value}
              </dd>
            </Reveal>
          ))}
        </dl>
        <Reveal as="figure" className={styles.quote} delay={120}>
          <blockquote data-tokens="--font-display --color-text-inverse">{section.quote}</blockquote>
          <figcaption>{section.attribution}</figcaption>
        </Reveal>
      </div>
    </section>
  );
}

function Cta({ section, direction }: { section: SectionOf<"cta">; direction: Direction }) {
  const { interactive, exporting } = useWebsiteFrame();
  const id = useId();
  if (exporting) return <ExportedCta section={section} direction={direction} />;
  return <LiveCta section={section} direction={direction} interactive={interactive} id={id} />;
}

/*
 * The downloaded site's form: the same markup, with the error and thank-you
 * messages already in the page (hidden) for its script to reveal. It doesn't
 * send anywhere; the README in the download explains how to connect it.
 */
function ExportedCta({ section, direction }: { section: SectionOf<"cta">; direction: Direction }) {
  const id = useId();
  return (
    <section className={`${styles.section} ${styles.cta}`} data-section="cta" aria-labelledby={id}>
      <Reveal className={styles.ctaInner}>
        <p className={styles.eyebrow}>{section.eyebrow}</p>
        <h2 id={id} className={styles.ctaTitle}>
          {section.title}
        </h2>
        <p className={styles.lead}>{section.body}</p>
        <p className={styles.success} role="status" data-ws="form-success" hidden>
          {section.success}
        </p>
        <form className={styles.form} data-ws="form" noValidate>
          <label className={styles.field}>
            <span>Work email</span>
            <input type="email" name="email" placeholder="name@example.com" autoComplete="email" required />
          </label>
          <label className={styles.field}>
            <span>Organisation (optional)</span>
            <input name="organisation" autoComplete="organization" />
          </label>
          <p className={styles.formError} role="alert" data-ws="form-error" hidden>
            Enter an email address, like name@example.com.
          </p>
          <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`}>
            {direction.sample.primaryCta}
          </button>
        </form>
      </Reveal>
    </section>
  );
}

function LiveCta({ section, direction, interactive, id }: { section: SectionOf<"cta">; direction: Direction; interactive: boolean; id: string }) {
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!interactive) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter an email address, like name@example.com.");
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <section className={`${styles.section} ${styles.cta}`} data-section="cta" aria-labelledby={id} data-tokens="--color-background --space-2xl">
      <Reveal className={styles.ctaInner}>
        <p className={styles.eyebrow}>{section.eyebrow}</p>
        <h2 id={id} className={styles.ctaTitle} data-tokens="--font-display --font-display-leading --color-text-primary">
          {section.title}
        </h2>
        <p className={styles.lead}>{section.body}</p>

        {sent ? (
          <p className={styles.success} role="status" data-tokens="--color-surface --color-brand-accent --radius-card">
            {section.success}
          </p>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate data-tokens="--color-surface --color-border --radius-card">
            <label className={styles.field}>
              <span>Work email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="off"
                tabIndex={interactive ? undefined : -1}
                aria-invalid={error ? true : undefined}
                data-tokens="--color-border --radius-small --color-text-primary"
              />
            </label>
            <label className={styles.field}>
              <span>Organisation (optional)</span>
              <input
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                autoComplete="off"
                tabIndex={interactive ? undefined : -1}
                data-tokens="--color-border --radius-small"
              />
            </label>
            {error ? (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} tabIndex={interactive ? undefined : -1} data-tokens="--color-button-primary --color-button-primary-text --radius-button">
              {direction.sample.primaryCta}
            </button>
            <p className={styles.formNote}>Preview only. Nothing you type here is sent anywhere.</p>
          </form>
        )}
      </Reveal>
    </section>
  );
}

function Footer({ section, direction, brandName }: { section: SectionOf<"footer">; direction: Direction; brandName: string }) {
  const targets: SiteTarget[] = ["top", navTarget(direction.website, 1), navTarget(direction.website, 2), "cta"];
  return (
    <footer className={styles.footer} data-section="footer" data-tokens="--color-border --color-text-secondary">
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <SiteLink to="top" className={styles.logo} tokens="--font-display --color-text-primary">
            <span className={styles.logoMark} aria-hidden="true" />
            {brandName}
          </SiteLink>
          <p className={styles.body}>{section.tagline}</p>
        </div>
        <nav aria-label="Footer" className={styles.footerLinks}>
          {section.links.map((link, i) => (
            <SiteLink key={link + i} to={targets[i % targets.length]} className={styles.footerLink}>
              {link}
            </SiteLink>
          ))}
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <p>
          &copy; {new Date().getFullYear()} {brandName}
        </p>
        <p>{section.note}</p>
      </div>
    </footer>
  );
}

