"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, resolvedTheme, type Theme } from "@/lib/theme";

/*
 * The theme lives on <html data-theme>, set before paint by the root layout.
 * This subscribes to that attribute and to the OS setting, so the button's
 * label is always right without a flash or a hydration mismatch.
 */

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribe, resolvedTheme, () => null);
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      className="ui-button ui-button--ghost ui-button--icon"
      onClick={() => applyTheme(next)}
      aria-label={theme ? `Switch to ${next} theme` : "Switch theme"}
      title={theme ? `Switch to ${next} theme` : undefined}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
