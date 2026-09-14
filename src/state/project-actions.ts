"use client";

import { DEMO_BRIEF } from "@/data/demo-brief";
import { clearMaterialFiles } from "@/lib/material-files";
import { forgetAllThumbnails } from "@/lib/material-thumbnails";
import { dispatch } from "./project-store";

/*
 * The two ways to throw a project away, shared by every screen that offers
 * them so they always clear the same things: the saved project, and the images
 * added to the brief (kept separately in IndexedDB).
 */

async function clearFiles() {
  forgetAllThumbnails();
  await clearMaterialFiles();
}

/** Replace the project with the Ebbfield demo brief, ready for directions. */
export async function startDemo() {
  await clearFiles();
  dispatch({ type: "brief/loadDemo", brief: DEMO_BRIEF });
  dispatch({ type: "brief/submit" });
}

/** Clear everything and go back to an empty brief. */
export async function startOver() {
  await clearFiles();
  dispatch({ type: "project/reset" });
}
