import { DirectionShowcase } from "@/components/landing/DirectionShowcase";
import { TokenRipple } from "@/components/landing/TokenRipple";
import { PageTransition } from "@/components/PageTransition";
import { ButtonLink } from "@/components/ui/Button";
import { STAGES } from "@/lib/stages";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <PageTransition>
      <section className={styles.hero}>
        <div className={`ui-container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className="ui-eyebrow">Brief, brand, website</p>
            <h1 className={styles.title}>Turn an idea into an identity.</h1>
            <p className={styles.lead}>
              Describe a business in a few sentences. Loose Brief works up three brand directions, turns the one you
              pick into a design system, and builds a homepage from it that you can edit and download.
            </p>
            <div className={styles.heroActions}>
              <ButtonLink href="/brief" variant="primary" size="large" transitionTypes={["nav-forward"]}>
                Start a project
              </ButtonLink>
              <ButtonLink href="#how-it-works" size="large" variant="ghost">
                See how it works
              </ButtonLink>
            </div>
            <p className={styles.demoNote}>
              The preview shows <strong>Ebbfield</strong>, a made-up coastal data company that Loose Brief uses as
              its demo brand.
            </p>
          </div>
          <DirectionShowcase />
        </div>
      </section>

      <section id="how-it-works" className={styles.section} aria-labelledby="how-it-works-title">
        <div className="ui-container">
          <header className={styles.sectionHeader}>
            <p className="ui-eyebrow">How it works</p>
            <h2 id="how-it-works-title" className={styles.sectionTitle}>
              From a brief to a website in five stages
            </h2>
          </header>
          <ol className={styles.stages}>
            {STAGES.map((stage) => (
              <li key={stage.id} className={styles.stage}>
                <span className={styles.stageNumber}>{stage.number}</span>
                <h3 className={styles.stageLabel}>{stage.label}</h3>
                <p className={styles.stageSummary}>{stage.summary}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tokens-title">
        <div className="ui-container">
          <header className={styles.sectionHeader}>
            <p className="ui-eyebrow">Design tokens</p>
            <h2 id="tokens-title" className={styles.sectionTitle}>
              Try changing a token
            </h2>
            <p className={styles.sectionLead}>
              Every colour, font and corner radius is stored as a named token. The website, its components and the
              exports all read from the same set, so an edit shows up everywhere it&rsquo;s used. Have a go.
            </p>
          </header>
          <TokenRipple />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="closing-title">
        <div className={`ui-container ${styles.closing}`}>
          <div>
            <h2 id="closing-title" className={styles.closingTitle}>
              Got a business idea?
            </h2>
            <p className={styles.sectionLead}>
              Write a short brief and see three directions for it. Or load the demo brief and have a look around first.
            </p>
          </div>
          <ButtonLink href="/brief" variant="primary" size="large" transitionTypes={["nav-forward"]}>
            Start a project
          </ButtonLink>
        </div>
      </section>
    </PageTransition>
  );
}
