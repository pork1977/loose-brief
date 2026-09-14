/*
 * Website copy for the Ebbfield demo beyond the hero (the hero comes from each
 * direction's sample copy). Ebbfield is made up, and so are these figures,
 * which is why the preview labels them as illustrative.
 */

export const DEMO_WEBSITE = {
  features: [
    {
      title: "Shoreline change maps",
      body: "See where the coast has moved, year by year, from satellite and survey records.",
    },
    {
      title: "Erosion and flood forecasts",
      body: "Projected change for every stretch of coast you manage, with the uncertainty shown.",
    },
    {
      title: "Plans people can follow",
      body: "Turn the evidence into adaptation options with costs, timings and trade-offs.",
    },
  ],
  impact: {
    label: "In one pilot council",
    figures: [
      { value: "38 km", label: "of coastline monitored" },
      { value: "12", label: "high-risk sites flagged early" },
      { value: "6 weeks", label: "saved on the annual review" },
    ],
  },
  cta: {
    title: "See your coastline in Ebbfield",
    body: "A 30-minute demonstration with your own stretch of coast, for councils and research teams.",
  },
  footer: ["Platform", "Research", "About", "Contact"],
} as const;
