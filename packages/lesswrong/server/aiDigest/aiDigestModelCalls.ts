import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import type { LanguageModelUsage, ModelMessage, ProviderMetadata } from "ai";
import sum from "lodash/sum";

/**
 * Helpers shared by the AI digest's model calls: Vercel AI Gateway attribution,
 * Anthropic prompt caching, and the diagnostics record kept for each call.
 */

/** The model behind every digest call, and its name as shown to readers above the AI note. */
export const AI_DIGEST_MODEL_ID = "anthropic/claude-opus-5.5";
export const AI_DIGEST_MODEL_NAME = "Claude Opus 5.5";

type AiDigestGatewayPurpose = "post-selection" | "thread-selection" | "post-summary" | "post-preview";

/**
 * Tags every digest request so its usage and spend can be filtered in the
 * AI Gateway dashboard and spend reports, both for the feature as a whole and
 * per call type.
 */
export function aiDigestGatewayProviderOptions(purpose: AiDigestGatewayPurpose) {
  return {
    gateway: {
      tags: ["ai-digest", `ai-digest-${purpose}`],
    },
  };
}

/**
 * The prompt as a single user message, marked for Anthropic's prompt cache so
 * the later steps of a tool-using call reread it from the cache.
 */
export function aiDigestUserMessage(prompt: string): ModelMessage {
  return {
    role: "user",
    content: prompt,
    providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } },
  };
}

/**
 * `JSON.stringify` calls `toJSON` before the replacer sees a value, so dates
 * are recognized by looking the original value up on the containing object.
 */
function promptJsonValue(this: Record<string, unknown>, key: string, value: unknown): unknown {
  const originalValue = this[key];
  if (originalValue instanceof Date) {
    return originalValue.toISOString().slice(0, 10);
  }
  return value === null || value === false ? undefined : value;
}

/**
 * Data as it appears in the digest prompts: JSON with dates as UTC calendar
 * dates, and null and false values left out, since absent facts cost tokens
 * without telling the model anything.
 */
export function aiDigestPromptJson(value: unknown): string {
  return JSON.stringify(value, promptJsonValue);
}

/** Data from the site, which the prompts tell the model never to take instructions from. */
export function aiDigestUntrustedJson(label: string, value: unknown): string {
  return [`<UNTRUSTED_${label}>`, aiDigestPromptJson(value), `</UNTRUSTED_${label}>`].join("\n");
}

export function aiDigestPromptSection({ heading, note, label, value }: {
  heading: string;
  note?: string;
  label: string;
  value: unknown;
}): string {
  const lines = [`# ${heading}`];
  if (note) {
    lines.push(note);
  }
  lines.push(aiDigestUntrustedJson(label, value));
  return lines.join("\n");
}

export function assertAiDigestModelFinished(
  result: { finishReason: string; totalUsage: LanguageModelUsage },
  callName: string,
) {
  if (result.finishReason !== "stop") {
    throw new Error(
      `AI digest ${callName} stopped with finish reason ${result.finishReason} after `
      + `${result.totalUsage.outputTokens ?? 0} output tokens`,
    );
  }
}

function parseGatewayCost(cost: unknown): number | null {
  if (typeof cost !== "string") {
    return null;
  }
  const parsedCost = Number(cost);
  return Number.isFinite(parsedCost) && parsedCost >= 0 ? parsedCost : null;
}

/**
 * The gateway's `cost` is what the gateway bills, which is zero when the
 * request ran on our own provider key (BYOK); `marketCost` is the provider's
 * list price for the same tokens, so it is preferred when present.
 */
function sumGatewayCostUsd(providerMetadataByStep: Array<ProviderMetadata | undefined>): number | null {
  const costs = filterNonnull(providerMetadataByStep.map((providerMetadata) => {
    const gateway = providerMetadata?.gateway;
    return parseGatewayCost(gateway?.marketCost) ?? parseGatewayCost(gateway?.cost);
  }));
  return costs.length > 0 ? sum(costs) : null;
}

export function aiDigestModelCallRecord({ purpose, modelId, promptVersion, system, prompt, result }: {
  purpose: AiDigestModelCallRecord["purpose"];
  modelId: string;
  promptVersion: string;
  system: string;
  prompt: string;
  result: {
    totalUsage: LanguageModelUsage;
    steps: Array<{
      providerMetadata: ProviderMetadata | undefined;
      toolCalls: Array<{ toolName: string; input: unknown }>;
    }>;
  };
}): AiDigestModelCallRecord {
  return {
    purpose,
    modelId,
    promptVersion,
    systemPrompt: system,
    prompt,
    inputTokenCount: result.totalUsage.inputTokens ?? null,
    outputTokenCount: result.totalUsage.outputTokens ?? null,
    uncachedInputTokenCount: result.totalUsage.inputTokenDetails.noCacheTokens ?? null,
    cacheReadInputTokenCount: result.totalUsage.inputTokenDetails.cacheReadTokens ?? null,
    cacheWriteInputTokenCount: result.totalUsage.inputTokenDetails.cacheWriteTokens ?? null,
    costUsd: sumGatewayCostUsd(result.steps.map((step) => step.providerMetadata)),
    toolCalls: result.steps.flatMap((step) => step.toolCalls.map((toolCall) => ({
      toolName: toolCall.toolName,
      input: JSON.stringify(toolCall.input),
    }))),
  };
}

// Models occasionally double-escape unicode in structured output, leaving
// literal sequences like "\u2014" in the parsed strings.
export function decodeStrayUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}
