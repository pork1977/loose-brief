import type { Metadata } from "next";
import { StagePlaceholder } from "@/components/studio/StagePlaceholder";

export const metadata: Metadata = { title: "Directions" };

export default function DirectionsPage() {
  return (
    <StagePlaceholder
      stageId="directions"
      phase={4}
      parts={[
        { title: "Three directions", body: "Littoral Intelligence, Signal Coast and Shared Shore for the Ebbfield demo." },
        { title: "Compare mode", body: "Put two directions side by side." },
        { title: "Contrast checks", body: "Every palette is tested, with a passing alternative offered if it fails." },
        { title: "Identity canvas", body: "Personality, colour, type, imagery and motion drawn as one connected system." },
      ]}
    />
  );
}
