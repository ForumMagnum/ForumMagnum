import { DAY_MS } from "@/lib/aiDigest/constants";
import { tool, type ToolSet } from "ai";
import { z } from "zod";
import uniq from "lodash/uniq";
import { getEmbeddingsFromApi, isEmbeddingsAPIEnabled } from "@/server/embeddings";
import { AI_DIGEST_MIN_KARMA, loadAiDigestPostCandidates, type AiDigestPostCandidate } from "./aiDigestCandidates";
import type { AiDigestPreviousInclusion } from "./aiDigestHistory";
import { aiDigestPromptJson } from "./aiDigestModelCalls";
import { aiDigestPromptPost } from "./aiDigestPostSelectionPrompt";
import { aiDigestPlainText, loadAiDigestPostHtml } from "./aiDigestPostText";

const SEARCH_RECENT_DAYS = 90;
const SEARCH_DEFAULT_LIMIT = 10;
const SEARCH_MAX_LIMIT = 20;
/** Nearest neighbors are fetched before eligibility filtering, so fetch extra. */
const SEARCH_OVERFETCH_MULTIPLIER = 3;
const READ_POST_MAX_PER_GENERATION = 10;
const READ_POST_MAX_CHARS = 15_000;
export const AI_DIGEST_SELECTION_STEP_LIMIT = 4;

interface AiDigestSelectionToolsContext {
  user: DbUser;
  context: ResolverContext;
  candidatePostsById: Map<string, AiDigestPostCandidate>;
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  /** Whether posts recommended in earlier issues may be offered, as they are among the candidates. */
  repeatsAllowed: boolean;
  asOf: Date;
}

function wrapUntrustedToolPayload(label: string, payload: unknown): string {
  return [
    `<UNTRUSTED_${label}>`,
    aiDigestPromptJson(payload),
    `</UNTRUSTED_${label}>`,
  ].join("\n");
}

/** Whether the model may select a post it found by search, under the same rules as the candidates. */
export function isSelectableAiDigestSearchResult(post: AiDigestPostCandidate, repeatsAllowed: boolean): boolean {
  return repeatsAllowed || !post.previousDigest;
}

function searchResultGroup({ postIds, selectableById, candidatePostsById, limit }: {
  postIds: string[];
  selectableById: Map<string, AiDigestPostCandidate>;
  candidatePostsById: Map<string, AiDigestPostCandidate>;
  limit: number;
}) {
  return postIds
    .flatMap((postId) => {
      const post = selectableById.get(postId);
      return post ? [{ ...aiDigestPromptPost(post), inCandidates: candidatePostsById.has(postId) }] : [];
    })
    .slice(0, limit);
}

async function searchPosts(
  { user, context, previousInclusions, repeatsAllowed, asOf, candidatePostsById }: AiDigestSelectionToolsContext,
  { query, includeRead, limit }: { query: string; includeRead: boolean; limit: number },
) {
  const { embeddings } = await getEmbeddingsFromApi(query);
  const fetchLimit = limit * SEARCH_OVERFETCH_MULTIPLIER;
  const recentAfter = new Date(asOf.getTime() - (SEARCH_RECENT_DAYS * DAY_MS));
  const [allTimePostIds, recentPostIds] = await Promise.all([
    context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(
      embeddings, fetchLimit, { minKarma: AI_DIGEST_MIN_KARMA, publishedAfter: null },
    ),
    context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(
      embeddings, fetchLimit, { minKarma: AI_DIGEST_MIN_KARMA, publishedAfter: recentAfter },
    ),
  ]);
  const eligiblePosts = await loadAiDigestPostCandidates({
    user,
    context,
    previousInclusions,
    asOf,
    postIds: uniq([...allTimePostIds, ...recentPostIds]),
  });
  const selectableById = new Map(eligiblePosts
    .filter((post) => isSelectableAiDigestSearchResult(post, repeatsAllowed) && (includeRead || !post.hasReadStatus))
    .map((post) => [post.postId, post]));
  return {
    allTime: searchResultGroup({ postIds: allTimePostIds, selectableById, candidatePostsById, limit }),
    recent: searchResultGroup({ postIds: recentPostIds, selectableById, candidatePostsById, limit }),
  };
}

/** The body of a post the reader could be recommended, as plain text. */
async function readPostBody(
  { user, context, previousInclusions, asOf, candidatePostsById }: AiDigestSelectionToolsContext,
  postId: string,
): Promise<string | null> {
  const post = candidatePostsById.get(postId)
    ?? (await loadAiDigestPostCandidates({ user, context, previousInclusions, asOf, postIds: [postId] }))[0];
  const [postWithHtml] = post ? await loadAiDigestPostHtml([post], context) : [];
  return postWithHtml ? aiDigestPlainText(postWithHtml.html, READ_POST_MAX_CHARS) : null;
}

export function createAiDigestSelectionTools(toolsContext: AiDigestSelectionToolsContext): ToolSet {
  let readPostCount = 0;
  const readPost = tool({
    description:
      "Read bounded plain-text body content for a post ID from the candidates or search results. "
      + "Use before selecting an archive post that was discovered by search.",
    inputSchema: z.object({
      postId: z.string().min(1),
    }),
    execute: async ({ postId }) => {
      if (readPostCount >= READ_POST_MAX_PER_GENERATION) {
        return wrapUntrustedToolPayload("POST_BODY", {
          error: `readPost budget exhausted after ${READ_POST_MAX_PER_GENERATION} reads`,
        });
      }
      readPostCount += 1;
      const body = await readPostBody(toolsContext, postId);
      return wrapUntrustedToolPayload("POST_BODY", body ? { postId, body } : { error: "post body unavailable" });
    },
  });
  if (!isEmbeddingsAPIEnabled()) {
    return { readPost };
  }
  const searchPostsTool = tool({
    description:
      "Semantically search LessWrong posts by a natural-language description of "
      + "desired content. Returns titles/metadata in all-time and recent groups. "
      + "Does not support exact author or title lookup.",
    inputSchema: z.object({
      query: z.string().min(1).max(500),
      includeRead: z.boolean().optional(),
      limit: z.number().int().min(1).max(SEARCH_MAX_LIMIT).optional(),
    }),
    execute: async ({ query, includeRead = false, limit = SEARCH_DEFAULT_LIMIT }) =>
      wrapUntrustedToolPayload("SEARCH_RESULTS", await searchPosts(toolsContext, { query, includeRead, limit })),
  });
  return { readPost, searchPosts: searchPostsTool };
}
