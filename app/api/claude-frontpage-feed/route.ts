import { generateText, stepCountIs, tool, type ToolChoice } from "ai";
import LRU from "lru-cache";
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import { NextRequest, NextResponse } from "next/server";
import {
  ClaudeFeedItemType,
  ClaudeFeedModelId,
  ClaudeFeedResolvedSettings,
  ClaudeFeedSearchInput,
  ClaudeFeedSearchRecord,
  claudeFeedRankingSchema,
  claudeFeedRequestSchema,
  claudeFeedSearchInputSchema,
  getClaudeFeedRunAccounting,
  getClaudeFeedSystemPrompt,
  getGatewayCostUsd,
} from "@/lib/claudeFeed";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { RateLimiter } from "@/lib/rateLimiter";
import {
  getElasticIndexNameWithSorting,
  getSearchIndexName,
} from "@/lib/search/searchUtil";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import ElasticService from "@/server/search/elastic/ElasticService";
import type { SearchResultHit } from "@/server/search/elastic/SearchResult";

export const maxDuration = 60;

const REQUESTER_CACHE_SIZE = 10_000;
const REQUESTER_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1_000;

type ClaudeFeedToolName = "searchLessWrong" | "rankFrontpageItems";

interface ClaudeFeedModelCandidate {
  candidateId: string;
  title: string;
  byline?: string;
  context?: string;
  snippet?: string;
  karma?: number;
  publishedAt?: string;
}

interface ClaudeFeedCandidate extends ClaudeFeedModelCandidate {
  id: string;
  type: ClaudeFeedItemType;
}

interface AccessibleCandidateInfo {
  accessibleCandidateIds: Set<string>;
  authoredCandidateIds: Set<string>;
}

interface ReadCandidateIds {
  viewedPostIds: Set<string>;
  readCommentIds: Set<string>;
}

interface ResolvedSearchFilter {
  id: string;
  label: string;
}

interface SearchInterval {
  startedAt: number;
  endedAt: number;
}

interface ClaudeFeedSearchLog {
  searches: ClaudeFeedSearchRecord[];
  candidatesById: Map<string, ClaudeFeedCandidate>;
  intervals: SearchInterval[];
}

interface ClaudeFeedSearchOutcome {
  resolvedAuthor?: string;
  resolvedTag?: string;
  hiddenAsReadCount: number;
  error?: string;
  results: ClaudeFeedCandidate[];
}

interface ClaudeFeedSearchToolOutput extends Omit<ClaudeFeedSearchOutcome, "results"> {
  results: ClaudeFeedModelCandidate[];
}

const requesterLimiters = new LRU<string, RateLimiter>({
  max: REQUESTER_CACHE_SIZE,
  maxAge: REQUESTER_CACHE_MAX_AGE_MS,
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

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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
  const author = getString(hit.authorDisplayName) ?? getString(hit.feedName);
  return {
    candidateId: `post:${hit._id}`,
    id: hit._id,
    type: "post",
    title: getString(hit.title) ?? "Untitled post",
    byline: author ? `by ${author}` : undefined,
    snippet: summarizeHtml(getString(hit.body), snippetChars),
    karma: getNumber(hit.baseScore),
    publishedAt: getIsoDate(hit.postedAt),
  };
}

function getCommentCandidate(hit: SearchResultHit, snippetChars: number): ClaudeFeedCandidate | null {
  if (!getString(hit.postId)) {
    return null;
  }
  const postTitle = getString(hit.postTitle) ?? "a LessWrong post";
  const author = getString(hit.authorDisplayName);
  return {
    candidateId: `comment:${hit._id}`,
    id: hit._id,
    type: "comment",
    title: `Comment on ${postTitle}`,
    byline: author ? `by ${author}` : undefined,
    context: postTitle,
    snippet: summarizeHtml(getString(hit.body), snippetChars),
    karma: getNumber(hit.baseScore),
    publishedAt: getIsoDate(hit.postedAt),
  };
}

function getWikiCandidate(hit: SearchResultHit, snippetChars: number): ClaudeFeedCandidate {
  return {
    candidateId: `wiki:${hit._id}`,
    id: hit._id,
    type: "wiki",
    title: getString(hit.name) ?? "Untitled wiki article",
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
  { viewedPostIds, readCommentIds }: ReadCandidateIds,
): ClaudeFeedCandidate[] {
  return candidates.filter((candidate) => !(
    authoredCandidateIds.has(candidate.candidateId) ||
    (candidate.type === "post" && viewedPostIds.has(candidate.id)) ||
    (candidate.type === "comment" && readCommentIds.has(candidate.id))
  ));
}

async function runElasticSearch(indexName: string, query: string, hitsPerPage: number): Promise<SearchResultHit[]> {
  const result = await getSearchService().runQuery({
    indexName,
    params: {
      query,
      hitsPerPage,
    },
  }, {
    emptyStringSearchResults: "default",
  });
  return result.hits;
}

async function resolveAuthor(name: string): Promise<ResolvedSearchFilter | null> {
  const [hit] = await runElasticSearch(getSearchIndexName("Users"), name, 1);
  if (!hit) {
    return null;
  }
  const displayName = getString(hit.displayName) ?? name;
  const slug = getString(hit.slug);
  return {
    id: hit._id,
    label: slug ? `${displayName} (@${slug})` : displayName,
  };
}

async function resolveTag(name: string): Promise<ResolvedSearchFilter | null> {
  const [hit] = await runElasticSearch(getSearchIndexName("Tags"), name, 1);
  return hit ? { id: hit._id, label: getString(hit.name) ?? name } : null;
}

function getSearchIndexNameForInput({ type, sort }: ClaudeFeedSearchInput): string {
  if (type === "post") {
    return getElasticIndexNameWithSorting("Posts", sort);
  }
  if (type === "comment") {
    return getElasticIndexNameWithSorting("Comments", sort);
  }
  return getSearchIndexName("Tags");
}

function getSearchInputError({ type, author, tag }: ClaudeFeedSearchInput): string | undefined {
  if (type === "wiki" && (author || tag)) {
    return "Wiki searches cannot filter by author or tag. Search again without them.";
  }
  if (type === "comment" && tag) {
    return "Tag filters only work for post searches. Search comments by query or author instead.";
  }
  return undefined;
}

async function searchForCandidates(
  input: ClaudeFeedSearchInput,
  settings: ClaudeFeedResolvedSettings,
  context: ResolverContext,
): Promise<ClaudeFeedSearchOutcome> {
  const inputError = getSearchInputError(input);
  if (inputError) {
    return { hiddenAsReadCount: 0, error: inputError, results: [] };
  }

  const [author, tag] = await Promise.all([
    input.author ? resolveAuthor(input.author) : null,
    input.tag ? resolveTag(input.tag) : null,
  ]);
  if (input.author && !author) {
    return { hiddenAsReadCount: 0, error: `No LessWrong user matches "${input.author}".`, results: [] };
  }
  if (input.tag && !tag) {
    return { hiddenAsReadCount: 0, error: `No LessWrong wiki tag matches "${input.tag}".`, results: [] };
  }

  const query = [
    input.query,
    author ? `user:${author.id}` : "",
    tag ? `tag:${tag.id}` : "",
  ].filter((part) => part.length > 0).join(" ");
  const hits = await runElasticSearch(getSearchIndexNameForInput(input), query, settings.resultsPerSearch);
  const searchedCandidates = filterNonnull(hits.map((hit) => getCandidate(input.type, hit, settings.snippetChars)));

  const [{ accessibleCandidateIds, authoredCandidateIds }, readCandidateIds] = await Promise.all([
    getAccessibleCandidateInfo(searchedCandidates, context),
    getReadCandidateIds(searchedCandidates, context),
  ]);
  const accessibleCandidates = searchedCandidates.filter(({ candidateId }) => accessibleCandidateIds.has(candidateId));
  const unreadCandidates = removeReadCandidates(accessibleCandidates, authoredCandidateIds, readCandidateIds);

  return {
    resolvedAuthor: author?.label,
    resolvedTag: tag?.label,
    hiddenAsReadCount: accessibleCandidates.length - unreadCandidates.length,
    results: unreadCandidates,
  };
}

async function runLoggedSearch(
  input: ClaudeFeedSearchInput,
  settings: ClaudeFeedResolvedSettings,
  context: ResolverContext,
  searchLog: ClaudeFeedSearchLog,
): Promise<ClaudeFeedSearchToolOutput> {
  const startedAt = Date.now();
  const output = await searchForCandidates(input, settings, context);
  searchLog.intervals.push({ startedAt, endedAt: Date.now() });
  searchLog.searches.push({
    ...input,
    resolvedAuthor: output.resolvedAuthor,
    resolvedTag: output.resolvedTag,
    resultCount: output.results.length,
    hiddenAsReadCount: output.hiddenAsReadCount,
    error: output.error,
  });
  for (const candidate of output.results) {
    searchLog.candidatesById.set(candidate.candidateId, candidate);
  }
  return {
    ...output,
    results: output.results.map(toModelCandidate),
  };
}

function toModelCandidate({
  candidateId,
  title,
  byline,
  context,
  snippet,
  karma,
  publishedAt,
}: ClaudeFeedCandidate): ClaudeFeedModelCandidate {
  return { candidateId, title, byline, context, snippet, karma, publishedAt };
}

function getCoveredDurationMs(intervals: SearchInterval[]): number {
  return sortBy(intervals, ({ startedAt }) => startedAt).reduce(
    ({ coveredMs, coveredUntil }, { startedAt, endedAt }) => ({
      coveredMs: coveredMs + Math.max(0, endedAt - Math.max(startedAt, coveredUntil)),
      coveredUntil: Math.max(coveredUntil, endedAt),
    }),
    { coveredMs: 0, coveredUntil: 0 },
  ).coveredMs;
}

function getFeedToolChoice(stepNumber: number, finalStepNumber: number): ToolChoice<Record<ClaudeFeedToolName, unknown>> {
  if (stepNumber === 0) {
    return { type: "tool", toolName: "searchLessWrong" };
  }
  if (stepNumber >= finalStepNumber) {
    return { type: "tool", toolName: "rankFrontpageItems" };
  }
  return "required";
}

function sumGatewayCostUsd(providerMetadatas: unknown[]): number | undefined {
  const costs = providerMetadatas.map((providerMetadata) => getGatewayCostUsd(providerMetadata));
  if (!costs.every((cost): cost is number => cost !== undefined)) {
    return undefined;
  }
  return costs.reduce((total, cost) => total + cost, 0);
}

async function generateRankedFeed({ prompt, profile, model, settings, context, searchLog }: {
  prompt: string;
  profile: string | undefined;
  model: ClaudeFeedModelId;
  settings: ClaudeFeedResolvedSettings;
  context: ResolverContext;
  searchLog: ClaudeFeedSearchLog;
}) {
  const finalStepNumber = settings.maxSearchRounds;
  const result = await generateText({
    model,
    system: getClaudeFeedSystemPrompt({
      feedInstructions: settings.feedInstructions,
      maxSearchRounds: settings.maxSearchRounds,
      maxResults: settings.maxResults,
      reasonWords: settings.reasonWords,
    }),
    prompt: JSON.stringify({
      userRequest: prompt,
      readerProfile: profile ?? null,
    }),
    maxOutputTokens: Math.min(2_500, (settings.maxResults * 100) + 400),
    tools: {
      searchLessWrong: tool({
        description: "Search LessWrong for posts, comments, or wiki pages. Returns candidates you can rank by candidateId.",
        inputSchema: claudeFeedSearchInputSchema,
        execute: (input) => runLoggedSearch(input, settings, context, searchLog),
      }),
      rankFrontpageItems: tool({
        description: "Return the user's ranked LessWrong reading queue. Call this once, after searching.",
        inputSchema: claudeFeedRankingSchema,
      }),
    },
    stopWhen: stepCountIs(finalStepNumber + 1),
    prepareStep: ({ stepNumber }) => ({ toolChoice: getFeedToolChoice(stepNumber, finalStepNumber) }),
  });

  const rankingCall = result.steps
    .flatMap((step) => step.toolCalls)
    .find(({ toolName }) => toolName === "rankFrontpageItems");
  if (!rankingCall) {
    throw new Error("Claude did not return a ranked feed");
  }
  return {
    ranking: claudeFeedRankingSchema.parse(rankingCall.input),
    accounting: getClaudeFeedRunAccounting(
      model,
      result.totalUsage,
      sumGatewayCostUsd(result.steps.map((step) => step.providerMetadata)),
    ),
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
    const searchLog: ClaudeFeedSearchLog = {
      searches: [],
      candidatesById: new Map(),
      intervals: [],
    };

    const loopStartedAt = Date.now();
    const { ranking, accounting } = await generateRankedFeed({ prompt, profile, model, settings, context, searchLog });
    const loopMs = Date.now() - loopStartedAt;

    const items = uniqBy(ranking.items, ({ candidateId }) => candidateId)
      .flatMap(({ candidateId, reason }) => {
        const candidate = searchLog.candidatesById.get(candidateId);
        return candidate ? [{ id: candidate.id, type: candidate.type, reason }] : [];
      })
      .slice(0, settings.maxResults)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const searchMs = getCoveredDurationMs(searchLog.intervals);
    const timings = {
      searchMs,
      modelMs: Math.max(0, loopMs - searchMs),
      totalMs: Date.now() - startedAt,
    };

    serverCaptureEvent("claudeFrontpageFeedGenerated", {
      searchCount: searchLog.searches.length,
      candidateCount: searchLog.candidatesById.size,
      resultCount: items.length,
      model,
      inputTokens: accounting.usage.inputTokens,
      outputTokens: accounting.usage.outputTokens,
      costUsd: accounting.costUsd,
      costIsEstimated: accounting.costIsEstimated,
      maxSearchRounds: settings.maxSearchRounds,
      resultsPerSearch: settings.resultsPerSearch,
      snippetChars: settings.snippetChars,
      maxResults: settings.maxResults,
      usesCustomFeedInstructions: !!settings.feedInstructions,
      ...timings,
      durationMs: timings.totalMs,
    });

    return NextResponse.json({
      items,
      model,
      candidateCount: searchLog.candidatesById.size,
      searches: searchLog.searches,
      timings,
      ...accounting,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to build Claude frontpage feed", error);
    return NextResponse.json({ error: "Claude couldn’t build this feed. Try a shorter request." }, { status: 500 });
  }
}
