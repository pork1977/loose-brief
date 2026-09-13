import type { Metadata } from "next";
import { StagePlaceholder } from "@/components/studio/StagePlaceholder";

export const metadata: Metadata = { title: "The Brief" };

export default function BriefPage() {
  return (
    <StagePlaceholder
      stageId="brief"
      phase={3}
      parts={[
        { title: "Five steps", body: "Context, audience, personality, visual direction and website goals, one at a time." },
        { title: "Live summary", body: "A panel showing how the brief is being read as you fill it in." },
        { title: "Demo brief", body: "Load the Ebbfield brief in one click." },
        { title: "Saved draft", body: "Your answers survive a refresh." },
      ]}
    />
  );
}
