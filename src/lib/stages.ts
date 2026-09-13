/*
 * The five stages of a project, in order. The landing page's "How it works"
 * and the studio's step bar both read this, so they can't drift apart.
 */

export type Stage = {
  id: "brief" | "directions" | "brand-system" | "studio" | "export";
  number: string;
  label: string;
  href: `/${string}`;
  summary: string;
};

export const STAGES: readonly Stage[] = [
  {
    id: "brief",
    number: "01",
    label: "Brief",
    href: "/brief",
    summary: "Answer five short sets of questions about the business, who it's for and how it should feel.",
  },
  {
    id: "directions",
    number: "02",
    label: "Directions",
    href: "/directions",
    summary: "Get three different routes, each with its own colours, type, tone and a small website preview.",
  },
  {
    id: "brand-system",
    number: "03",
    label: "Brand system",
    href: "/brand-system",
    summary: "Pick one. It becomes a set of design tokens you can look through and edit by hand.",
  },
  {
    id: "studio",
    number: "04",
    label: "Studio",
    href: "/studio",
    summary: "See a full homepage built from those tokens, then ask the Creative Director for changes.",
  },
  {
    id: "export",
    number: "05",
    label: "Export",
    href: "/export",
    summary: "Take it away as CSS variables, JSON tokens or a Tailwind theme, with a DESIGN.md and brand guidelines.",
  },
];

export function stageIndex(pathname: string): number {
  return STAGES.findIndex((s) => pathname === s.href || pathname.startsWith(`${s.href}/`));
}
