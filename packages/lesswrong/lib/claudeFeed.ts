import { z } from "zod";

export const claudeFeedItemTypes = ["post", "comment", "wiki"] as const;
export const claudeFeedModelIds = [
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-sonnet-5",
  "anthropic/claude-opus-5",
] as const;

export type ClaudeFeedItemType = typeof claudeFeedItemTypes[number];
export type ClaudeFeedModelId = typeof claudeFeedModelIds[number];

interface ClaudeFeedModelConfig {
  label: string;
  shortLabel: string;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
}

interface ClaudeFeedUsageInput {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number | undefined;
}

export const claudeFeedModelConfigs: Record<ClaudeFeedModelId, ClaudeFeedModelConfig> = {
  "anthropic/claude-haiku-4.5": {
    label: "Claude Haiku 4.5 — fastest",
    shortLabel: "Haiku 4.5",
    inputUsdPerMillionTokens: 1,
    outputUsdPerMillionTokens: 5,
  },
  "anthropic/claude-sonnet-5": {
    label: "Claude Sonnet 5 — balanced",
    shortLabel: "Sonnet 5",
    inputUsdPerMillionTokens: 2,
    outputUsdPerMillionTokens: 10,
  },
  "anthropic/claude-opus-5": {
    label: "Claude Opus 5 — strongest",
    shortLabel: "Opus 5",
    inputUsdPerMillionTokens: 5,
    outputUsdPerMillionTokens: 25,
  },
};

export const defaultClaudeFeedModel: ClaudeFeedModelId = "anthropic/claude-sonnet-5";

export const claudeFeedRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1_000),
  profile: z.string().trim().max(800).optional(),
  model: z.enum(claudeFeedModelIds).default(defaultClaudeFeedModel),
});

export const claudeFeedProfileRequestSchema = z.object({
  model: z.enum(claudeFeedModelIds).default(defaultClaudeFeedModel),
});

export const claudeFeedProfileResultSchema = z.object({
  profile: z.string().trim().min(1).max(800),
});

export const claudeFeedRankingSchema = z.object({
  contentTypes: z.array(z.enum(claudeFeedItemTypes)).min(1).max(3).describe(
    "The content types the user wants. Include all three unless the user explicitly includes or excludes types.",
  ),
  items: z.array(z.object({
    candidateId: z.string(),
    reason: z.string().trim().min(1).max(240),
  })).max(18),
});

export const claudeFeedItemSchema = z.object({
  id: z.string(),
  type: z.enum(claudeFeedItemTypes),
  rank: z.number().int().positive(),
  title: z.string(),
  url: z.string(),
  reason: z.string(),
  byline: z.string().optional(),
  context: z.string().optional(),
  snippet: z.string().optional(),
  karma: z.number().optional(),
  publishedAt: z.string().optional(),
});

export const claudeFeedUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const claudeFeedResponseSchema = z.object({
  items: z.array(claudeFeedItemSchema),
  model: z.enum(claudeFeedModelIds),
  usage: claudeFeedUsageSchema,
  costUsd: z.number().nonnegative(),
  costIsEstimated: z.boolean(),
});

export const claudeFeedProfileResponseSchema = z.object({
  profile: z.string().trim().min(1).max(800),
  model: z.enum(claudeFeedModelIds),
  usage: claudeFeedUsageSchema,
  costUsd: z.number().nonnegative(),
  costIsEstimated: z.boolean(),
});

const claudeFeedStoredRunBaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  model: z.enum(claudeFeedModelIds),
  usage: claudeFeedUsageSchema,
  costUsd: z.number().nonnegative(),
  costIsEstimated: z.boolean(),
});

export const claudeFeedStoredRunSchema = z.discriminatedUnion("kind", [
  claudeFeedStoredRunBaseSchema.extend({
    kind: z.literal("feed"),
    prompt: z.string(),
    profile: z.string().optional(),
    items: z.array(claudeFeedItemSchema),
  }),
  claudeFeedStoredRunBaseSchema.extend({
    kind: z.literal("profile"),
    profile: z.string(),
  }),
]);

export const claudeFeedStoredHistorySchema = z.object({
  version: z.literal(1),
  runs: z.array(claudeFeedStoredRunSchema).max(50),
});

export type ClaudeFeedItem = z.infer<typeof claudeFeedItemSchema>;
export type ClaudeFeedUsage = z.infer<typeof claudeFeedUsageSchema>;
export type ClaudeFeedStoredRun = z.infer<typeof claudeFeedStoredRunSchema>;

export function getGatewayCostUsd(providerMetadata: unknown): number | undefined {
  if (typeof providerMetadata !== "object" || providerMetadata === null || !("gateway" in providerMetadata)) {
    return undefined;
  }
  const gatewayMetadata = providerMetadata.gateway;
  if (typeof gatewayMetadata !== "object" || gatewayMetadata === null || !("cost" in gatewayMetadata)) {
    return undefined;
  }
  const rawCost = gatewayMetadata.cost;
  const cost = typeof rawCost === "string" ? Number(rawCost) : rawCost;
  return typeof cost === "number" && Number.isFinite(cost) && cost > 0 ? cost : undefined;
}

export function getClaudeFeedRunAccounting(
  model: ClaudeFeedModelId,
  usage: ClaudeFeedUsageInput,
  gatewayCostUsd?: number,
) {
  const normalizedUsage: ClaudeFeedUsage = {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    totalTokens: usage.totalTokens ?? ((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)),
  };
  const pricing = claudeFeedModelConfigs[model];
  const estimatedCostUsd = (
    (normalizedUsage.inputTokens * pricing.inputUsdPerMillionTokens) +
    (normalizedUsage.outputTokens * pricing.outputUsdPerMillionTokens)
  ) / 1_000_000;

  return {
    usage: normalizedUsage,
    costUsd: gatewayCostUsd ?? estimatedCostUsd,
    costIsEstimated: gatewayCostUsd === undefined,
  };
}
