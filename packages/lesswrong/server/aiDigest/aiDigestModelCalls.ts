import type { LanguageModelUsage, ModelMessage, ProviderMetadata } from "ai";

/**
 * Helpers shared by the AI digest's model calls: Vercel AI Gateway attribution,
 * Anthropic prompt caching, and the diagnostics record kept for each call.
 */

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
 * The prompt as a single user message. For Anthropic models it is marked for
 * caching, so the later steps of a tool-using call reread it from the cache.
 */
export function aiDigestUserMessage(prompt: string, modelId: string): ModelMessage {
  return {
    role: "user",
    content: prompt,
    ...(modelId.startsWith("anthropic/")
      ? { providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } } }
      : {}),
  };
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
  const costs = providerMetadataByStep.flatMap((providerMetadata) => {
    const gateway = providerMetadata?.gateway;
    const cost = parseGatewayCost(gateway?.marketCost) ?? parseGatewayCost(gateway?.cost);
    return cost === null ? [] : [cost];
  });
  return costs.length > 0
    ? costs.reduce((total, cost) => total + cost, 0)
    : null;
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
// literal sequences like "—" in the parsed strings.
export function decodeStrayUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}
