import type { Metadata } from "next";
import { DirectionsWorkspace } from "@/components/directions/DirectionsWorkspace";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = { title: "Directions" };

export default function DirectionsPage() {
  return (
    <PageTransition>
      <DirectionsWorkspace />
    </PageTransition>
  );
}
