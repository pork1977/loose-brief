"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/StatusPage";

export default function MarketingError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title="This page couldn't be shown"
      actions={
        <>
          <button type="button" className="ui-button ui-button--primary" onClick={() => retry()}>
            Try again
          </button>
          <Link href="/" className="ui-button ui-button--ghost">
            Go to the home page
          </Link>
        </>
      }
    >
      <p>Trying again often fixes it. If it doesn&rsquo;t, the home page should still work.</p>
    </StatusPage>
  );
}
