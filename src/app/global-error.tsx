"use client";

import { useEffect } from "react";

/*
 * The last resort, for when the root layout itself fails. It replaces the
 * whole document, so none of the app's styles or fonts are available here.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", colorScheme: "light dark", lineHeight: 1.5 }}>
        <title>Something went wrong | Loose Brief</title>
        <main style={{ maxWidth: "34rem", margin: "15vh auto", padding: "0 1.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>Loose Brief</p>
          <h1 style={{ margin: "0.5rem 0 1rem", fontSize: "2rem", lineHeight: 1.15 }}>Something went wrong</h1>
          <p style={{ margin: "0 0 1.5rem" }}>Loose Brief couldn&rsquo;t load. Your project is still saved in this browser, so trying again is safe.</p>
          <button type="button" onClick={() => retry()} style={{ font: "inherit", padding: "0.6rem 1.1rem", borderRadius: "6px", cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
