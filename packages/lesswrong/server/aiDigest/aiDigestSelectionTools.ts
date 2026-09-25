import { DAY_MS } from "@/lib/aiDigest/constants";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { getEmbeddingsFromApi, isEmbeddingsAPIEnabled } from "@/server/embeddings";
import { tool, type ToolSet } from "ai";
import uniq from "lodash/uniq";
import { z } from "zod";
import { AI_DIGEST_MIN_KARMA, loadAiDigestPostCandidates, type AiDigestPostCandidate } from "./aiDigestCandidates";
import type { AiDigestPreviousInclusion } from "./aiDigestHistory";
import { aiDigestUntrustedJson } from "./aiDigestModelCalls";
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

export interface AiDigestSelectionScope {
  user: DbUser;
  context: ResolverContext;
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  /** Whether posts recommended in earlier issues may be picked, as they are among the candidates. */
  repeatsAllowed: boolean;
  asOf: Date;
}

/** The given posts that the model may pick, under the same rules as the candidates. */
export async function loadSelectableAiDigestPosts(scope: AiDigestSelectionScope, postIds: string[]): Promise<AiDigestPostCandidate[]> {
  const posts = await loadAiDigestPostCandidates({ ...scope, postIds });
  return posts.filter((post) => scope.repeatsAllowed || !post.previousDigest);
}

function searchResultGroup(
  postIds: string[],
  shownPostsById: Map<string, AiDigestPostCandidate>,
  candidatePostsById: Map<string, AiDigestPostCandidate>,
  limit: number,
) {
  return filterNonnull(postIds.map((postId) => shownPostsById.get(postId)))
    .slice(0, limit)
    .map((post) => ({ ...aiDigestPromptPost(post), inCandidates: candidatePostsById.has(post.postId) }));
}

async function searchPosts(
  scope: AiDigestSelectionScope,
  candidatePostsById: Map<string, AiDigestPostCandidate>,
  { query, includeRead, limit }: { query: string; includeRead: boolean; limit: number },
) {
  const { embeddings } = await getEmbeddingsFromApi(query);
  const fetchLimit = limit * SEARCH_OVERFETCH_MULTIPLIER;
  const recentAfter = new Date(scope.asOf.getTime() - (SEARCH_RECENT_DAYS * DAY_MS));
  const [allTimePostIds, recentPostIds] = await Promise.all([
    scope.context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(
      embeddings, fetchLimit, { minKarma: AI_DIGEST_MIN_KARMA, publishedAfter: null },
    ),
    scope.context.repos.postEmbeddings.getNearestPostIdsWeightedByQuality(
      embeddings, fetchLimit, { minKarma: AI_DIGEST_MIN_KARMA, publishedAfter: recentAfter },
    ),
  ]);
  const selectablePosts = await loadSelectableAiDigestPosts(scope, uniq([...allTimePostIds, ...recentPostIds]));
  const shownPosts = includeRead ? selectablePosts : selectablePosts.filter((post) => !post.hasReadStatus);
  const shownPostsById = new Map(shownPosts.map((post) => [post.postId, post]));
  return {
    allTime: searchResultGroup(allTimePostIds, shownPostsById, candidatePostsById, limit),
    recent: searchResultGroup(recentPostIds, shownPostsById, candidatePostsById, limit),
  };
}

async function readPostBody(
  scope: AiDigestSelectionScope,
  candidatePostsById: Map<string, AiDigestPostCandidate>,
  postId: string,
): Promise<string | null> {
  const post = candidatePostsById.get(postId) ?? (await loadSelectableAiDigestPosts(scope, [postId]))[0];
  if (!post) {
    return null;
  }
  const [postWithHtml] = await loadAiDigestPostHtml([post], scope.context);
  return postWithHtml ? aiDigestPlainText(postWithHtml.html, READ_POST_MAX_CHARS) : null;
}

export function createAiDigestSelectionTools(
  scope: AiDigestSelectionScope,
  candidatePostsById: Map<string, AiDigestPostCandidate>,
): ToolSet {
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
        return aiDigestUntrustedJson("POST_BODY", { error: `readPost budget exhausted after ${READ_POST_MAX_PER_GENERATION} reads` });
      }
      readPostCount += 1;
      const body = await readPostBody(scope, candidatePostsById, postId);
      return aiDigestUntrustedJson("POST_BODY", body ? { postId, body } : { error: "post body unavailable" });
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
      aiDigestUntrustedJson("SEARCH_RESULTS", await searchPosts(scope, candidatePostsById, { query, includeRead, limit })),
  });
  return { readPost, searchPosts: searchPostsTool };
}
