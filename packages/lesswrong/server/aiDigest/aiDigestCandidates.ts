import { DAY_MS } from "@/lib/aiDigest/constants";
import { collapseAiDigestWhitespace } from "@/lib/aiDigest/aiDigestDisplay";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { aboutPostIdSetting } from "@/lib/instanceSettings";
import type { AiDigestQuickTakeCandidateRow } from "@/server/repos/CommentsRepo";
import type { AiDigestPostCandidateRow } from "@/server/repos/PostsRepo";
import type { AiDigestPreviousInclusion } from "./aiDigestHistory";

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

export interface AiDigestPostCandidate extends AiDigestPostCandidateRow {
  previousInclusion?: AiDigestPreviousInclusion;
}

export interface AiDigestQuickTakeCandidate extends Omit<AiDigestQuickTakeCandidateRow, "html"> {
  /** Bounded plaintext of the quick take. */
  body: string;
  previousInclusion?: AiDigestPreviousInclusion;
}

export interface AiDigestCandidatePool<Post extends AiDigestPostCandidate> {
  posts: Post[];
  quickTakes: AiDigestQuickTakeCandidate[];
  /** Whether items recommended in earlier issues had to be let back in to fill a slate. */
  repeatsAllowed: boolean;
}

function withPreviousInclusion(
  row: AiDigestPostCandidateRow,
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): AiDigestPostCandidate {
  return { ...row, previousInclusion: previousInclusions.get(row.postId) };
}

/** The most recent posts the reader could be recommended. */
export async function loadRecentAiDigestPostCandidates(
  user: DbUser,
  context: ResolverContext,
  asOf: Date,
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): Promise<AiDigestPostCandidate[]> {
  const rows = await context.repos.posts.getAiDigestPostCandidates({
    userId: user._id,
    aboutPostId: aboutPostIdSetting.get(context.forumType),
    minKarma: AI_DIGEST_MIN_KARMA,
    minPostedAt: new Date(asOf.getTime() - (AI_DIGEST_CANDIDATE_MAX_AGE_DAYS * DAY_MS)),
    limit: POST_CANDIDATE_LIMIT,
  });
  return rows.map((row) => withPreviousInclusion(row, previousInclusions));
}

/** The given posts, if the reader could be recommended them, in no particular order. */
export async function loadAiDigestPostCandidatesByIds(
  user: DbUser,
  context: ResolverContext,
  postIds: string[],
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): Promise<AiDigestPostCandidate[]> {
  if (postIds.length === 0) {
    return [];
  }
  const rows = await context.repos.posts.getAiDigestPostCandidates({
    userId: user._id,
    aboutPostId: aboutPostIdSetting.get(context.forumType),
    minKarma: AI_DIGEST_MIN_KARMA,
    postIds,
  });
  return rows.map((row) => withPreviousInclusion(row, previousInclusions));
}

export async function loadAiDigestQuickTakeCandidates(
  user: DbUser,
  context: ResolverContext,
  asOf: Date,
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): Promise<AiDigestQuickTakeCandidate[]> {
  const rows = await context.repos.comments.getAiDigestQuickTakeCandidates({
    userId: user._id,
    minPostedAt: new Date(asOf.getTime() - (AI_DIGEST_CANDIDATE_MAX_AGE_DAYS * DAY_MS)),
    minKarma: QUICK_TAKE_MIN_KARMA,
    limit: QUICK_TAKE_LIMIT,
  });
  return rows.flatMap(({ html, ...row }) => {
    const body = collapseAiDigestWhitespace(htmlToTextDefault(html)).slice(0, QUICK_TAKE_BODY_MAX_CHARS);
    return body
      ? [{ ...row, body, previousInclusion: previousInclusions.get(row.commentId) }]
      : [];
  });
}

function isUnrecommended(candidate: { previousInclusion?: AiDigestPreviousInclusion }): boolean {
  return !candidate.previousInclusion;
}

function canFillSlate(posts: unknown[], quickTakes: unknown[]): boolean {
  return posts.length >= MIN_POST_CANDIDATES && posts.length + quickTakes.length >= MIN_CANDIDATES;
}

/**
 * The candidates to offer the model: items recommended in an earlier issue are
 * left out, unless that leaves too few to fill a slate, in which case they are
 * let back in (and the prompt steers away from repeating them).
 */
export function aiDigestCandidatePool<Post extends AiDigestPostCandidate>(
  posts: Post[],
  quickTakes: AiDigestQuickTakeCandidate[],
): AiDigestCandidatePool<Post> {
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
