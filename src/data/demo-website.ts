import type { Website } from "@/lib/website";

/*
 * Website copy for the Ebbfield demo, below the hero (the hero comes from each
 * direction's sample copy).
 *
 * Ebbfield is made up, so the partner types, figures, quote and places are
 * too. The site labels them as illustrative. No real organisations are named.
 *
 * Each direction gets the same facts in its own voice: `demoWebsite` takes the
 * handful of lines that change with tone.
 */

type Voiced = {
  problemTitle: string;
  problemBody: string;
  howTitle: string;
  dataTitle: string;
  featuresTitle: string;
  impactTitle: string;
  ctaTitle: string;
  ctaBody: string;
};

export function demoWebsite(v: Voiced): Website {
  return {
    sections: [
      {
        id: "credibility",
        type: "credibility",
        hidden: false,
        label: "Piloted with (illustrative)",
        items: ["Local planning teams", "University coastal labs", "Harbour authorities", "Wildlife trusts"],
      },
      {
        id: "problem",
        type: "problem",
        hidden: false,
        eyebrow: "The problem",
        title: v.problemTitle,
        body: v.problemBody,
        points: [
          "Survey data sits in different formats with different owners.",
          "Most reviews happen once a year, long after the damage.",
          "Residents hear about risk late, and rarely in plain language.",
        ],
      },
      {
        id: "how",
        type: "how",
        hidden: false,
        eyebrow: "How it works",
        title: v.howTitle,
        steps: [
          { title: "Bring the data together", body: "Satellite imagery, drone surveys and tide gauges go into one model of your coastline." },
          { title: "See what's changing", body: "Ebbfield maps where the shore has moved and projects where it's likely to go next." },
          { title: "Plan what to do", body: "Compare adaptation options by cost, timing and who they affect, then share the plan." },
        ],
      },
      {
        id: "data",
        type: "data",
        hidden: false,
        eyebrow: "Explore",
        title: v.dataTitle,
        body: "Drag through the years to watch an illustrative stretch of coast change. Select a site to see how far the shoreline has moved.",
      },
      {
        id: "features",
        type: "features",
        hidden: false,
        eyebrow: "The platform",
        title: v.featuresTitle,
        items: [
          { title: "Shoreline change maps", body: "Year-by-year movement of the coast, from satellite and survey records." },
          { title: "Erosion forecasts", body: "Projected change for every stretch you manage, with the uncertainty shown." },
          { title: "Adaptation planning", body: "Options with costs, timings and trade-offs that councils can defend." },
          { title: "Plain-language reports", body: "Summaries residents and elected members can read in five minutes." },
          { title: "Alerts", body: "A heads-up when a site moves faster than expected." },
          { title: "Open data export", body: "Take your data out in standard formats whenever you want." },
        ],
      },
      {
        id: "impact",
        type: "impact",
        hidden: false,
        eyebrow: "Impact (illustrative)",
        title: v.impactTitle,
        figures: [
          { value: "38 km", label: "of coastline monitored" },
          { value: "12", label: "high-risk sites flagged early" },
          { value: "6 weeks", label: "saved on the annual review" },
        ],
        quote: "For the first time we could show councillors the same picture the engineers were looking at.",
        attribution: "Coastal planning officer, pilot council (illustrative)",
      },
      {
        id: "cta",
        type: "cta",
        hidden: false,
        eyebrow: "Get started",
        title: v.ctaTitle,
        body: v.ctaBody,
        success: "Thanks. This is a preview of a made-up company, so nothing has been sent.",
      },
      {
        id: "footer",
        type: "footer",
        hidden: false,
        tagline: "Coastal intelligence for communities adapting to a changing climate.",
        links: ["Platform", "Research", "About", "Contact"],
        note: "Ebbfield is a fictional company used as the Loose Brief demo.",
      },
    ],
  };
}
