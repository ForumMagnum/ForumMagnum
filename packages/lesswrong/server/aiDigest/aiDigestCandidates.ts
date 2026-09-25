import { DAY_MS } from "@/lib/aiDigest/constants";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import type { AiDigestQuickTakeCandidateRow } from "@/server/repos/CommentsRepo";
import type { AiDigestPostCandidateRow } from "@/server/repos/PostsRepo";
import type { AiDigestPreviousInclusion } from "./aiDigestHistory";
import { aiDigestPlainText } from "./aiDigestPostText";

// TODO: widen to 28 days once the digest is operationally validated beyond the admin beta.
export const AI_DIGEST_CANDIDATE_MAX_AGE_DAYS = 14;
export const AI_DIGEST_MIN_KARMA = 20;
const POST_CANDIDATE_LIMIT = 60;
const QUICK_TAKE_MIN_KARMA = 20;
const QUICK_TAKE_LIMIT = 30;
const QUICK_TAKE_BODY_MAX_CHARS = 800;
/** Headline slots 1 and 2 are always posts, so a slate needs at least this many. */
const MIN_POST_CANDIDATES = 2;
const MIN_CANDIDATES = 5;

/** Candidates are shown to the model as they are, apart from the revision ID. */
export interface AiDigestPostCandidate extends AiDigestPostCandidateRow {
  /** Set when the post was recommended in an earlier issue. */
  previousDigest?: AiDigestPreviousInclusion;
}

export interface AiDigestQuickTakeCandidate extends Omit<AiDigestQuickTakeCandidateRow, "html"> {
  /** Bounded plaintext of the quick take. */
  body: string;
  /** Set when the quick take was recommended in an earlier issue. */
  previousDigest?: AiDigestPreviousInclusion;
}

export interface AiDigestCandidatePool {
  posts: AiDigestPostCandidate[];
  quickTakes: AiDigestQuickTakeCandidate[];
  /** Whether items recommended in earlier issues had to be let back in to fill a slate. */
  repeatsAllowed: boolean;
}

export interface AiDigestCandidateScope {
  user: DbUser;
  context: ResolverContext;
  previousInclusions: Map<string, AiDigestPreviousInclusion>;
  asOf: Date;
}

export function aiDigestCandidateWindowStart(asOf: Date): Date {
  return new Date(asOf.getTime() - (AI_DIGEST_CANDIDATE_MAX_AGE_DAYS * DAY_MS));
}

/**
 * Posts the reader could be recommended: the most recent ones, or, given
 * `postIds`, the eligible ones among those, in no particular order.
 */
export async function loadAiDigestPostCandidates(
  { user, context, previousInclusions, asOf }: AiDigestCandidateScope,
  postIds?: string[],
): Promise<AiDigestPostCandidate[]> {
  if (postIds?.length === 0) {
    return [];
  }
  const selector = postIds ? { postIds } : { minPostedAt: aiDigestCandidateWindowStart(asOf), limit: POST_CANDIDATE_LIMIT };
  const rows = await context.repos.posts.getAiDigestPostCandidates({
    userId: user._id,
    aboutPostId: aboutPostIdSetting.get(context.forumType),
    minKarma: AI_DIGEST_MIN_KARMA,
    ...selector,
  });
  return rows.map((row) => ({ ...row, previousDigest: previousInclusions.get(row.postId) }));
}

export async function loadAiDigestQuickTakeCandidates(
  { user, context, previousInclusions, asOf }: AiDigestCandidateScope,
): Promise<AiDigestQuickTakeCandidate[]> {
  const rows = await context.repos.comments.getAiDigestQuickTakeCandidates({
    userId: user._id,
    minPostedAt: aiDigestCandidateWindowStart(asOf),
    minKarma: QUICK_TAKE_MIN_KARMA,
    limit: QUICK_TAKE_LIMIT,
  });
  return rows
    .map(({ html, ...row }) => ({
      ...row,
      body: aiDigestPlainText(html, QUICK_TAKE_BODY_MAX_CHARS),
      previousDigest: previousInclusions.get(row.commentId),
    }))
    .filter((quickTake) => quickTake.body);
}

function isUnrecommended(candidate: { previousDigest?: AiDigestPreviousInclusion }): boolean {
  return !candidate.previousDigest;
}

function canFillSlate(posts: unknown[], quickTakes: unknown[]): boolean {
  return posts.length >= MIN_POST_CANDIDATES && posts.length + quickTakes.length >= MIN_CANDIDATES;
}

/**
 * The candidates to offer the model: items recommended in an earlier issue are
 * left out, unless that leaves too few to fill a slate, in which case they are
 * let back in (and the prompt steers away from repeating them).
 */
export function aiDigestCandidatePool(
  posts: AiDigestPostCandidate[],
  quickTakes: AiDigestQuickTakeCandidate[],
): AiDigestCandidatePool {
  const unrecommendedPosts = posts.filter(isUnrecommended);
  const unrecommendedQuickTakes = quickTakes.filter(isUnrecommended);
  if (canFillSlate(unrecommendedPosts, unrecommendedQuickTakes)) {
    return { posts: unrecommendedPosts, quickTakes: unrecommendedQuickTakes, repeatsAllowed: false };
  }
  if (!canFillSlate(posts, quickTakes)) {
    throw new Error(
      `AI digest needs at least ${MIN_POST_CANDIDATES} post candidates and ${MIN_CANDIDATES} candidates in total; `
      + `found ${posts.length} posts and ${quickTakes.length} quick takes`,
    );
  }
  return { posts, quickTakes, repeatsAllowed: true };
}
