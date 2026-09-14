import type { Metadata } from "next";
import { BrandSystemWorkspace } from "@/components/brand-system/BrandSystemWorkspace";
import { PageTransition } from "@/components/PageTransition";
import { StageGate } from "@/components/studio/StageGate";

export const metadata: Metadata = { title: "Brand system" };

export default function BrandSystemPage() {
  return (
    <StageGate stageId="brand-system" showSelection={false}>
      <PageTransition>
        <BrandSystemWorkspace />
      </PageTransition>
    </StageGate>
  );
}
