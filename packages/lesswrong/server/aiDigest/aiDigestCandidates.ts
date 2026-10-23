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
const MIN_POST_CANDIDATES = 2;
const MIN_CANDIDATES = 5;

export interface AiDigestPostCandidate extends AiDigestPostCandidateRow {
  previousDigest?: AiDigestPreviousInclusion;
}

export interface AiDigestQuickTakeCandidate extends Omit<AiDigestQuickTakeCandidateRow, "html"> {
  body: string;
  previousDigest?: AiDigestPreviousInclusion;
}

export interface AiDigestCandidatePool {
  posts: AiDigestPostCandidate[];
  quickTakes: AiDigestQuickTakeCandidate[];
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
