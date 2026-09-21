import type { ModelMessage, ProviderMetadata, TextPart } from "ai";

/**
 * Helpers shared by the AI digest model calls: Vercel AI Gateway attribution,
 * Anthropic cache-friendly message assembly, and gateway cost accounting.
 */

export type AiDigestGatewayPurpose = "post-selection" | "thread-selection" | "post-summary" | "post-preview";

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

function selectionPromptTextPart(text: string, cacheAfter: boolean): TextPart {
  return cacheAfter
    ? {
      type: "text",
      text,
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
    }
    : { type: "text", text };
}

export function buildAiDigestSelectionMessages({
  sharedPrefix,
  personalizedSuffix,
  enableAnthropicCaching,
}: {
  sharedPrefix: string;
  personalizedSuffix: string;
  enableAnthropicCaching: boolean;
}): ModelMessage[] {
  return [{
    role: "user",
    content: [
      selectionPromptTextPart(sharedPrefix, enableAnthropicCaching),
      selectionPromptTextPart(`\n\n${personalizedSuffix}`, false),
    ],
  }];
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
export function sumAiDigestSelectionCostUsd(
  providerMetadataByStep: ReadonlyArray<ProviderMetadata | undefined>,
): number | null {
  const costs = providerMetadataByStep.flatMap((providerMetadata) => {
    const gateway = providerMetadata?.gateway;
    const cost = parseGatewayCost(gateway?.marketCost) ?? parseGatewayCost(gateway?.cost);
    return cost === null ? [] : [cost];
  });
  return costs.length > 0
    ? costs.reduce((total, cost) => total + cost, 0)
    : null;
}

// Models occasionally double-escape unicode in structured output, leaving
// literal sequences like "\u2014" in the parsed strings.
export function decodeStrayUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}
