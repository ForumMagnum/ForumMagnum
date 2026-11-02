import { useMemo, useState } from 'react';
import keyBy from 'lodash/keyBy';
import sortBy from 'lodash/sortBy';
import type { CommentTreeNode } from '@/lib/utils/unflatten';
import { timeDecayedScore } from '@/lib/scoring';
import { useCurrentTime } from '@/lib/utils/timeUtil';

export interface PingbacksInComments {
  pingbacks: readonly PingbackFragment[],
  commentsView: CommentsViewName | "default",
}

export interface PingbackWithSourcePost extends PingbackFragment {
  sourcePost: NonNullable<PingbackFragment['sourcePost']>,
}

export interface PingbackListEntry {
  pingback: PingbackWithSourcePost,
}

export type CommentsListEntry = CommentTreeNode<CommentsList> | PingbackListEntry;

/**
 * How pingbacks rank against top-level comments under a comment sort. Higher
 * keys come first.
 */
interface PingbackOrdering {
  getCommentKey: (comment: CommentsList) => number,
  getPingbackKey: (pingback: PingbackWithSourcePost, now: Date) => number,
}

const getTime = (date: string) => new Date(date).getTime();

const byBaseScore: PingbackOrdering = {
  getCommentKey: comment => comment.baseScore ?? 0,
  getPingbackKey: pingback => pingback.baseScore,
};

const pingbackOrderingsByCommentView: Partial<Record<CommentsViewName | "default", PingbackOrdering>> = {
  postCommentsMagic: {
    getCommentKey: comment => comment.score,
    getPingbackKey: (pingback, now) => timeDecayedScore(pingback.baseScore, new Date(pingback.sourcePost.postedAt), now),
  },
  postCommentsTop: byBaseScore,
  postCommentsBest: byBaseScore,
  postLWComments: byBaseScore,
  afPostCommentsTop: {
    getCommentKey: comment => comment.afBaseScore ?? 0,
    getPingbackKey: pingback => pingback.afBaseScore ?? 0,
  },
  postCommentsNew: {
    getCommentKey: comment => getTime(comment.postedAt),
    getPingbackKey: pingback => getTime(pingback.sourcePost.postedAt),
  },
  postCommentsOld: {
    getCommentKey: comment => -getTime(comment.postedAt),
    getPingbackKey: pingback => -getTime(pingback.sourcePost.postedAt),
  },
  postCommentsRecentReplies: {
    getCommentKey: comment => getTime(comment.lastSubthreadActivity ?? comment.postedAt),
    getPingbackKey: pingback => getTime(pingback.sourcePost.postedAt),
  },
};

const PINGBACK_TIER = 1;

// Drafts and pinned comments stay above pingbacks, and deleted comments below.
function getCommentTier(comment: CommentsList): number {
  if (comment.draft || comment.promoted) return 0;
  if (comment.deleted) return 2;
  return PINGBACK_TIER;
}

function hasSourcePost(pingback: PingbackFragment): pingback is PingbackWithSourcePost {
  return !!pingback.sourcePost;
}

function pingbackPrecedesComment(pingback: PingbackWithSourcePost, comment: CommentsList, ordering: PingbackOrdering, now: Date): boolean {
  const commentTier = getCommentTier(comment);
  if (commentTier !== PINGBACK_TIER) {
    return PINGBACK_TIER < commentTier;
  }
  return ordering.getPingbackKey(pingback, now) > ordering.getCommentKey(comment);
}

/**
 * Merges pingbacks into a list of top-level comments, which is already sorted
 * by `commentsView`, without reordering the comments. Under sorts that don't
 * rank pingbacks (eg, the admin-only deleted comments sort), adds none.
 *
 * Comments stay where they loaded when someone votes on them, so pingbacks do
 * too: they're ranked by their data from when the set of pingbacks (or the
 * sort) last changed, and shown with their current data.
 */
export function useInterleavedPingbacks(
  commentTree: CommentTreeNode<CommentsList>[],
  pingbacksInComments: PingbacksInComments | undefined,
): CommentsListEntry[] {
  const now = useCurrentTime();
  const rankingKey = pingbacksInComments
    ? `${pingbacksInComments.commentsView}:${pingbacksInComments.pingbacks.map(pingback => pingback._id).join(",")}`
    : null;
  const [ranking, setRanking] = useState({ key: rankingKey, pingbacksInComments, now });
  if (ranking.key !== rankingKey) {
    setRanking({ key: rankingKey, pingbacksInComments, now });
  }

  return useMemo(() => {
    if (!pingbacksInComments || !ranking.pingbacksInComments) {
      return commentTree;
    }
    const { pingbacks, commentsView } = ranking.pingbacksInComments;
    const currentPingbacksById = keyBy(pingbacksInComments.pingbacks.filter(hasSourcePost), pingback => pingback._id);
    return interleavePingbacks(commentTree, pingbacks, commentsView, ranking.now).map(entry =>
      isPingbackListEntry(entry) ? { pingback: currentPingbacksById[entry.pingback._id] } : entry
    );
  }, [commentTree, pingbacksInComments, ranking]);
}

function interleavePingbacks(
  commentTree: CommentTreeNode<CommentsList>[],
  pingbacks: readonly PingbackFragment[],
  commentsView: CommentsViewName | "default",
  now: Date,
): CommentsListEntry[] {
  const ordering = pingbackOrderingsByCommentView[commentsView];
  if (!ordering) {
    return commentTree;
  }
  const sortedPingbacks = sortBy(
    pingbacks.filter(hasSourcePost),
    pingback => -ordering.getPingbackKey(pingback, now),
  );

  const entries: CommentsListEntry[] = [];
  let nextPingbackIndex = 0;
  for (const commentNode of commentTree) {
    while (
      nextPingbackIndex < sortedPingbacks.length
      && pingbackPrecedesComment(sortedPingbacks[nextPingbackIndex], commentNode.item, ordering, now)
    ) {
      entries.push({ pingback: sortedPingbacks[nextPingbackIndex] });
      nextPingbackIndex++;
    }
    entries.push(commentNode);
  }
  const remainingPingbacks = sortedPingbacks.slice(nextPingbackIndex).map(pingback => ({ pingback }));
  return [...entries, ...remainingPingbacks];
}

export function isPingbackListEntry(entry: CommentsListEntry): entry is PingbackListEntry {
  return 'pingback' in entry;
}
