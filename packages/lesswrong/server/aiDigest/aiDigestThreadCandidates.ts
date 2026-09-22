import { DAY_MS } from "@/lib/aiDigest/constants";
import { collapseAiDigestWhitespace } from "@/lib/aiDigest/aiDigestDisplay";
import type {
  AiDigestThreadCommentRow,
} from "@/server/repos/CommentsRepo";
import {
  annotateAiDigestThreadComments,
  type AiDigestThreadCommentAnnotationRow,
} from "./aiDigestReaderSignals";
import { htmlToTextDefault } from "@/lib/htmlToText";
import type { AiDigestPostHistory } from "./aiDigestHistory";
import { AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS } from "./aiDigestPostCandidates";

const AI_DIGEST_SITE_WIDE_THREAD_LIMIT = 12;
const AI_DIGEST_READER_THREAD_LIMIT = 8;
const AI_DIGEST_THREAD_CARD_COMMENT_LIMIT = 12;
export const AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS = 350;
/**
 * SQL-level guard on comments loaded per thread. Card shaping needs whole
 * parent chains available, so the cap is generous relative to the 12-comment
 * card budget; it only defends against pathological several-hundred-comment
 * threads.
 */
const AI_DIGEST_THREAD_COMMENT_LOAD_LIMIT = 100;

type AiDigestThreadSource = "siteWide" | "readerRelevant";

/**
 * Comments the reader would already be notified about cannot anchor a
 * digest thread, but stay available as displayed context.
 */
type AiDigestThreadAnchorIneligibilityReason =
  | "readerAuthored"
  | "onReaderPost"
  | "replyToReader";

export interface AiDigestThreadCardComment {
  commentId: string;
  parentCommentId: string | null;
  author: string;
  publicationDate: string;
  baseScore: number;
  body: string;
  truncated: boolean;
}

export interface AiDigestThreadCard {
  threadId: string;
  postId: string | null;
  postTitle: string | null;
  postBaseScore: number | null;
  source: AiDigestThreadSource;
  comments: AiDigestThreadCardComment[];
}

export interface AiDigestThreadCommentReaderFlags {
  commentId: string;
  authoredByReader: boolean;
  upvoteStrength: "regular" | "strong" | null;
  newSinceLastVisit: boolean;
  seenInFeed: boolean;
  anchorIneligibilityReason: AiDigestThreadAnchorIneligibilityReason | null;
}

export interface AiDigestThreadAnnotation {
  threadId: string;
  participated: boolean;
  previousDigestInclusionCount: number;
  lastIncludedAt: string | null;
  hasActiveSeeLess: boolean;
}

export interface AiDigestThreadCandidates {
  siteWideThreads: AiDigestThreadCard[];
  readerThreads: AiDigestThreadCard[];
  commentFlagsById: Map<string, AiDigestThreadCommentReaderFlags>;
  threadAnnotationsById: Map<string, AiDigestThreadAnnotation>;
}

interface LoadAiDigestThreadCandidatesOptions {
  now: Date;
  postHistoryById: Map<string, AiDigestPostHistory>;
}


function boundedThreadCommentBody(revisionHtml: string): {
  body: string;
  truncated: boolean;
} {
  const plainText = collapseAiDigestWhitespace(htmlToTextDefault(revisionHtml));
  return {
    body: plainText.slice(0, AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS),
    truncated: plainText.length > AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS,
  };
}

function toThreadCardComment(row: AiDigestThreadCommentRow): AiDigestThreadCardComment {
  const { body, truncated } = boundedThreadCommentBody(row.revisionHtml);
  return {
    commentId: row.commentId,
    parentCommentId: row.parentCommentId,
    author: row.author,
    publicationDate: row.publicationDate.toISOString(),
    baseScore: row.baseScore,
    body,
    truncated,
  };
}

function anchorIneligibilityReasonFromAnnotation(
  annotation: AiDigestThreadCommentAnnotationRow,
): AiDigestThreadAnchorIneligibilityReason | null {
  if (annotation.authoredByReader) {
    return "readerAuthored";
  }
  if (annotation.onReaderAuthoredPost) {
    return "onReaderPost";
  }
  if (annotation.replyToReaderComment) {
    return "replyToReader";
  }
  return null;
}

export function toThreadCommentReaderFlags(
  annotation: AiDigestThreadCommentAnnotationRow,
): AiDigestThreadCommentReaderFlags {
  return {
    commentId: annotation.commentId,
    authoredByReader: annotation.authoredByReader,
    upvoteStrength: annotation.positivePreferenceStrength,
    newSinceLastVisit: annotation.newSinceLastVisit,
    seenInFeed: annotation.seenInFeed,
    anchorIneligibilityReason: anchorIneligibilityReasonFromAnnotation(annotation),
  };
}

function isReaderFlagged(flags: AiDigestThreadCommentReaderFlags | undefined): boolean {
  return !!flags && (
    flags.authoredByReader
    || flags.upvoteStrength !== null
    || flags.newSinceLastVisit
  );
}

function compareByKarmaThenDate(
  first: AiDigestThreadCommentRow,
  second: AiDigestThreadCommentRow,
): number {
  return second.baseScore - first.baseScore
    || first.publicationDate.getTime() - second.publicationDate.getTime()
    || first.commentId.localeCompare(second.commentId);
}

function compareByDate(
  first: AiDigestThreadCardComment,
  second: AiDigestThreadCardComment,
): number {
  return first.publicationDate.localeCompare(second.publicationDate)
    || first.commentId.localeCompare(second.commentId);
}

/**
 * Deterministic card comment pre-selection, in priority order: the thread root
 * for orientation, then reader-flagged comments (the personalization anchors),
 * then top-karma comments to fill the budget — always pulling in connecting
 * parents so every included comment's chain resolves within the card. Comments
 * that would blow the budget (including their missing ancestors) are skipped.
 *
 * Site-wide cards are shared across readers and must be byte-stable, so they
 * are built without reader flags (`commentFlagsById` omitted).
 */
export function buildAiDigestThreadCard({
  threadId,
  source,
  rows,
  commentFlagsById,
  maxComments = AI_DIGEST_THREAD_CARD_COMMENT_LIMIT,
}: {
  threadId: string;
  source: AiDigestThreadSource;
  rows: AiDigestThreadCommentRow[];
  commentFlagsById?: Map<string, AiDigestThreadCommentReaderFlags>;
  maxComments?: number;
}): AiDigestThreadCard | null {
  const rowsById = new Map(rows.map((row) => [row.commentId, row]));
  const root = rowsById.get(threadId);
  if (!root) {
    return null;
  }
  const prioritizedRows = rows
    .filter((row) => row.commentId !== threadId)
    .sort((first, second) =>
      Number(isReaderFlagged(commentFlagsById?.get(second.commentId)))
      - Number(isReaderFlagged(commentFlagsById?.get(first.commentId)))
      || compareByKarmaThenDate(first, second));

  const selectedIds = new Set<string>([threadId]);
  for (const row of prioritizedRows) {
    if (selectedIds.has(row.commentId)) continue;
    const missingIds = [row.commentId];
    let parentId = row.parentCommentId;
    let hops = 0;
    while (parentId && hops++ <= rowsById.size) {
      const parent = rowsById.get(parentId);
      if (!parent) break;
      if (!selectedIds.has(parentId)) missingIds.push(parentId);
      parentId = parent.parentCommentId;
    }
    // A missing parent or cycle prevents this branch from being represented.
    if (parentId || selectedIds.size + missingIds.length > maxComments) continue;
    for (const id of missingIds) selectedIds.add(id);
  }

  const comments = rows
    .filter((row) => selectedIds.has(row.commentId))
    .map(toThreadCardComment)
    .sort(compareByDate);
  return {
    threadId,
    postId: root.postId,
    postTitle: root.postTitle,
    postBaseScore: root.postBaseScore,
    source,
    comments,
  };
}

export function buildAiDigestThreadAnnotation({
  threadId,
  rows,
  annotationsByCommentId,
  participatedPerRanking,
  postHistoryById,
}: {
  threadId: string;
  rows: AiDigestThreadCommentRow[];
  annotationsByCommentId: Map<string, AiDigestThreadCommentAnnotationRow>;
  participatedPerRanking: boolean;
  postHistoryById: Map<string, AiDigestPostHistory>;
}): AiDigestThreadAnnotation {
  const result: AiDigestThreadAnnotation = {
    threadId,
    participated: participatedPerRanking,
    hasActiveSeeLess: false,
    previousDigestInclusionCount: 0,
    lastIncludedAt: null,
  };
  for (const row of rows) {
    const annotation = annotationsByCommentId.get(row.commentId);
    result.participated ||= annotation?.authoredByReader ?? false;
    result.hasActiveSeeLess ||= annotation?.hasActiveSeeLess ?? false;
    const history = postHistoryById.get(row.commentId);
    if (history) {
      result.previousDigestInclusionCount += history.previousDigestInclusionCount;
      if (!result.lastIncludedAt || (history.lastIncludedAt && history.lastIncludedAt > result.lastIncludedAt)) {
        result.lastIncludedAt = history.lastIncludedAt;
      }
    }
  }
  return result;
}

export async function loadAiDigestThreadCandidates(
  user: DbUser,
  context: ResolverContext,
  options: LoadAiDigestThreadCandidatesOptions,
): Promise<AiDigestThreadCandidates> {
  const now = options.now;
  const maxAgeDays = AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS;
  const siteWideThreadLimit = AI_DIGEST_SITE_WIDE_THREAD_LIMIT;
  const readerThreadLimit = AI_DIGEST_READER_THREAD_LIMIT;
  const postHistoryById = options.postHistoryById;
  const minPostedAt = new Date(now.getTime() - (maxAgeDays * DAY_MS));

  const [siteWideRows, readerRows] = await Promise.all([
    context.repos.comments.getAiDigestSiteWideThreadRows({
      minPostedAt,
      limit: siteWideThreadLimit,
    }),
    context.repos.comments.getAiDigestReaderThreadRows({
      userId: user._id,
      minPostedAt,
      // Overfetch so threads deduplicated against the site-wide pool cannot
      // starve the reader pool.
      limit: readerThreadLimit + siteWideThreadLimit,
    }),
  ]);
  const siteWideThreadIds = siteWideRows.map((row) => row.threadId);
  const siteWideThreadIdSet = new Set(siteWideThreadIds);
  const dedupedReaderRows = readerRows
    .filter((row) => !siteWideThreadIdSet.has(row.threadId))
    .slice(0, readerThreadLimit);
  const participatedByThreadId = new Map(readerRows.map((row) => [row.threadId, row.participated]));
  const allThreadIds = [
    ...siteWideThreadIds,
    ...dedupedReaderRows.map((row) => row.threadId),
  ];

  const commentRows = await context.repos.comments.getAiDigestThreadCommentRows({
    threadIds: allThreadIds,
    perThreadLimit: AI_DIGEST_THREAD_COMMENT_LOAD_LIMIT,
  });
  const annotations = await annotateAiDigestThreadComments({
    userId: user._id,
    comments: commentRows,
  });
  const annotationsByCommentId = new Map(
    annotations.map((annotation) => [annotation.commentId, annotation]),
  );
  const rowsByThreadId = new Map<string, AiDigestThreadCommentRow[]>();
  for (const row of commentRows) {
    const rows = rowsByThreadId.get(row.threadId) ?? [];
    rows.push(row);
    rowsByThreadId.set(row.threadId, rows);
  }
  const commentFlagsById = new Map(
    annotations.map((annotation) => [
      annotation.commentId,
      toThreadCommentReaderFlags(annotation),
    ]),
  );

  const siteWideThreads: AiDigestThreadCard[] = [];
  const readerThreads: AiDigestThreadCard[] = [];
  const threadAnnotationsById = new Map<string, AiDigestThreadAnnotation>();
  const cardCommentIds = new Set<string>();
  for (const threadId of allThreadIds) {
    const siteWide = siteWideThreadIdSet.has(threadId);
    const rows = rowsByThreadId.get(threadId) ?? [];
    const card = buildAiDigestThreadCard({
      threadId,
      source: siteWide ? "siteWide" : "readerRelevant",
      rows,
      // The shared corpus's comment choices cannot depend on the reader.
      commentFlagsById: siteWide ? undefined : commentFlagsById,
    });
    if (!card) continue;
    (siteWide ? siteWideThreads : readerThreads).push(card);
    for (const comment of card.comments) cardCommentIds.add(comment.commentId);
    threadAnnotationsById.set(threadId, buildAiDigestThreadAnnotation({
      threadId,
      rows,
      annotationsByCommentId,
      participatedPerRanking: participatedByThreadId.get(threadId) ?? false,
      postHistoryById,
    }));
  }
  return {
    siteWideThreads,
    readerThreads,
    // Preserve annotation order, independent of card/comment ranking.
    commentFlagsById: new Map([...commentFlagsById].filter(([id]) => cardCommentIds.has(id))),
    threadAnnotationsById,
  };
}
