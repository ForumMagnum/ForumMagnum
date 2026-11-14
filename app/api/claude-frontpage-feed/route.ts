import { generateText, tool } from "ai";
import LRU from "lru-cache";
import { NextRequest, NextResponse } from "next/server";
import {
  ClaudeFeedItemType,
  ClaudeFeedModelId,
  ClaudeFeedResolvedSettings,
  claudeFeedItemTypes,
  claudeFeedRankingSchema,
  claudeFeedRequestSchema,
  getClaudeFeedRankingSystemPrompt,
  getClaudeFeedRunAccounting,
  getGatewayCostUsd,
} from "@/lib/claudeFeed";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { tagGetUrl } from "@/lib/collections/tags/helpers";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { RateLimiter } from "@/lib/rateLimiter";
import {
  getElasticIndexNameWithSorting,
  getSearchIndexName,
} from "@/lib/search/searchUtil";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import ElasticService from "@/server/search/elastic/ElasticService";
import type { SearchResultHit } from "@/server/search/elastic/SearchResult";

export const maxDuration = 60;

const BACKFILL_CACHE_SIZE = 64;
const BACKFILL_CACHE_MAX_AGE_MS = 60 * 1_000;
const REQUESTER_CACHE_SIZE = 10_000;
const REQUESTER_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

interface ClaudeFeedCandidate {
  candidateId: string;
  id: string;
  type: ClaudeFeedItemType;
  title: string;
  url: string;
  byline?: string;
  context?: string;
  snippet?: string;
  karma?: number;
  publishedAt?: string;
  readingStatus?: "unread" | "unknown";
}

interface AccessibleCandidateInfo {
  accessibleCandidateIds: Set<string>;
  authoredCandidateIds: Set<string>;
}

interface CandidateSearchSpec {
  type: ClaudeFeedItemType;
  indexName: string;
  query: string;
  hitsPerPage: number;
}

const requesterLimiters = new LRU<string, RateLimiter>({
  max: REQUESTER_CACHE_SIZE,
  maxAge: REQUESTER_CACHE_MAX_AGE_MS,
});

// The "newest" and "top karma" backfill searches do not depend on the reader's
// prompt or identity, so a warm instance can reuse them. Raw hits are safe to
// share because access filtering happens per request, further down.
const backfillSearchCache = new LRU<string, SearchResultHit[]>({
  max: BACKFILL_CACHE_SIZE,
  maxAge: BACKFILL_CACHE_MAX_AGE_MS,
});

const getSearchService = (() => {
  let searchService: ElasticService | null = null;
  return () => {
    if (!searchService) {
      searchService = new ElasticService();
    }
    return searchService;
  };
})();


const promptTypePatternSources: Record<ClaudeFeedItemType, string> = {
  post: "posts?",
  comment: "comments?",
  wiki: "wiki(?:\\s+(?:articles?|pages?))?|wikitags?",
};

function getAllowedContentTypes(
  prompt: string,
  modelContentTypes: ClaudeFeedItemType[],
): Set<ClaudeFeedItemType> {
  const normalizedPrompt = prompt.toLowerCase();
  const onlyTypes = claudeFeedItemTypes.filter((type) => {
    const typePattern = promptTypePatternSources[type];
    const onlyBeforeType = new RegExp(`\\b(?:only|just)\\b(?:\\s+\\w+){0,3}\\s+\\b(?:${typePattern})\\b`);
    const onlyAfterType = new RegExp(`\\b(?:${typePattern})\\b(?:\\s+\\w+){0,2}\\s+\\b(?:only|exclusively)\\b`);
    return onlyBeforeType.test(normalizedPrompt) || onlyAfterType.test(normalizedPrompt);
  });
  if (onlyTypes.length > 0) {
    return new Set(onlyTypes);
  }

  const excludedTypes = new Set(claudeFeedItemTypes.filter((type) => {
    const typePattern = promptTypePatternSources[type];
    const exclusion = new RegExp(`\\b(?:no|without|exclude|excluding)\\b(?:\\s+\\w+){0,3}\\s+\\b(?:${typePattern})\\b`);
    return exclusion.test(normalizedPrompt);
  }));
  if (excludedTypes.size > 0) {
    return new Set(claudeFeedItemTypes.filter((type) => !excludedTypes.has(type)));
  }

  return new Set(modelContentTypes);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown): boolean {
  return value === true;
}

function getIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function summarizeHtml(html: string | undefined, maxLength: number): string | undefined {
  if (!html) {
    return undefined;
  }
  const text = htmlToTextDefault(html).replaceAll(/\s+/g, " ").trim();
  if (!text) {
    return undefined;
  }
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength).trimEnd()}…`;
}

function getPostCandidate(hit: SearchResultHit, snippetChars: number): ClaudeFeedCandidate {
  const slug = getString(hit.slug) ?? "";
  const author = getString(hit.authorDisplayName) ?? getString(hit.feedName);
  return {
    candidateId: `post:${hit._id}`,
    id: hit._id,
    type: "post",
    title: getString(hit.title) ?? "Untitled post",
    url: postGetPageUrl({
      _id: hit._id,
      slug,
      isEvent: getBoolean(hit.isEvent),
      groupId: getString(hit.groupId),
    }),
    byline: author ? `by ${author}` : undefined,
    snippet: summarizeHtml(getString(hit.body), snippetChars),
    karma: getNumber(hit.baseScore),
    publishedAt: getIsoDate(hit.postedAt),
  };
}

function getCommentCandidate(hit: SearchResultHit, snippetChars: number): ClaudeFeedCandidate | null {
  const postId = getString(hit.postId);
  if (!postId) {
    return null;
  }
  const postTitle = getString(hit.postTitle) ?? "a LessWrong post";
  const author = getString(hit.authorDisplayName);
  return {
    candidateId: `comment:${hit._id}`,
    id: hit._id,
    type: "comment",
    title: `Comment on ${postTitle}`,
    url: commentGetPageUrlFromIds({
      postId,
      postSlug: getString(hit.postSlug),
      commentId: hit._id,
    }),
    byline: author ? `by ${author}` : undefined,
    context: postTitle,
    snippet: summarizeHtml(getString(hit.body), snippetChars),
    karma: getNumber(hit.baseScore),
    publishedAt: getIsoDate(hit.postedAt),
  };
}

function getWikiCandidate(hit: SearchResultHit, snippetChars: number): ClaudeFeedCandidate {
  const slug = getString(hit.slug) ?? "";
  return {
    candidateId: `wiki:${hit._id}`,
    id: hit._id,
    type: "wiki",
    title: getString(hit.name) ?? "Untitled wiki article",
    url: tagGetUrl({ slug }),
    context: "LessWrong wiki",
    snippet: summarizeHtml(getString(hit.description), snippetChars),
    karma: getNumber(hit.baseScore),
  };
}

function getCandidate(
  type: ClaudeFeedItemType,
  hit: SearchResultHit,
  snippetChars: number,
): ClaudeFeedCandidate | null {
  if (type === "post") {
    return getPostCandidate(hit, snippetChars);
  }
  if (type === "comment") {
    return getCommentCandidate(hit, snippetChars);
  }
  return getWikiCandidate(hit, snippetChars);
}

// Relevance searches dominate the catalog and the prompt-independent "newest"
// and "top karma" searches backfill the rest, keeping the mix these sizes had
// when they were hard-coded against a 42-candidate-per-type cap.
function getSearchSpecs(prompt: string, settings: ClaudeFeedResolvedSettings): CandidateSearchSpec[] {
  const relevanceHits = Math.ceil((settings.candidatesPerType * 2) / 3);
  const recentHits = Math.ceil(settings.candidatesPerType / 5);
  const karmaHits = Math.ceil(settings.candidatesPerType / 3);

  const specs: CandidateSearchSpec[] = [
    {
      type: "post",
      indexName: getElasticIndexNameWithSorting("Posts", "relevance"),
      query: prompt,
      hitsPerPage: relevanceHits,
    },
    {
      type: "comment",
      indexName: getElasticIndexNameWithSorting("Comments", "relevance"),
      query: prompt,
      hitsPerPage: relevanceHits,
    },
    {
      type: "wiki",
      indexName: getSearchIndexName("Tags"),
      query: prompt,
      hitsPerPage: relevanceHits,
    },
  ];

  if (settings.includeRecentBackfill) {
    specs.push({
      type: "post",
      indexName: getElasticIndexNameWithSorting("Posts", "newest_first"),
      query: "",
      hitsPerPage: recentHits,
    }, {
      type: "comment",
      indexName: getElasticIndexNameWithSorting("Comments", "newest_first"),
      query: "",
      hitsPerPage: recentHits,
    });
  }

  if (settings.includeTopKarmaBackfill) {
    specs.push({
      type: "post",
      indexName: getElasticIndexNameWithSorting("Posts", "karma"),
      query: "",
      hitsPerPage: karmaHits,
    }, {
      type: "comment",
      indexName: getElasticIndexNameWithSorting("Comments", "karma"),
      query: "",
      hitsPerPage: karmaHits,
    }, {
      type: "wiki",
      indexName: getSearchIndexName("Tags"),
      query: "",
      hitsPerPage: karmaHits,
    });
  }

  return specs;
}

async function runSearchSpec(spec: CandidateSearchSpec): Promise<SearchResultHit[]> {
  const cacheKey = `${spec.indexName}:${spec.hitsPerPage}`;
  if (spec.query === "") {
    const cachedHits = backfillSearchCache.get(cacheKey);
    if (cachedHits) {
      return cachedHits;
    }
  }
  const result = await getSearchService().runQuery({
    indexName: spec.indexName,
    params: {
      query: spec.query,
      hitsPerPage: spec.hitsPerPage,
    },
  }, {
    emptyStringSearchResults: "default",
  });
  if (spec.query === "") {
    backfillSearchCache.set(cacheKey, result.hits);
  }
  return result.hits;
}

async function getCandidates(
  prompt: string,
  settings: ClaudeFeedResolvedSettings,
): Promise<ClaudeFeedCandidate[]> {
  const specs = getSearchSpecs(prompt, settings);
  const results = await Promise.all(specs.map(runSearchSpec));

  const candidatesById = new Map<string, ClaudeFeedCandidate>();
  const countsByType: Record<ClaudeFeedItemType, number> = {
    post: 0,
    comment: 0,
    wiki: 0,
  };

  for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
    const type = specs[resultIndex].type;
    for (const hit of results[resultIndex]) {
      if (countsByType[type] >= settings.candidatesPerType) {
        break;
      }
      const candidate = getCandidate(type, hit, settings.snippetChars);
      if (candidate && !candidatesById.has(candidate.candidateId)) {
        candidatesById.set(candidate.candidateId, candidate);
        countsByType[type]++;
      }
    }
  }

  return Array.from(candidatesById.values());
}

function consumeRequestQuota(requesterId: string, isLoggedIn: boolean): boolean {
  const key = `${isLoggedIn ? "user" : "guest"}:${requesterId}`;
  const now = new Date();
  let limiter = requesterLimiters.get(key);
  if (!limiter) {
    limiter = new RateLimiter({
      burstLimit: isLoggedIn ? 10 : 3,
      steadyStateLimit: isLoggedIn ? 1 / 60 : 1 / 300,
      timestamp: now,
    });
    requesterLimiters.set(key, limiter);
  }
  limiter.advanceTime(now);
  if (limiter.resource < 1) {
    return false;
  }
  limiter.consumeResource(1);
  return true;
}

async function getAccessibleCandidateInfo(
  candidates: ClaudeFeedCandidate[],
  context: ResolverContext,
): Promise<AccessibleCandidateInfo> {
  const postIds = candidates.filter(({ type }) => type === "post").map(({ id }) => id);
  const commentIds = candidates.filter(({ type }) => type === "comment").map(({ id }) => id);
  const tagIds = candidates.filter(({ type }) => type === "wiki").map(({ id }) => id);

  const [posts, comments, tags] = await Promise.all([
    postIds.length > 0 ? context.Posts.find({ _id: { $in: postIds } }).fetch() : Promise.resolve([]),
    commentIds.length > 0 ? context.Comments.find({ _id: { $in: commentIds } }).fetch() : Promise.resolve([]),
    tagIds.length > 0 ? context.Tags.find({ _id: { $in: tagIds } }).fetch() : Promise.resolve([]),
  ]);

  const [filteredPosts, filteredComments, filteredTags] = await Promise.all([
    accessFilterMultiple(context.currentUser, "Posts", posts, context),
    accessFilterMultiple(context.currentUser, "Comments", comments, context),
    accessFilterMultiple(context.currentUser, "Tags", tags, context),
  ]);

  const accessibleCandidateIds = new Set([
    ...filteredPosts.flatMap((post) => post._id ? [`post:${post._id}`] : []),
    ...filteredComments.flatMap((comment) => comment._id ? [`comment:${comment._id}`] : []),
    ...filteredTags.flatMap((tag) => tag._id ? [`wiki:${tag._id}`] : []),
  ]);
  const currentUserId = context.currentUser?._id;
  const authoredCandidateIds = new Set(currentUserId ? [
    ...filteredPosts.flatMap((post) => post._id && post.userId === currentUserId ? [`post:${post._id}`] : []),
    ...filteredComments.flatMap((comment) => comment._id && comment.userId === currentUserId ? [`comment:${comment._id}`] : []),
  ] : []);

  return { accessibleCandidateIds, authoredCandidateIds };
}

interface ReadCandidateIds {
  viewedPostIds: Set<string>;
  readCommentIds: Set<string>;
}

async function getReadCandidateIds(
  candidates: ClaudeFeedCandidate[],
  context: ResolverContext,
): Promise<ReadCandidateIds> {
  const currentUserId = context.currentUser?._id;
  if (!currentUserId) {
    return { viewedPostIds: new Set(), readCommentIds: new Set() };
  }

  const postIds = candidates.filter(({ type }) => type === "post").map(({ id }) => id);
  const commentIds = candidates.filter(({ type }) => type === "comment").map(({ id }) => id);
  const [viewedPostIds, readCommentIds] = await Promise.all([
    context.repos.ultraFeedEvents.getViewedPostIds(currentUserId, postIds),
    context.repos.ultraFeedEvents.getReadCommentIds(currentUserId, commentIds),
  ]);
  return { viewedPostIds, readCommentIds };
}

function removeReadCandidates(
  candidates: ClaudeFeedCandidate[],
  authoredCandidateIds: Set<string>,
  readCandidateIds: ReadCandidateIds,
  isLoggedIn: boolean,
): ClaudeFeedCandidate[] {
  if (!isLoggedIn) {
    return candidates.map((candidate) => ({ ...candidate, readingStatus: "unknown" }));
  }

  return candidates.flatMap((candidate) => {
    const wasRead = (
      authoredCandidateIds.has(candidate.candidateId) ||
      (candidate.type === "post" && readCandidateIds.viewedPostIds.has(candidate.id)) ||
      (candidate.type === "comment" && readCandidateIds.readCommentIds.has(candidate.id))
    );
    return wasRead ? [] : [{ ...candidate, readingStatus: candidate.type === "wiki" ? "unknown" : "unread" }];
  });
}

async function rankCandidates(
  prompt: string,
  profile: string | undefined,
  candidates: ClaudeFeedCandidate[],
  model: ClaudeFeedModelId,
  settings: ClaudeFeedResolvedSettings,
) {
  const result = await generateText({
    model,
    system: getClaudeFeedRankingSystemPrompt({
      rankingInstructions: settings.rankingInstructions,
      maxResults: settings.maxResults,
      reasonWords: settings.reasonWords,
    }),
    prompt: JSON.stringify({
      userRequest: prompt,
      readerProfile: profile ?? null,
      candidateCatalog: candidates,
    }),
    maxOutputTokens: Math.min(2_500, (settings.maxResults * 100) + 400),
    tools: {
      rankFrontpageItems: tool({
        description: "Return the user's ranked LessWrong reading queue.",
        inputSchema: claudeFeedRankingSchema,
      }),
    },
    toolChoice: {
      type: "tool",
      toolName: "rankFrontpageItems",
    },
  });

  const toolCall = result.toolCalls.find(({ toolName }) => toolName === "rankFrontpageItems");
  if (!toolCall) {
    throw new Error("Claude did not return a ranked feed");
  }
  return {
    ranking: claudeFeedRankingSchema.parse(toolCall.input),
    accounting: getClaudeFeedRunAccounting(model, result.totalUsage, getGatewayCostUsd(result.providerMetadata)),
  };
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const [body, context] = await Promise.all([
      req.json(),
      getContextFromReqAndRes({ req, isSSR: false }),
    ]);
    const parsedBody = claudeFeedRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Enter a request between 3 and 1,000 characters." }, { status: 400 });
    }

    const requesterId = context.currentUser?._id ?? context.clientId;
    if (!requesterId) {
      return NextResponse.json({ error: "Log in or enable cookies to build a feed." }, { status: 401 });
    }

    if (!context.currentUser) {
      const clientIdRecord = await context.ClientIds.findOne({ clientId: requesterId });
      const minimumClientAgeMs = 10 * 1_000;
      if (!clientIdRecord || Date.now() - clientIdRecord.createdAt.getTime() < minimumClientAgeMs) {
        return NextResponse.json({ error: "Wait a moment before building your first feed." }, { status: 429 });
      }
    }

    if (!consumeRequestQuota(requesterId, !!context.currentUser)) {
      return NextResponse.json({ error: "You’ve made several feeds in a short time. Try again in a few minutes." }, { status: 429 });
    }

    const { prompt, profile, model, ...settings } = parsedBody.data;

    const searchStartedAt = Date.now();
    const searchCandidates = await getCandidates(prompt, settings);
    const searchMs = Date.now() - searchStartedAt;

    // Access filtering and read-status lookups read different tables, so they
    // run together rather than one after the other.
    const filterStartedAt = Date.now();
    const [{ accessibleCandidateIds, authoredCandidateIds }, readCandidateIds] = await Promise.all([
      getAccessibleCandidateInfo(searchCandidates, context),
      getReadCandidateIds(searchCandidates, context),
    ]);
    const accessibleCandidates = searchCandidates.filter((candidate) => accessibleCandidateIds.has(candidate.candidateId));
    const candidates = removeReadCandidates(
      accessibleCandidates,
      authoredCandidateIds,
      readCandidateIds,
      !!context.currentUser,
    );
    const filterMs = Date.now() - filterStartedAt;

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No unread LessWrong items matched this request." }, { status: 404 });
    }

    const rankStartedAt = Date.now();
    const { ranking, accounting } = await rankCandidates(prompt, profile, candidates, model, settings);
    const rankMs = Date.now() - rankStartedAt;
    const allowedContentTypes = getAllowedContentTypes(prompt, ranking.contentTypes);
    const candidateById = new Map(candidates.map((candidate) => [candidate.candidateId, candidate]));
    const seenCandidateIds = new Set<string>();
    const rankedCandidates = ranking.items.flatMap(({ candidateId, reason }) => {
      const candidate = candidateById.get(candidateId);
      if (!candidate || !allowedContentTypes.has(candidate.type) || seenCandidateIds.has(candidateId)) {
        return [];
      }
      seenCandidateIds.add(candidateId);
      return [{ candidate, reason }];
    });
    const items = rankedCandidates
      .slice(0, settings.maxResults)
      .map(({ candidate, reason }, index) => ({
        id: candidate.id,
        type: candidate.type,
        rank: index + 1,
        reason,
      }));

    const timings = {
      searchMs,
      filterMs,
      rankMs,
      totalMs: Date.now() - startedAt,
    };

    serverCaptureEvent("claudeFrontpageFeedGenerated", {
      searchCandidateCount: searchCandidates.length,
      accessibleCandidateCount: accessibleCandidates.length,
      candidateCount: candidates.length,
      resultCount: items.length,
      model,
      inputTokens: accounting.usage.inputTokens,
      outputTokens: accounting.usage.outputTokens,
      costUsd: accounting.costUsd,
      costIsEstimated: accounting.costIsEstimated,
      candidatesPerType: settings.candidatesPerType,
      snippetChars: settings.snippetChars,
      maxResults: settings.maxResults,
      usesCustomRankingInstructions: !!settings.rankingInstructions?.trim(),
      ...timings,
      durationMs: timings.totalMs,
    });

    return NextResponse.json({
      items,
      model,
      candidateCount: candidates.length,
      timings,
      ...accounting,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to build Claude frontpage feed", error);
    return NextResponse.json({ error: "Claude couldn’t build this feed. Try a shorter request." }, { status: 500 });
  }
}
