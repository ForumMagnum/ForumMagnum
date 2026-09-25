import type { AiDigestThreadCommentRow } from "@/server/repos/CommentsRepo";
import groupBy from "lodash/groupBy";
import uniq from "lodash/uniq";
import { aiDigestCandidateWindowStart } from "./aiDigestCandidates";
import type { AiDigestPreviousInclusion } from "./aiDigestHistory";
import { aiDigestPlainText } from "./aiDigestPostText";

const SITE_WIDE_THREAD_LIMIT = 12;
const READER_THREAD_LIMIT = 8;
const CARD_COMMENT_LIMIT = 12;
const COMMENT_BODY_MAX_CHARS = 350;
/**
 * Comments loaded per thread. Card shaping needs whole parent chains, so this is
 * generous relative to the card budget; it only guards against pathological
 * several-hundred-comment threads.
 */
const COMMENT_LOAD_LIMIT = 100;

export interface AiDigestThreadCardComment extends Omit<
  AiDigestThreadCommentRow,
  "threadId" | "postTitle" | "postBaseScore" | "html" | "seesLess"
> {
  body: string;
  truncated: boolean;
}

/** A candidate thread, and the comments from it the model is shown, as the prompt shows them. */
export interface AiDigestThreadCard {
  threadId: string;
  postTitle: string | null;
  postBaseScore: number | null;
  /** The reader wrote or upvoted a comment in the thread. */
  participated: boolean;
  /** Set when the thread ran in an earlier issue. */
  previousDigest?: AiDigestPreviousInclusion;
  /** Oldest first. */
  comments: AiDigestThreadCardComment[];
}

function toCardComment({ threadId, postTitle, postBaseScore, html, seesLess, ...row }: AiDigestThreadCommentRow): AiDigestThreadCardComment {
  const plainText = aiDigestPlainText(html);
  return {
    ...row,
    body: plainText.slice(0, COMMENT_BODY_MAX_CHARS),
    truncated: plainText.length > COMMENT_BODY_MAX_CHARS,
  };
}

function isReaderFlagged(row: AiDigestThreadCommentRow): boolean {
  return row.authoredByReader || row.liked !== null || row.newSinceLastVisit;
}

function compareByReaderFlagThenKarma(first: AiDigestThreadCommentRow, second: AiDigestThreadCommentRow): number {
  return Number(isReaderFlagged(second)) - Number(isReaderFlagged(first))
    || second.baseScore - first.baseScore
    || first.postedAt.getTime() - second.postedAt.getTime()
    || first.commentId.localeCompare(second.commentId);
}

/**
 * The comments of a thread to show the model, in priority order: the root for
 * orientation, then comments the reader wrote, liked or hasn't seen, then
 * top-karma comments to fill the budget. Every included comment's chain of
 * parents is included too, so it can be read in context; a comment whose chain
 * doesn't fit in the budget, or doesn't resolve, is skipped.
 */
function aiDigestThreadCardComments(threadId: string, rows: AiDigestThreadCommentRow[]): AiDigestThreadCardComment[] {
  const rowsById = new Map(rows.map((row) => [row.commentId, row]));
  const selectedIds = new Set<string>([threadId]);
  for (const row of rows.filter(({ commentId }) => commentId !== threadId).sort(compareByReaderFlagThenKarma)) {
    const missingIds: string[] = [];
    let current: AiDigestThreadCommentRow | undefined = row;
    while (current && !selectedIds.has(current.commentId) && !missingIds.includes(current.commentId)) {
      missingIds.push(current.commentId);
      current = current.parentCommentId ? rowsById.get(current.parentCommentId) : undefined;
    }
    const chainResolves = !!current && selectedIds.has(current.commentId);
    if (chainResolves && selectedIds.size + missingIds.length <= CARD_COMMENT_LIMIT) {
      missingIds.forEach((id) => selectedIds.add(id));
    }
  }
  return rows
    .filter((row) => selectedIds.has(row.commentId))
    .sort((first, second) => first.postedAt.getTime() - second.postedAt.getTime() || first.commentId.localeCompare(second.commentId))
    .map(toCardComment);
}

/** Aggregate history across a thread's comments: any of them may have anchored an earlier issue's thread. */
function threadPreviousInclusion(
  rows: AiDigestThreadCommentRow[],
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): AiDigestPreviousInclusion | undefined {
  return rows.reduce<AiDigestPreviousInclusion | undefined>((total, { commentId }) => {
    const inclusion = previousInclusions.get(commentId);
    if (!inclusion) return total;
    return {
      count: (total?.count ?? 0) + inclusion.count,
      lastIncludedAt: total && total.lastIncludedAt > inclusion.lastIncludedAt ? total.lastIncludedAt : inclusion.lastIncludedAt,
    };
  }, undefined);
}

function toThreadCard(
  threadId: string,
  rows: AiDigestThreadCommentRow[],
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): AiDigestThreadCard | null {
  const root = rows.find((row) => row.commentId === threadId);
  // Threads the reader asked to see less of are never offered.
  if (!root || rows.some((row) => row.seesLess)) {
    return null;
  }
  const comments = aiDigestThreadCardComments(threadId, rows);
  const previousDigest = threadPreviousInclusion(rows, previousInclusions);
  // A thread that already ran is offered again only if the discussion has moved on since.
  if (previousDigest && !comments.some((comment) => comment.postedAt > previousDigest.lastIncludedAt)) {
    return null;
  }
  return {
    threadId,
    postTitle: root.postTitle,
    postBaseScore: root.postBaseScore,
    participated: rows.some((row) => row.authoredByReader || row.liked !== null),
    previousDigest,
    comments,
  };
}

/**
 * Recent threads for the discussion section: those relevant to the reader (ones
 * they took part in, and ones with new comments on posts they read or upvoted),
 * then the site's top threads by comment karma.
 */
export async function loadAiDigestThreadCards(
  user: DbUser,
  context: ResolverContext,
  asOf: Date,
  previousInclusions: Map<string, AiDigestPreviousInclusion>,
): Promise<AiDigestThreadCard[]> {
  const minPostedAt = aiDigestCandidateWindowStart(asOf);
  const [readerThreadIds, siteWideThreadIds] = await Promise.all([
    context.repos.comments.getAiDigestReaderThreadIds({ userId: user._id, minPostedAt, limit: READER_THREAD_LIMIT }),
    context.repos.comments.getAiDigestSiteWideThreadIds({ minPostedAt, limit: SITE_WIDE_THREAD_LIMIT }),
  ]);
  const threadIds = uniq([...readerThreadIds, ...siteWideThreadIds]);
  const rows = await context.repos.comments.getAiDigestThreadComments({
    userId: user._id,
    threadIds,
    perThreadLimit: COMMENT_LOAD_LIMIT,
  });
  const rowsByThreadId = groupBy(rows, (row) => row.threadId);
  return threadIds.flatMap((threadId) => {
    const card = toThreadCard(threadId, rowsByThreadId[threadId] ?? [], previousInclusions);
    return card ? [card] : [];
  });
}
