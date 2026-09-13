import type { Metadata } from "next";
import { BriefWorkspace } from "@/components/brief/BriefWorkspace";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "The Brief" };

export default function BriefPage() {
  return (
    <PageTransition>
      <BriefWorkspace />
    </PageTransition>
  );
}
