export const THEME_STORAGE_KEY = "loose-brief:theme";

export type Theme = "light" | "dark";

/** The theme currently on screen, whether chosen or inherited from the OS. */
export function resolvedTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private windows, strict settings). The choice
    // still applies for this visit.
  }
}
