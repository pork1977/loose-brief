import { PageTransition } from "@/components/PageTransition";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Panel } from "@/components/ui/Panel";
import { STAGES, type Stage } from "@/lib/stages";
import styles from "./StagePlaceholder.module.css";

type Props = {
  stageId: Stage["id"];
  phase: number;
  /** What this screen will hold, shown as cards until it's built. */
  parts: { title: string; body: string }[];
};

/*
 * Stand-in for a studio screen that hasn't been built yet. It uses the real
 * panel and card components so the shell can be checked end to end, and says
 * plainly which phase builds it.
 */
export function StagePlaceholder({ stageId, phase, parts }: Props) {
  const index = STAGES.findIndex((s) => s.id === stageId);
  const stage = STAGES[index];
  const prev = STAGES[index - 1];
  const next = STAGES[index + 1];

  return (
    <PageTransition>
      <div className={styles.page}>
        <header className={styles.header}>
          <p className="ui-eyebrow">
            Stage {stage.number} <span aria-hidden="true">/</span> {stage.label}
          </p>
          <h1 className={styles.title}>{stage.label}</h1>
          <p className={styles.summary}>{stage.summary}</p>
        </header>

        <Panel title={`Built in Phase ${phase}`} actions={<span className="ui-chip">Not built yet</span>}>
          <ul className={styles.parts}>
            {parts.map((part) => (
              <Card as="li" key={part.title}>
                <CardTitle>{part.title}</CardTitle>
                <CardBody>{part.body}</CardBody>
              </Card>
            ))}
          </ul>
        </Panel>

        <nav className={styles.pager} aria-label="Stage navigation">
          {prev ? (
            <ButtonLink href={prev.href} variant="ghost" transitionTypes={["nav-back"]}>
              <span aria-hidden="true">&larr;</span> {prev.label}
            </ButtonLink>
          ) : (
            <span />
          )}
          {next ? (
            <ButtonLink href={next.href} variant="primary" transitionTypes={["nav-forward"]}>
              {next.label} <span aria-hidden="true">&rarr;</span>
            </ButtonLink>
          ) : null}
        </nav>
      </div>
    </PageTransition>
  );
}
