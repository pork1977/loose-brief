import type { Metadata } from "next";
import { PageTransition } from "@/components/PageTransition";
import { StageGate } from "@/components/studio/StageGate";
import { StudioWorkspace } from "@/components/studio/StudioWorkspace";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <StageGate stageId="studio" showSelection={false}>
      <PageTransition>
        <StudioWorkspace />
      </PageTransition>
    </StageGate>
  );
}
