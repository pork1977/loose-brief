import type { Metadata } from "next";
import { ExportWorkspace } from "@/components/export/ExportWorkspace";
import { PageTransition } from "@/components/PageTransition";
import { StageGate } from "@/components/studio/StageGate";

export const metadata: Metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <StageGate stageId="export" showSelection={false}>
      <PageTransition>
        <ExportWorkspace />
      </PageTransition>
    </StageGate>
  );
}
