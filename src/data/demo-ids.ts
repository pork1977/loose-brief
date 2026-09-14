/*
 * The ids of the built-in Ebbfield directions, kept apart from the full demo
 * data so components can tell a demo brand from a generated one without
 * loading it. A test checks these match the directions themselves.
 */
export const DEMO_DIRECTION_IDS: readonly string[] = ["littoral-intelligence", "signal-coast", "shared-shore"];

export const isDemoDirection = (id: string) => DEMO_DIRECTION_IDS.includes(id);
