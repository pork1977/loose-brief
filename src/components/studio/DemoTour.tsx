"use client";

import { usePathname } from "next/navigation";
import { isDemoBrief } from "@/data/demo-brief";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";
import { useProject } from "@/state/project-store";
import { setTourHidden, useTourHidden } from "@/state/tour";
import styles from "./DemoTour.module.css";

/*
 * A short walkthrough for the Ebbfield demo: on each stage, what it's for and
 * a couple of things worth trying. It only appears while the demo brief is
 * loaded, and stays hidden once someone hides it.
 */

const TOUR: Record<Stage["id"], { title: string; tries: string[] }> = {
  brief: {
    title: "This is the Ebbfield demo brief, already filled in.",
    tries: ["Look through the five steps to see what a brief asks for.", "Then press Generate directions."],
  },
  directions: {
    title: "Three directions from the same brief, each a different answer to it.",
    tries: ["Tick Compare on two cards to see them side by side.", "Press Show me why on a card, then select the one you like."],
  },
  "brand-system": {
    title: "The brand as design tokens. Every value here is editable.",
    tries: ["Change a colour in Colours, or a font in Type, and watch the preview.", "Press Ctrl+Z to undo it."],
  },
  studio: {
    title: "The homepage built from those tokens.",
    tries: [
      "Ask the Creative Director to make it more premium, look at the before and after, then apply it.",
      "Undo it, then try the other device frames.",
    ],
  },
  export: {
    title: "Everything you've made, ready to download.",
    tries: ["Download the website and open index.html in your browser.", "How it's built explains what's going on underneath."],
  },
};

export function DemoTour() {
  const pathname = usePathname();
  const project = useProject();
  const hidden = useTourHidden();
  const index = stageIndex(pathname);

  if (hidden || index < 0 || !project || !isDemoBrief(project.state.brief)) return null;
  // Stages after Directions show a gate instead until a direction is picked; the tour would only confuse that.
  if (index > 1 && !project.state.brand) return null;
  // Wait for the directions to finish appearing before pointing at their cards.
  if (index === 1 && !project.state.directions) return null;

  const stage = STAGES[index];
  const step = TOUR[stage.id];

  return (
    <aside className={styles.tour} aria-label="Demo tour">
      <div className={styles.text}>
        <p className={styles.eyebrow}>
          Demo tour &middot; {index + 1} of {STAGES.length}
        </p>
        <p className={styles.title}>{step.title}</p>
        <ul className={styles.tries}>
          {step.tries.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <button type="button" className="ui-button ui-button--ghost ui-button--small" onClick={() => setTourHidden(true)}>
        Hide tour
      </button>
    </aside>
  );
}
