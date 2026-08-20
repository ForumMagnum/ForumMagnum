import { z } from "zod";

export const claudeFeedItemTypes = ["post", "comment", "wiki"] as const;

export type ClaudeFeedItemType = typeof claudeFeedItemTypes[number];

export const claudeFeedRequestSchema = z.object({
  prompt: z.string().trim().min(3).max(1_000),
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

export const claudeFeedResponseSchema = z.object({
  items: z.array(claudeFeedItemSchema),
});

export type ClaudeFeedItem = z.infer<typeof claudeFeedItemSchema>;
