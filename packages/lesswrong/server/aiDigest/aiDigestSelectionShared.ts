import type { ModelMessage, ProviderMetadata, TextPart } from "ai";

/**
 * Helpers shared by the AI digest post-selection and thread-selection model
 * calls: Anthropic cache-friendly message assembly and gateway cost accounting.
 */

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

export function sumAiDigestSelectionCostUsd(
  providerMetadataByStep: ReadonlyArray<ProviderMetadata | undefined>,
): number | null {
  const costs = providerMetadataByStep.flatMap((providerMetadata) => {
    const cost = providerMetadata?.gateway?.cost;
    if (typeof cost !== "string") {
      return [];
    }
    const parsedCost = Number(cost);
    return Number.isFinite(parsedCost) && parsedCost >= 0 ? [parsedCost] : [];
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
