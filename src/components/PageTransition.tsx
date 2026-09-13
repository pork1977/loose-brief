import { ViewTransition, type ReactNode } from "react";

/*
 * Wraps a page's content so route changes animate. Links say which way they
 * go with transitionTypes: "nav-forward" and "nav-back" slide, "page-fade"
 * crossfades. Untyped navigations (the browser back button, a refresh) don't
 * animate at all, which is the safe default.
 *
 * This has to sit in each page, not a layout, because layouts persist across
 * navigations and never enter or exit.
 */

const types = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  "page-fade": "page-fade",
  default: "none",
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={types} exit={types} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
