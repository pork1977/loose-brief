import type { BriefDraft } from "@/lib/brief";

/*
 * The Ebbfield demo brief. Ebbfield is a made-up company. This is adapted
 * from the scenario in the original project spec, with the name changed
 * because TIDELINE is a real coastal business.
 */
export const DEMO_BRIEF: BriefDraft = {
  name: "Ebbfield",
  oneLiner: "Climate intelligence for coastal communities",
  description:
    "Ebbfield is an AI-powered coastal conservation startup. It helps coastal communities, researchers and local authorities understand how their shoreline is changing and plan practical climate adaptation.",
  audience: ["Local authorities", "Coastal researchers", "Environmental planners"],
  problem:
    "Coastal communities need clearer evidence about how their shoreline is changing before they can make confident adaptation decisions.",
  personality: ["Scientific", "Hopeful", "Grounded", "Clear"],
  avoid: ["Generic climate gradients", "Corporate stock photography", "Alarmist language"],
  references: ["Nautical charts and survey maps", "Scientific field guides"],
  theme: "light",
  primaryAction: "Request a demonstration",
  pages: ["Home", "Platform", "About", "Contact"],
  materials: [],
};

/** True when a brief is the untouched demo, ignoring surrounding whitespace. */
export function isDemoBrief(brief: BriefDraft): boolean {
  const norm = (b: BriefDraft) =>
    JSON.stringify({ ...b, materials: b.materials.length }, (_, v) => (typeof v === "string" ? v.trim() : v));
  return norm(brief) === norm(DEMO_BRIEF);
}
