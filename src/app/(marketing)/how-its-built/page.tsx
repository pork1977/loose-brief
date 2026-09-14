import type { Metadata } from "next";
import Link from "next/link";
import { TryDemoButton } from "@/components/landing/TryDemoButton";
import { PageTransition } from "@/components/PageTransition";
import { ButtonLink } from "@/components/ui/Button";
import { DEMO_BRIEF } from "@/data/demo-brief";
import { littoralIntelligence } from "@/data/demo-directions";
import { formatRatio, runContrastChecks } from "@/lib/accessibility";
import { proposalJson } from "@/lib/refinement";
import { compileTokens } from "@/lib/tokens";
import { askDirector } from "@/state/director";
import landing from "../landing.module.css";
import styles from "./how-its-built.module.css";

export const metadata: Metadata = {
  title: "How it's built",
  description: "How Loose Brief works: design tokens, one project history, a homepage rendered from tokens, a rule-based Creative Director and exports made in the browser.",
};

/*
 * The examples on this page are produced by the app's own code when the page
 * is built, not typed in by hand, so they can't drift from what it really does.
 */
const SHOWN_TOKENS = ["--color-brand-primary", "--color-background", "--color-text-primary", "--color-button-primary", "--font-display", "--space-m", "--radius-button", "--motion-normal", "--motion-easing"];

function tokenExample() {
  const compiled = compileTokens(littoralIntelligence.tokens, "light");
  const lines = SHOWN_TOKENS.map((name) => `  ${name}: ${compiled[name as keyof typeof compiled]};`);
  return `.brand-scope {\n${lines.join("\n")}\n  /* ...and ${Object.keys(compiled).length - SHOWN_TOKENS.length} more */\n}`;
}

function directorExample() {
  const message = askDirector("Make it more premium", { direction: littoralIntelligence, brief: DEMO_BRIEF }, "2026-01-01T00:00:00.000Z");
  return message.reply.kind === "proposal" ? JSON.stringify(proposalJson(message.reply), null, 2) : "";
}

const JOURNEY = [
  { label: "Brief", holds: "Your answers, checked one step at a time." },
  { label: "Directions", holds: "Three complete sets of tokens, each with its own strategy, voice, imagery and homepage copy." },
  { label: "Brand system", holds: "A working copy of the direction you pick, with a history of every change." },
  { label: "Studio", holds: "That same working copy, shown as a full homepage." },
  { label: "Export", holds: "Files made from the working copy as it is at that moment." },
];

const CONTENTS = [
  ["real", "What's real so far"],
  ["journey", "The journey as data"],
  ["tokens", "Design tokens"],
  ["checks", "Accessibility checks"],
  ["history", "One project, one history"],
  ["website", "The website"],
  ["director", "The Creative Director"],
  ["live", "Live mode"],
  ["exports", "Exports"],
  ["stack", "Stack and tests"],
  ["next", "What's next"],
] as const;

export default function HowItsBuiltPage() {
  const checks = runContrastChecks(littoralIntelligence.tokens, "light");

  return (
    <PageTransition>
      <section className={landing.section} style={{ borderTop: 0 }}>
        <div className={`ui-container ${styles.layout}`}>
          <header className={landing.sectionHeader} style={{ marginBottom: 0 }}>
            <p className="ui-eyebrow">How it&rsquo;s built</p>
            <h1 className={landing.sectionTitle}>How Loose Brief works</h1>
            <p className={landing.sectionLead}>
              A brand in Loose Brief is a set of named values. The brand system edits them, the homepage is drawn from them and every export
              is written from them. This page goes through how that fits together, and what is and isn&rsquo;t in place yet.
            </p>
          </header>

          <nav className={styles.contents} aria-label="On this page">
            <p className={styles.contentsTitle}>On this page</p>
            <ol>
              {CONTENTS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.article}>
            <Section id="real" title="What's real so far">
              <div className={styles.facts}>
                <div className={styles.fact}>
                  <h3>The demo uses no AI</h3>
                  <p>
                    The three Ebbfield directions were written in advance, so the demo works without calling a model. The Creative
                    Director&rsquo;s twelve suggestions are rules, and the personality reading on the brief uses fixed rules. The app says so
                    wherever these appear.
                  </p>
                </div>
                <div className={styles.fact}>
                  <h3>Your own brief uses Claude</h3>
                  <p>
                    In live mode Claude writes three directions from your brief, and handles Creative Director requests the rules don&rsquo;t
                    cover. What it sends back goes through the same checks as the demo data, and is labelled as made by Claude.
                  </p>
                </div>
                <div className={styles.fact}>
                  <h3>Nothing is stored on a server</h3>
                  <p>
                    Your project is saved in your browser, and the downloads are made there. In live mode your brief, and any image you choose
                    to share, goes to Anthropic to get Claude&rsquo;s reply. Loose Brief doesn&rsquo;t keep a copy.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="journey" title="The journey as data">
              <p>Each stage adds to one project, and each one reads what the stage before it left behind.</p>
              <ol className={styles.journey}>
                {JOURNEY.map((stage, i) => (
                  <li key={stage.label}>
                    <span className={styles.journeyNumber}>0{i + 1}</span>
                    <strong>{stage.label}</strong>
                    <span>{stage.holds}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="tokens" title="Design tokens">
              <p>
                Every direction is a set of tokens: brand colours for light and dark mode, three fonts, a spacing scale, corner sizes, a card
                shadow and motion timings. Each set is checked against a strict schema before it&rsquo;s used, so a malformed value can&rsquo;t reach
                the page. That matters more once directions come from a model rather than a file.
              </p>
              <p>
                The tokens become CSS custom properties on a wrapper around the brand preview. The homepage, the direction cards and the component
                samples only ever read those properties, which is why one change shows up everywhere at once. Here are some of the Littoral
                Intelligence direction&rsquo;s:
              </p>
              <Code label="Some of the Littoral Intelligence tokens as CSS">{tokenExample()}</Code>
              <p>
                Loose Brief&rsquo;s own interface uses a separate set of variables that all start <code>--ui-</code>, so editing a brand never
                restyles the editor around it.
              </p>
            </Section>

            <Section id="checks" title="Accessibility checks">
              <p>
                The main pairings of text and background in a brand are checked against the WCAG contrast minimums, in both light and dark mode. When a
                pair fails, the suggested fix changes only the lightness of the colour, so it still looks like the same colour. These are the light
                mode results for Littoral Intelligence:
              </p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Pairing</th>
                      <th scope="col">Contrast</th>
                      <th scope="col">Needs</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((c) => (
                      <tr key={c.id}>
                        <td>{c.label}</td>
                        <td>{formatRatio(c.ratio)}</td>
                        <td>{c.minimum}:1</td>
                        <td>{c.passes ? "Passes" : "Fails"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {checks
                .filter((c) => !c.passes && c.suggestion)
                .map((c) => (
                  <p key={c.id}>
                    &ldquo;{c.label}&rdquo; fails here, with {c.foregroundHex} on {c.backgroundHex}. The app suggests {c.suggestion} instead, the same colour at a
                    lightness that passes, and applies it in one click.
                  </p>
                ))}
              <p>
                The interface itself works with a keyboard, labels its controls for screen readers, and turns off movement for anyone who has asked
                their device for reduced motion. The downloaded website does the same.
              </p>
            </Section>

            <Section id="history" title="One project, one history">
              <p>
                Every change, whether it&rsquo;s a colour picker, a heading you retyped or a Creative Director suggestion, goes through one function
                that takes the project and the change and returns the new project. Because every change is recorded the same way, undo and redo
                work across the brand system, the Studio and the Creative Director, and a drag of a slider counts as one step rather than fifty.
              </p>
              <p>
                The project is saved in your browser with a version number. When the shape of a project changes between versions, older saves are
                upgraded when they load. A save that can&rsquo;t be read is replaced with a fresh project, and the app tells you, rather than showing a
                broken screen.
              </p>
            </Section>

            <Section id="website" title="The website">
              <p>
                One React component draws the homepage from the tokens and the page content. The Studio shows it in frames at real widths: 1280
                pixels for desktop, 834 for tablet and 390 for mobile. The layout responds to the width of its frame rather than the width of your
                browser, so the mobile frame shows the real mobile layout even on a big screen.
              </p>
              <p>
                The download uses the same component, turned into plain HTML, with the same stylesheet and your tokens at the top of it. A small
                script with no libraries handles the mobile menu, the form and the coastline explorer. So the website you download is the page you
                designed, rather than a copy made from it.
              </p>
            </Section>

            <Section id="director" title="The Creative Director">
              <p>A request goes through the same steps every time:</p>
              <ol className={styles.steps}>
                <li>It&rsquo;s matched to one of the twelve rules by key phrases.</li>
                <li>The rule plans changes against the brand as it is now, so the same request does different things to different brands.</li>
                <li>The changes are tried out on a copy, through the same checks the editor uses. If any would break a rule, nothing is suggested.</li>
                <li>You see what will change, with every before and after, and a preview on the page.</li>
                <li>Apply records it as one step you can undo. Cancel leaves the brand alone.</li>
              </ol>
              <p>This is the structured reply for &ldquo;Make it more premium&rdquo; on Littoral Intelligence, as the app produces it:</p>
              <Code label="Creative Director reply as JSON">{directorExample()}</Code>
              <p>
                In live mode, a request none of the rules match goes to Claude along with the brand as it is. Claude answers in this same shape,
                naming each value to change, and the answer goes through the same checks before you see it. If a change names something that
                doesn&rsquo;t exist or breaks a rule, Claude is told exactly which one and asked once more.
              </p>
            </Section>

            <Section id="live" title="Live mode">
              <p>Writing directions from your own brief takes seven requests to Claude, made on the server, and about a minute:</p>
              <ol className={styles.steps}>
                <li>A plan for three routes, so they&rsquo;re clearly different from each other before any detail is written.</li>
                <li>For each direction, the brand itself: strategy, voice, colours, type, shape and movement.</li>
                <li>Then its words: the homepage copy and the reasoning behind each choice, written knowing the brand, so the two agree.</li>
              </ol>
              <p>
                Claude makes the creative choices: the words, the colours, the fonts from Loose Brief&rsquo;s list, how round and how lively, and
                which shapes from a small drawn library the illustration is built from (a car and a map pin for a taxi firm, wheat and a loaf for a
                bakery). The
                app does the mechanical parts, such as working out the second colour mode, fixing contrast and setting spacing, then checks the
                result against the same strict rules as the demo. A direction that fails is sent back once with the problems listed. Progress is
                streamed to the page as each step actually finishes.
              </p>
              <p>
                The instructions and your brief are the same at the start of every request, so they&rsquo;re cached: the first direction goes slightly
                ahead so the other two can reuse what it stored instead of paying to store it again.
                Each visitor can run a few generations an hour, and there&rsquo;s a daily ceiling, with a spending limit on the API key as the backstop.
              </p>
            </Section>

            <Section id="exports" title="Exports">
              <ul className={styles.list}>
                <li>The homepage as a static website: HTML, CSS and a small script, ready for any host.</li>
                <li>CSS variables, design tokens in the W3C JSON format and a Tailwind CSS v4 theme.</li>
                <li>DESIGN.md, the design system written out for developers and AI coding tools.</li>
                <li>Brand guidelines as a web page, with a print layout for saving as PDF.</li>
                <li>A copy deck, the page content as JSON, and two social images.</li>
              </ul>
              <p>All of them are made in your browser from the brand as it is when you press the button.</p>
            </Section>

            <Section id="stack" title="Stack and tests">
              <ul className={styles.list}>
                <li>Next.js 16, React 19 and TypeScript.</li>
                <li>
                  Plain CSS in cascade layers for the app. Brands change while you use them, which suits CSS variables better than classes compiled in
                  advance, so Tailwind is an export here rather than how the app is styled.
                </li>
                <li>Zod for the schemas that brands, briefs and saved projects have to pass.</li>
                <li>fflate to make the zip files in the browser.</li>
                <li>The Anthropic SDK for Claude, used only on the server, with Claude Sonnet 5 by default.</li>
                <li>
                  Unit tests with Node&rsquo;s built-in test runner, covering the project history and upgrades, tokens, contrast, the Creative
                  Director&rsquo;s rules, the exports, and the live generation steps run against a stand-in for Claude.
                </li>
              </ul>
            </Section>

            <Section id="next" title="What's next">
              <p>
                Letting Claude read more of what people already have: PDFs such as existing brand guidelines, and copy pasted from an old
                website. Then making the site easier to find in search engines and AI assistants.
              </p>
              <div className={styles.cta}>
                <TryDemoButton className="ui-button ui-button--primary" />
                <ButtonLink href="/brief" variant="ghost" transitionTypes={["nav-forward"]}>
                  Start a project
                </ButtonLink>
              </div>
              <p className={styles.credit}>
                Loose Brief is Paul Wilson&rsquo;s project: the idea, the decisions and testing every section. The code was written with Claude Code.{" "}
                <Link href="/">Back to the home page</Link>.
              </p>
            </Section>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Code({ label, children }: { label: string; children: string }) {
  return (
    <pre className={styles.code} tabIndex={0} aria-label={label}>
      <code>{children}</code>
    </pre>
  );
}
