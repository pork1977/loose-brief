import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DEMO_DIRECTIONS } from "@/data/demo-directions";
import { toDraft } from "./draft";
import { LiveError, type Block, type ModelCall } from "./generate";

/*
 * The only file that talks to the Anthropic API.
 *
 * The key comes from ANTHROPIC_API_KEY and should be a key used for nothing
 * else, with a monthly spend limit set in the Anthropic console: that limit is
 * the one hard ceiling on cost. The model defaults to Claude Opus 5 and can be
 * changed with LIVE_MODEL without touching code.
 */

/**
 * LIVE_FAKE=1 swaps Claude for a stand-in that replays the demo directions
 * after realistic pauses, for working on the live screens without spending
 * anything. It's ignored in production builds.
 */
const FAKE = process.env.LIVE_FAKE === "1" && process.env.NODE_ENV !== "production";

export const LIVE_MODEL = FAKE ? "fake (development only)" : process.env.LIVE_MODEL || "claude-opus-5";

export const isLiveConfigured = () => FAKE || Boolean(process.env.ANTHROPIC_API_KEY);

export type Usage = { calls: number; input: number; output: number; cacheWrite: number; cacheRead: number };
export const emptyUsage = (): Usage => ({ calls: 0, input: 0, output: 0, cacheWrite: 0, cacheRead: 0 });

function toContent(blocks: Block[]): Anthropic.ContentBlockParam[] {
  return blocks.map((b) =>
    b.type === "image"
      ? { type: "image", source: { type: "base64", media_type: b.mediaType as "image/png", data: b.data } }
      : { type: "text", text: b.text, ...(b.cache ? { cache_control: { type: "ephemeral" as const } } : {}) },
  );
}

/** A ModelCall backed by the real API. Adds each call's token counts to `usage` and logs them. */
export function anthropicCall({ usage, signal, tag }: { usage: Usage; signal?: AbortSignal; tag: string }): ModelCall {
  if (FAKE) return fakeCall(signal);
  const client = new Anthropic({ maxRetries: 2 });
  return async ({ step, system, blocks, schema, maxTokens }) => {
    const started = Date.now();
    const response = await client.messages.parse(
      {
        model: LIVE_MODEL,
        max_tokens: maxTokens,
        // Writing a direction gets more thought; planning and single edits don't need it, and it keeps them quick.
        output_config: { effort: step === "brand" || step === "copy" ? "medium" : "low", format: zodOutputFormat(schema) },
        // The system prompt is identical on every request, so it's cached and later calls pay a fraction for it.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: toContent(blocks) }],
      },
      { signal },
    );

    const u = response.usage;
    usage.calls += 1;
    usage.input += u.input_tokens;
    usage.output += u.output_tokens;
    usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
    usage.cacheRead += u.cache_read_input_tokens ?? 0;
    console.log(
      `[live/${tag}:${step}] ${LIVE_MODEL} ${Date.now() - started}ms in=${u.input_tokens} out=${u.output_tokens} cache_write=${u.cache_creation_input_tokens ?? 0} cache_read=${u.cache_read_input_tokens ?? 0} stop=${response.stop_reason}`,
    );

    if (response.stop_reason === "refusal") throw new LiveError("Claude declined to work on this brief.");
    if (response.stop_reason === "max_tokens") throw new LiveError("Claude ran out of room before finishing. Try again.");
    if (!response.parsed_output) throw new LiveError("Claude's reply came back in a shape Loose Brief couldn't read. Try again.");
    return response.parsed_output;
  };
}

function fakeCall(signal?: AbortSignal): ModelCall {
  const wait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Anthropic.APIUserAbortError());
      });
    });
  return async ({ step, blocks }) => {
    const text = blocks.map((b) => (b.type === "text" ? b.text : "")).join("\n");
    if (step === "plan") {
      await wait(2500);
      return { routes: DEMO_DIRECTIONS.map((d) => ({ name: d.name, idea: d.description, visual: d.visual, colour: "", type: "", voice: "", differs: "" })) } as never;
    }
    if (step === "brand" || step === "copy") {
      const index = "ABC".indexOf(/direction ([ABC])/.exec(text)?.[1] ?? "A");
      await wait(2000 + index * 1500);
      return toDraft(DEMO_DIRECTIONS[index]) as never;
    }
    await wait(2000);
    if (/impossible/i.test(text)) return { possible: false, summary: "I can't do that by changing this brand, but I can change its colours, type or copy.", because: "", changeType: "copy", focus: "", changes: [] } as never;
    return {
      possible: true,
      summary: "Pill-shaped buttons and a warmer main button colour.",
      because: "Rounder buttons and a warmer colour make the call to action feel friendlier.",
      changeType: "token_update",
      focus: "cta",
      changes: [
        { path: "tokens.radius.button", value: '"pill"' },
        { path: "tokens.color.button.primary", value: '"#B5462F"' },
      ],
    } as never;
  };
}

/** Turn anything thrown during a live call into a message fit to show the visitor. Details go to the server log. */
export function friendlyError(error: unknown, tag: string): { message: string; status: number } {
  if (error instanceof LiveError) return { message: error.message, status: 502 };
  if (error instanceof Anthropic.APIUserAbortError) return { message: "Stopped.", status: 499 };
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    console.error(`[live/${tag}] the Anthropic key was rejected`);
    return { message: "Live generation isn't set up correctly at the moment. The demo still works.", status: 503 };
  }
  if (error instanceof Anthropic.RateLimitError) return { message: "Claude is busy right now. Give it a minute and try again.", status: 429 };
  if (error instanceof Anthropic.APIError) {
    console.error(`[live/${tag}] Anthropic error ${error.status}: ${error.message}`);
    // A spend limit being reached shows up as a 4xx billing error.
    if (error.status === 400 && /credit|billing|spend/i.test(error.message)) {
      return { message: "Live generation has used up its budget for now. The demo still works.", status: 503 };
    }
    if (error.status === 529 || (error.status ?? 0) >= 500) return { message: "Claude is overloaded right now. Try again in a minute.", status: 503 };
    return { message: "Claude couldn't handle that request. Try again, or change the brief a little.", status: 502 };
  }
  if (error instanceof Anthropic.AnthropicError) {
    console.error(`[live/${tag}] ${error.message}`);
    return { message: "Claude's reply came back in a shape Loose Brief couldn't read. Try again.", status: 502 };
  }
  console.error(`[live/${tag}] failed:`, error);
  return { message: "Something went wrong. Try again in a moment.", status: 500 };
}
