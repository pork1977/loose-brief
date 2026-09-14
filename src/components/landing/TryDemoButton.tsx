"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { isDemoBrief } from "@/data/demo-brief";
import { EMPTY_BRIEF } from "@/lib/brief";
import { startDemo } from "@/state/project-actions";
import { getProjectState } from "@/state/project-store";

/*
 * The quickest way in: loads the Ebbfield demo brief and goes straight to its
 * directions. Someone already partway through the demo carries on where they
 * were; someone with their own brief is asked before it's replaced.
 */
export function TryDemoButton({ className, children = "Try the demo" }: { className?: string; children?: React.ReactNode }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const go = async () => {
    const state = getProjectState();
    if (!isDemoBrief(state.brief) || state.briefSubmittedAt === null) await startDemo();
    router.push("/directions", { transitionTypes: ["nav-forward"] });
  };

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          const { brief } = getProjectState();
          const ownBrief = JSON.stringify(brief) !== JSON.stringify(EMPTY_BRIEF) && !isDemoBrief(brief);
          if (ownBrief) setConfirming(true);
          else void go();
        }}
      >
        {children}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Replace your project with the demo?"
        body="You've started a brief of your own. Trying the demo replaces it, along with any files you've added and anything built from it."
        confirmLabel="Try the demo"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          void go();
        }}
      />
    </>
  );
}
