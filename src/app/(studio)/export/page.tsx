import type { Metadata } from "next";
import { StageGate } from "@/components/studio/StageGate";
import { StagePlaceholder } from "@/components/studio/StagePlaceholder";

export const metadata: Metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <StageGate stageId="export">
    <StagePlaceholder
      stageId="export"
      phase={8}
      parts={[
        { title: "Tokens", body: "CSS variables, JSON tokens and a Tailwind theme." },
        { title: "DESIGN.md", body: "A plain written guide to the system for developers and AI coding tools." },
        { title: "Brand guidelines", body: "An HTML document that prints cleanly to PDF." },
        { title: "Copy deck and social cards", body: "The site copy in one place, plus cards sized for social posts." },
      ]}
    />
    </StageGate>
  );
}
