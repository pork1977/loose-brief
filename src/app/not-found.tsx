import type { Metadata } from "next";
import { StatusPage } from "@/components/StatusPage";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="main">
      <div style={{ padding: "var(--ui-space-s) var(--ui-gutter)" }}>
        <Wordmark />
      </div>
      <StatusPage
        eyebrow="404"
        title="There's no page here"
        actions={
          <>
            <ButtonLink href="/" variant="primary">
              Go to the home page
            </ButtonLink>
            <ButtonLink href="/brief" variant="ghost">
              Open your project
            </ButtonLink>
          </>
        }
      >
        <p>The address might be mistyped, or the page might have moved.</p>
      </StatusPage>
    </main>
  );
}
