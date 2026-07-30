import { tool } from "ai";
import type { ToolSet } from "ai";
import { z } from "zod";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import {
  getEmbeddingsFromApi,
  isEmbeddingsAPIEnabled,
} from "@/server/embeddings";
import type { AiDigestPostHistory } from "./aiDigestHistory";
import {
  AI_DIGEST_DEFAULT_MIN_KARMA,
  aiDigestEligibilityInputFromByIdRow,
  getAiDigestPostIneligibilityReason,
  isSelectableAiDigestCandidate,
  relaxPreviousInclusionExclusions,
  toAiDigestToolSearchCandidate,
  type AiDigestPostCandidate,
} from "./aiDigestPostCandidates";
import {
  AI_DIGEST_SELECTION_READ_POST_MAX_CHARS,
  boundedPlainTextFromRevisionHtml,
} from "./aiDigestPostSummaries";

export const AI_DIGEST_SELECTION_SEARCH_RECENT_DAYS = 90;
export const AI_DIGEST_SELECTION_SEARCH_DEFAULT_LIMIT = 10;
export const AI_DIGEST_SELECTION_SEARCH_MAX_LIMIT = 20;
export const AI_DIGEST_SELECTION_READ_POST_MAX_PER_GENERATION = 10;
export const AI_DIGEST_SELECTION_STEP_LIMIT = 8;
const AI_DIGEST_SELECTION_SEARCH_OVERFETCH_MULTIPLIER = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AiDigestSearchResultGroup = "allTime" | "recent";

export interface AiDigestSearchResultRow {
  postId: string;
  title: string;
  author: string;
  publishedDaysAgo: number;
  baseScore: number;
  tags: string[];
  group: AiDigestSearchResultGroup;
  inCorpus: boolean;
  alreadyRead?: true;
  liked?: "regular" | "strong";
  previousDigest?: true;
  followsAuthor?: true;
}

export interface AiDigestDiscoveredCandidateRegistry {
  byPostId: Map<string, AiDigestPostCandidate>;
}

export interface AiDigestSelectionToolUsageCounts {
  toolCallCount: number;
  searchCount: number;
  readPostCount: number;
  discoveredCandidateCount: number;
}

export interface AiDigestSelectionToolsContext {
  user: DbUser;
  context: ResolverContext;
  corpusPostIds: Set<string>;
  postHistoryById: Map<string, AiDigestPostHistory>;
  now: Date;
  minKarma?: number;
  /** Set when the corpus pool was too thin and repeats were unlocked there too. */
  allowPreviousInclusions: boolean;
}

function clampSearchLimit(limit: number | undefined): number {
  const requested = limit ?? AI_DIGEST_SELECTION_SEARCH_DEFAULT_LIMIT;
  return Math.max(1, Math.min(AI_DIGEST_SELECTION_SEARCH_MAX_LIMIT, requested));
}

function utcDay(timestamp: string | Date): number {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function daysAgo(asOf: Date, timestamp: string | Date): number {
  return Math.max(0, Math.floor((utcDay(asOf) - utcDay(timestamp)) / DAY_MS));
}

function wrapUntrustedToolPayload(label: string, payload: unknown): string {
  return [
    `<UNTRUSTED_${label}>`,
    JSON.stringify(payload),
    `</UNTRUSTED_${label}>`,
  ].join("\n");
}

export function createAiDigestDiscoveredCandidateRegistry(): AiDigestDiscoveredCandidateRegistry {
  return {
    byPostId: new Map(),
  };
}

export function registerDiscoveredCandidates(
  registry: AiDigestDiscoveredCandidateRegistry,
  candidates: AiDigestPostCandidate[],
  corpusPostIds: Set<string>,
): AiDigestPostCandidate[] {
  return candidates.flatMap((candidate) => {
    if (corpusPostIds.has(candidate.postId) || registry.byPostId.has(candidate.postId)) {
      return [];
    }
    if (!isSelectableAiDigestCandidate(candidate)) {
      return [];
    }
    registry.byPostId.set(candidate.postId, candidate);
    return [candidate];
  });
}

function searchResultAnnotations(
  candidate: AiDigestPostCandidate,
  includeRead: boolean,
): Pick<
  AiDigestSearchResultRow,
  "alreadyRead" | "liked" | "previousDigest" | "followsAuthor"
> {
  return {
    ...(includeRead && candidate.isRead ? { alreadyRead: true as const } : {}),
    ...(candidate.upvoteStrength ? { liked: candidate.upvoteStrength } : {}),
    ...(candidate.previousDigestInclusionCount > 0 ? { previousDigest: true as const } : {}),
    ...(candidate.isSubscribedToAuthor ? { followsAuthor: true as const } : {}),
  };
}

function toSearchResultRow(
  candidate: AiDigestPostCandidate,
  group: AiDigestSearchResultGroup,
  corpusPostIds: Set<string>,
  includeRead: boolean,
  now: Date,
): AiDigestSearchResultRow {
  return {
    postId: candidate.postId,
    title: candidate.title,
    author: candidate.author,
    publishedDaysAgo: daysAgo(now, candidate.publicationDate),
    baseScore: candidate.baseScore,
    tags: candidate.tags,
    group,
    inCorpus: corpusPostIds.has(candidate.postId),
    ...searchResultAnnotations(candidate, includeRead),
  };
}

async function loadEligibleSearchCandidates({
  postIds,
  toolsContext,
  includeRead,
}: {
  postIds: string[];
  toolsContext: AiDigestSelectionToolsContext;
  includeRead: boolean;
}): Promise<AiDigestPostCandidate[]> {
  if (postIds.length === 0) {
    return [];
  }
  const minKarma = toolsContext.minKarma ?? AI_DIGEST_DEFAULT_MIN_KARMA;
  const aboutPostId = aboutPostIdSetting.get();
  const hiddenPostIds = new Set(
    toolsContext.user.hiddenPostsMetadata.map((metadata) => metadata.postId),
  );
  const rows = await toolsContext.context.repos.posts.getAiDigestPostCandidateRowsByIds({
    postIds,
  });
  const rowsByPostId = new Map(rows.map((row) => [row.postId, row]));
  const orderedRows = postIds.flatMap((postId) => {
    const row = rowsByPostId.get(postId);
    return row ? [row] : [];
  });
  const annotations = await toolsContext.context.repos.posts.getAiDigestCandidateAnnotationRows({
    userId: toolsContext.user._id,
    postIds: orderedRows.map((row) => row.postId),
  });
  const annotationsByPostId = new Map(
    annotations.map((annotation) => [annotation.postId, annotation]),
  );
  const eligibilityOptions = {
    recipientId: toolsContext.user._id,
    aboutPostId,
    minPostedAt: new Date(0),
    minKarma,
    now: toolsContext.now,
  };
  const candidates = orderedRows.flatMap((row) => {
    const annotation = annotationsByPostId.get(row.postId);
    const hiddenByRecipient = hiddenPostIds.has(row.postId);
    const ineligibilityReason = getAiDigestPostIneligibilityReason(
      aiDigestEligibilityInputFromByIdRow(row, annotation, hiddenByRecipient),
      eligibilityOptions,
    );
    if (ineligibilityReason || !row.revisionId || !row.publicationDate) {
      return [];
    }
    return [toAiDigestToolSearchCandidate(
      row,
      annotation,
      hiddenByRecipient,
      minKarma,
      toolsContext.postHistoryById.get(row.postId),
    )];
  });
  return (toolsContext.allowPreviousInclusions
    ? relaxPreviousInclusionExclusions(candidates)
    : candidates
  ).filter((candidate) =>
    isSelectableAiDigestCandidate(candidate)
    && (includeRead || !candidate.isRead));
}

async function nearestNeighborGroups({
  resolvePostIds,
  limit,
  toolsContext,
}: {
  resolvePostIds: (options: {
    publishedAfter: Date | null;
    limit: number;
  }) => Promise<string[]>;
  limit: number;
  toolsContext: AiDigestSelectionToolsContext;
}): Promise<{
  allTimePostIds: string[];
  recentPostIds: string[];
}> {
  const overfetchLimit = limit * AI_DIGEST_SELECTION_SEARCH_OVERFETCH_MULTIPLIER;
  const recentAfter = new Date(
    toolsContext.now.getTime() - (AI_DIGEST_SELECTION_SEARCH_RECENT_DAYS * DAY_MS),
  );
  const [allTimePostIds, recentPostIds] = await Promise.all([
    resolvePostIds({ publishedAfter: null, limit: overfetchLimit }),
    resolvePostIds({ publishedAfter: recentAfter, limit: overfetchLimit }),
  ]);
  return { allTimePostIds, recentPostIds };
}

async function buildGroupedSearchResults({
  allTimePostIds,
  recentPostIds,
  includeRead,
  limit,
  toolsContext,
  registry,
}: {
  allTimePostIds: string[];
  recentPostIds: string[];
  includeRead: boolean;
  limit: number;
  toolsContext: AiDigestSelectionToolsContext;
  registry: AiDigestDiscoveredCandidateRegistry;
}): Promise<{
  allTime: AiDigestSearchResultRow[];
  recent: AiDigestSearchResultRow[];
}> {
  const orderedUniquePostIds = Array.from(new Set([...allTimePostIds, ...recentPostIds]));
  const eligibleCandidates = await loadEligibleSearchCandidates({
    postIds: orderedUniquePostIds,
    toolsContext,
    includeRead,
  });
  const eligibleByPostId = new Map(
    eligibleCandidates.map((candidate) => [candidate.postId, candidate]),
  );
  registerDiscoveredCandidates(
    registry,
    eligibleCandidates,
    toolsContext.corpusPostIds,
  );

  const takeGroup = (
    postIds: string[],
    group: AiDigestSearchResultGroup,
  ): AiDigestSearchResultRow[] => {
    return postIds.flatMap((postId) => {
      const candidate = eligibleByPostId.get(postId);
      return candidate
        ? [toSearchResultRow(
          candidate,
          group,
          toolsContext.corpusPostIds,
          includeRead,
          toolsContext.now,
        )]
        : [];
    }).slice(0, limit);
  };

  return {
    allTime: takeGroup(allTimePostIds, "allTime"),
    recent: takeGroup(recentPostIds, "recent"),
  };
}

export function createAiDigestSelectionTools({
  toolsContext,
  registry,
}: {
  toolsContext: AiDigestSelectionToolsContext;
  registry: AiDigestDiscoveredCandidateRegistry;
}) {
  const counts: AiDigestSelectionToolUsageCounts = {
    toolCallCount: 0,
    searchCount: 0,
    readPostCount: 0,
    discoveredCandidateCount: 0,
  };
  const readablePostIds = () => new Set([
    ...toolsContext.corpusPostIds,
    ...registry.byPostId.keys(),
  ]);
  const minKarma = toolsContext.minKarma ?? AI_DIGEST_DEFAULT_MIN_KARMA;
  const embeddingsEnabled = isEmbeddingsAPIEnabled();

  const searchTools: ToolSet = embeddingsEnabled
    ? {
      searchPosts: tool({
        description:
          "Semantically search LessWrong posts by a natural-language description of "
          + "desired content. Returns titles/metadata in all-time and recent groups. "
          + "Does not support exact author or title lookup.",
        inputSchema: z.object({
          query: z.string().min(1).max(500),
          includeRead: z.boolean().optional(),
          limit: z.number().int().min(1).max(AI_DIGEST_SELECTION_SEARCH_MAX_LIMIT).optional(),
        }),
        execute: async ({ query, includeRead = false, limit: requestedLimit }) => {
          counts.toolCallCount += 1;
          counts.searchCount += 1;
          const limit = clampSearchLimit(requestedLimit);
          const { embeddings } = await getEmbeddingsFromApi(query);
          const groups = await nearestNeighborGroups({
            toolsContext,
            limit,
            resolvePostIds: ({ publishedAfter, limit: fetchLimit }) =>
              toolsContext.context.repos.postEmbeddings.getAiDigestNearestPostIdsWeightedByQuality(
                embeddings,
                {
                  minKarma,
                  publishedAfter,
                  publishedBefore: null,
                  limit: fetchLimit,
                },
              ),
          });
          const results = await buildGroupedSearchResults({
            ...groups,
            includeRead,
            limit,
            toolsContext,
            registry,
          });
          counts.discoveredCandidateCount = registry.byPostId.size;
          return wrapUntrustedToolPayload("SEARCH_RESULTS", results);
        },
      }),
    }
    : {};

  const tools = {
    ...searchTools,
    readPost: tool({
      description:
        "Read bounded plain-text body content for a post ID from the supplied corpus "
        + "or from prior search results. Use before selecting an archive post that "
        + "was discovered by search.",
      inputSchema: z.object({
        postId: z.string().min(1),
      }),
      execute: async ({ postId }) => {
        if (counts.readPostCount >= AI_DIGEST_SELECTION_READ_POST_MAX_PER_GENERATION) {
          counts.toolCallCount += 1;
          return wrapUntrustedToolPayload("POST_BODY", {
            error: `readPost budget exhausted after ${AI_DIGEST_SELECTION_READ_POST_MAX_PER_GENERATION} reads`,
          });
        }
        counts.toolCallCount += 1;
        counts.readPostCount += 1;
        if (!readablePostIds().has(postId)) {
          return wrapUntrustedToolPayload("POST_BODY", {
            error: "postId is not in the corpus or discovered search results",
          });
        }
        const rows = await toolsContext.context.repos.posts.getAiDigestPostBodyRowsByIds({
          postIds: [postId],
        });
        const row = rows[0];
        if (!row) {
          return wrapUntrustedToolPayload("POST_BODY", {
            error: "post body unavailable",
          });
        }
        return wrapUntrustedToolPayload("POST_BODY", {
          postId: row.postId,
          title: row.title,
          author: row.author,
          body: boundedPlainTextFromRevisionHtml(
            row.revisionHtml,
            AI_DIGEST_SELECTION_READ_POST_MAX_CHARS,
          ),
        });
      },
    }),
  };

  return {
    tools,
    getUsageCounts: (): AiDigestSelectionToolUsageCounts => ({
      ...counts,
      discoveredCandidateCount: registry.byPostId.size,
    }),
  };
}
