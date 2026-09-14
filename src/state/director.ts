import type { BriefDraft } from "@/lib/brief";
import type { Direction } from "@/lib/direction";
import { COMMANDS, areaFor, commandById, matchRequest, proposalJson, proposalSchema } from "@/lib/refinement";
import type { RefineResponse } from "@/lib/live/protocol";
import { applyBrandChanges, type BrandChange, type DirectorMessage } from "./project";

/*
 * Turns a request into a Creative Director message: match it to a rule, plan
 * the changes against the brand as it is now, dry-run them through the same
 * validation the editor uses, and describe the result.
 */

const SUGGESTIONS = COMMANDS.map((c) => c.label);
export { SUGGESTIONS };

/** The commandId on replies that came from Claude rather than a built-in rule. */
export const CLAUDE = "claude";

/** Turn a reply from the live refine route into a Creative Director message. */
export function claudeMessage(request: string, response: RefineResponse, now = new Date().toISOString()): DirectorMessage {
  const base = { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, at: now, request: request.trim().slice(0, 300), editId: null };
  if (!response.ok) return { ...base, status: "reply", reply: { kind: "unknown", text: response.message.slice(0, 400) } };
  if (!response.possible) return { ...base, status: "reply", reply: { kind: "noop", commandId: CLAUDE, text: response.text.slice(0, 400), focus: null } };
  return {
    ...base,
    status: "pending",
    reply: {
      kind: "proposal",
      commandId: CLAUDE,
      changeType: response.changeType,
      summary: response.summary,
      because: response.because,
      affected: response.affected.slice(0, 20),
      changes: response.changes,
      match: 1,
      focus: response.focus,
      viewport: null,
    },
  };
}

export function askDirector(request: string, ctx: { direction: Direction; brief: BriefDraft }, now = new Date().toISOString()): DirectorMessage {
  const base = { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, at: now, request: request.trim().slice(0, 300), editId: null };

  // Picking a suggestion sends its label, which always matches its own command exactly.
  const exact = COMMANDS.find((c) => c.label.toLowerCase() === request.trim().toLowerCase());
  const match = exact ? { command: exact, score: 6, runnerUp: null } : matchRequest(request);

  if (!match) {
    return {
      ...base,
      status: "reply",
      reply: {
        kind: "unknown",
        text: "I couldn't match that to one of my built-in changes. In this version requests are matched to rules written in advance rather than read by an AI model, so try wording it like one of the suggestions.",
      },
    };
  }

  const plan = match.command.plan(ctx);
  if (plan.kind === "noop") {
    return { ...base, status: "reply", reply: { kind: "noop", commandId: match.command.id, text: plan.text, focus: plan.focus ?? null } };
  }

  const dryRun = applyBrandChanges(ctx.direction, plan.changes);
  if (!dryRun) {
    const changesSomething = plan.changes.some((c) => {
      try {
        return JSON.stringify(c.value) !== JSON.stringify(c.path.split(".").reduce<unknown>((n, k) => (n as Record<string, unknown>)[k], ctx.direction));
      } catch {
        return true;
      }
    });
    return {
      ...base,
      status: "reply",
      reply: {
        kind: "noop",
        commandId: match.command.id,
        text: changesSomething
          ? "Those changes would break one of the brand's rules (a value out of range, say), so I haven't suggested them."
          : "Your brand already looks like that, so there's nothing to change.",
        focus: plan.focus ?? null,
      },
    };
  }

  const affected = [...new Set(dryRun.recorded.map((c) => areaFor(c.path)))];
  const confidence = Math.min(1, match.score / 6);
  const reply = {
    kind: "proposal" as const,
    commandId: match.command.id,
    changeType: plan.changeType,
    summary: plan.summary,
    because: match.runnerUp ? `${plan.because} (I read this as "${match.command.label}" rather than "${match.runnerUp.label}".)` : plan.because,
    affected,
    changes: dryRun.recorded,
    match: confidence,
    focus: plan.focus ?? null,
    viewport: plan.viewport ?? null,
  };

  // The structured form must validate before anything is shown or applied.
  if (!proposalSchema.safeParse(proposalJson(reply)).success) {
    return { ...base, status: "reply", reply: { kind: "noop", commandId: match.command.id, text: "Something in that proposal didn't check out, so I've left the brand alone.", focus: null } };
  }

  return { ...base, status: "pending", reply };
}

/** The changes to apply for a pending proposal, re-planned against the brand as it is at the moment of applying. */
export function changesToApply(message: DirectorMessage, ctx: { direction: Direction; brief: BriefDraft }): BrandChange[] | null {
  if (message.reply.kind !== "proposal") return null;
  // Claude's changes can't be re-planned by a rule, so they're applied as written, and still checked by applyBrandChanges.
  if (message.reply.commandId === CLAUDE) return message.reply.changes.map((c) => ({ path: c.path, value: c.to }));
  const command = commandById(message.reply.commandId);
  if (!command) return null;
  const plan = command.plan(ctx);
  return plan.kind === "proposal" ? plan.changes : null;
}
