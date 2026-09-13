import type { Metadata } from "next";
import { StagePlaceholder } from "@/components/studio/StagePlaceholder";

export const metadata: Metadata = { title: "Brand system" };

export default function BrandSystemPage() {
  return (
    <StagePlaceholder
      stageId="brand-system"
      phase={5}
      parts={[
        { title: "Seven tabs", body: "Overview, colours, type, voice, imagery, components and tokens." },
        { title: "Editors", body: "Colour pickers, font choice, corner radius, contrast and dark mode." },
        { title: "Token inspector", body: "Shows which parts of the website each token affects." },
        { title: "Reset", body: "Put everything back to the direction you picked." },
      ]}
    />
  );
}
