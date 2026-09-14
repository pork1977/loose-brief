"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusPage } from "@/components/StatusPage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { startOver } from "@/state/project-actions";

/*
 * Catches anything that breaks while a stage is showing. The studio bar stays
 * in place above it. Trying again is the first option; starting over is there
 * in case something in the saved project is what keeps breaking the page.
 */
export default function StageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <StatusPage
        eyebrow="Something went wrong"
        title="This stage couldn't be shown"
        actions={
          <>
            <button type="button" className="ui-button ui-button--primary" onClick={() => retry()}>
              Try again
            </button>
            <button type="button" className="ui-button ui-button--ghost" onClick={() => setConfirming(true)}>
              Start over
            </button>
          </>
        }
      >
        <p>Your project is still saved in this browser. Trying again often fixes it.</p>
        <p>If it keeps happening, starting over clears the saved project, which removes whatever is causing it.</p>
      </StatusPage>
      <ConfirmDialog
        open={confirming}
        title="Start over?"
        body="This clears the brief, the directions, your brand and any files you've added. It can't be undone."
        confirmLabel="Clear everything"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          setConfirming(false);
          await startOver();
          router.push("/brief");
          // Clears the error here too, in case the broken stage was the brief itself.
          retry();
        }}
      />
    </>
  );
}
