import type { Metadata } from "next";
import { StagePlaceholder } from "@/components/studio/StagePlaceholder";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <StagePlaceholder
      stageId="studio"
      phase={6}
      parts={[
        { title: "Homepage", body: "Ten sections built from the brand tokens, including an illustrative coastline graphic." },
        { title: "Viewports", body: "Desktop, tablet and mobile previews." },
        { title: "Creative Director", body: "Ask for changes, see what will change, then apply or cancel. Arrives in Phase 7." },
        { title: "Before and after", body: "Compare the site before and after a change." },
      ]}
    />
  );
}
