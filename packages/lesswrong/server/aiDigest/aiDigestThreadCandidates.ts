import type {
  AiDigestReaderThreadRow,
  AiDigestThreadCommentAnnotationRow,
  AiDigestThreadCommentRow,
} from "@/server/repos/CommentsRepo";
import { htmlToTextDefault } from "@/lib/htmlToText";
import type { AiDigestPostHistory } from "./aiDigestHistory";
import { AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS } from "./aiDigestPostCandidates";

export const AI_DIGEST_SITE_WIDE_THREAD_LIMIT = 12;
export const AI_DIGEST_READER_THREAD_LIMIT = 8;
export const AI_DIGEST_THREAD_CARD_COMMENT_LIMIT = 12;
export const AI_DIGEST_THREAD_COMMENT_BODY_MAX_CHARS = 350;
/**
 * SQL-level guard on comments loaded per thread. Card shaping needs whole
 * parent chains available, so the cap is generous relative to the 12-comment
 * card budget; it only defends against pathological several-hundred-comment
 * threads.
 */
export const AI_DIGEST_THREAD_COMMENT_LOAD_LIMIT = 100;

export type AiDigestThreadSource = "siteWide" | "readerRelevant";

/**
 * Comments the reader would already be notified about cannot anchor a
 * digest thread, but stay available as displayed context.
 */
export type AiDigestThreadAnchorIneligibilityReason =
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

export interface LoadAiDigestThreadCandidatesOptions {
  maxAgeDays?: number;
  siteWideThreadLimit?: number;
  readerThreadLimit?: number;
  now?: Date;
  postHistoryById?: Map<string, AiDigestPostHistory>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function boundedThreadCommentBody(revisionHtml: string): {
  body: string;
  truncated: boolean;
} {
  const plainText = htmlToTextDefault(revisionHtml).replace(/\s+/g, " ").trim();
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
 * The comment's ancestor chain up to the thread root, nearest parent first.
 * Null when the chain cannot be resolved within the loaded rows (e.g. a
 * deleted intermediate comment).
 */
function ancestorChain(
  comment: AiDigestThreadCommentRow,
  rowsById: Map<string, AiDigestThreadCommentRow>,
): AiDigestThreadCommentRow[] | null {
  const chain: AiDigestThreadCommentRow[] = [];
  let parentId = comment.parentCommentId;
  while (parentId) {
    const parent = rowsById.get(parentId);
    if (!parent) {
      return null;
    }
    chain.push(parent);
    parentId = parent.parentCommentId;
    if (chain.length > rowsById.size) {
      return null;
    }
  }
  return chain;
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
  const readerFlagged = rows
    .filter((row) =>
      row.commentId !== threadId
      && isReaderFlagged(commentFlagsById?.get(row.commentId)))
    .sort(compareByKarmaThenDate);
  const readerFlaggedIds = new Set(readerFlagged.map((row) => row.commentId));
  const remaining = rows
    .filter((row) => row.commentId !== threadId && !readerFlaggedIds.has(row.commentId))
    .sort(compareByKarmaThenDate);

  const selectedIds = new Set<string>([threadId]);
  [...readerFlagged, ...remaining].forEach((row) => {
    if (selectedIds.has(row.commentId)) {
      return;
    }
    const chain = ancestorChain(row, rowsById);
    if (!chain) {
      return;
    }
    const missingAncestors = chain.filter((ancestor) => !selectedIds.has(ancestor.commentId));
    if (selectedIds.size + 1 + missingAncestors.length > maxComments) {
      return;
    }
    selectedIds.add(row.commentId);
    missingAncestors.forEach((ancestor) => selectedIds.add(ancestor.commentId));
  });

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

function aggregateThreadHistory(
  commentIds: string[],
  postHistoryById: Map<string, AiDigestPostHistory>,
): Pick<AiDigestThreadAnnotation, "previousDigestInclusionCount" | "lastIncludedAt"> {
  return commentIds.reduce(
    (aggregate, commentId) => {
      const history = postHistoryById.get(commentId);
      if (!history) {
        return aggregate;
      }
      return {
        previousDigestInclusionCount:
          aggregate.previousDigestInclusionCount + history.previousDigestInclusionCount,
        lastIncludedAt:
          !aggregate.lastIncludedAt
          || (history.lastIncludedAt && history.lastIncludedAt > aggregate.lastIncludedAt)
            ? history.lastIncludedAt
            : aggregate.lastIncludedAt,
      };
    },
    { previousDigestInclusionCount: 0, lastIncludedAt: null as string | null },
  );
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
  const annotations = rows.flatMap((row) => {
    const annotation = annotationsByCommentId.get(row.commentId);
    return annotation ? [annotation] : [];
  });
  return {
    threadId,
    participated: participatedPerRanking
      || annotations.some((annotation) => annotation.authoredByReader),
    hasActiveSeeLess: annotations.some((annotation) => annotation.hasActiveSeeLess),
    ...aggregateThreadHistory(rows.map((row) => row.commentId), postHistoryById),
  };
}

function groupRowsByThread(
  rows: AiDigestThreadCommentRow[],
): Map<string, AiDigestThreadCommentRow[]> {
  return rows.reduce((groups, row) => {
    const group = groups.get(row.threadId);
    if (group) {
      group.push(row);
    } else {
      groups.set(row.threadId, [row]);
    }
    return groups;
  }, new Map<string, AiDigestThreadCommentRow[]>());
}

export async function loadAiDigestThreadCandidates(
  user: DbUser,
  context: ResolverContext,
  options: LoadAiDigestThreadCandidatesOptions = {},
): Promise<AiDigestThreadCandidates> {
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? AI_DIGEST_DEFAULT_CANDIDATE_MAX_AGE_DAYS;
  const siteWideThreadLimit = options.siteWideThreadLimit ?? AI_DIGEST_SITE_WIDE_THREAD_LIMIT;
  const readerThreadLimit = options.readerThreadLimit ?? AI_DIGEST_READER_THREAD_LIMIT;
  const postHistoryById = options.postHistoryById ?? new Map<string, AiDigestPostHistory>();
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
  const readerRowsByThreadId = new Map<string, AiDigestReaderThreadRow>(
    readerRows.map((row) => [row.threadId, row]),
  );
  const allThreadIds = [
    ...siteWideThreadIds,
    ...dedupedReaderRows.map((row) => row.threadId),
  ];

  const commentRows = await context.repos.comments.getAiDigestThreadCommentRows({
    threadIds: allThreadIds,
    perThreadLimit: AI_DIGEST_THREAD_COMMENT_LOAD_LIMIT,
  });
  const annotations = await context.repos.comments.getAiDigestThreadCommentAnnotationRows({
    userId: user._id,
    commentIds: commentRows.map((row) => row.commentId),
  });
  const annotationsByCommentId = new Map(
    annotations.map((annotation) => [annotation.commentId, annotation]),
  );
  const rowsByThreadId = groupRowsByThread(commentRows);
  const commentFlagsById = new Map(
    annotations.map((annotation) => [
      annotation.commentId,
      toThreadCommentReaderFlags(annotation),
    ]),
  );

  const buildCards = (
    threadIds: string[],
    source: AiDigestThreadSource,
  ): AiDigestThreadCard[] =>
    threadIds.flatMap((threadId) => {
      const rows = rowsByThreadId.get(threadId) ?? [];
      const card = buildAiDigestThreadCard({
        threadId,
        source,
        rows,
        // Site-wide cards form the cacheable shared prompt prefix, so their
        // comment pre-selection must not depend on the reader.
        ...(source === "readerRelevant" ? { commentFlagsById } : {}),
      });
      return card ? [card] : [];
    });

  const siteWideThreads = buildCards(siteWideThreadIds, "siteWide");
  const readerThreads = buildCards(
    dedupedReaderRows.map((row) => row.threadId),
    "readerRelevant",
  );

  const cardCommentIds = new Set(
    [...siteWideThreads, ...readerThreads].flatMap((card) =>
      card.comments.map((comment) => comment.commentId)),
  );
  const cardCommentFlagsById = new Map(
    Array.from(commentFlagsById.entries()).filter(([commentId]) =>
      cardCommentIds.has(commentId)),
  );

  const threadAnnotationsById = new Map(
    [...siteWideThreads, ...readerThreads].map((card) => [
      card.threadId,
      buildAiDigestThreadAnnotation({
        threadId: card.threadId,
        rows: rowsByThreadId.get(card.threadId) ?? [],
        annotationsByCommentId,
        participatedPerRanking:
          readerRowsByThreadId.get(card.threadId)?.participated ?? false,
        postHistoryById,
      }),
    ]),
  );

  return {
    siteWideThreads,
    readerThreads,
    commentFlagsById: cardCommentFlagsById,
    threadAnnotationsById,
  };
}
