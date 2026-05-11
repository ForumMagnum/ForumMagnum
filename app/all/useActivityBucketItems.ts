import { useMemo } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { RecentActivityPostsQuery, RecentActivityCommentsQuery } from './queries';
import type { ActivityItem, ActivitySortBy } from './types';

// Smaller batch fetched eagerly so something renders quickly.
const INITIAL_FETCH_LIMIT = 7;
// Larger batch fetched after first paint, so "load more" already has data.
const BACKGROUND_FETCH_LIMIT = 30;

export interface BucketWindowArgs {
  after: string;
  before: string;
  secondaryReady: boolean;
  sortBy: ActivitySortBy;
}

// Build the post selector for the given sort mode. Posts use one named view per
// sort mode (top/new/old), all of which accept the same after/before window.
function buildPostSelector(sortBy: ActivitySortBy, after: string, before: string) {
  if (sortBy === 'new') return { new: { after, before } };
  if (sortBy === 'old') return { old: { after, before } };
  return { top: { after, before } };
}

// Two-stage fetch for posts: small batch first, then a larger background batch.
function useBucketPosts({after, before, secondaryReady, sortBy}: BucketWindowArgs) {
  const selector = useMemo(() => buildPostSelector(sortBy, after, before), [sortBy, after, before]);
  const initial = useQuery(RecentActivityPostsQuery, { variables: { selector, limit: INITIAL_FETCH_LIMIT } });
  const background = useQuery(RecentActivityPostsQuery, { variables: { selector, limit: BACKGROUND_FETCH_LIMIT }, skip: !secondaryReady });
  const results = background.data?.posts?.results ?? initial.data?.posts?.results ?? [];
  return { results, isInitialLoading: initial.loading && !initial.data };
}

// Two-stage fetch for comments, same shape as useBucketPosts.
function useBucketComments({after, before, secondaryReady, sortBy}: BucketWindowArgs) {
  const selector = useMemo(() => ({ allRecentComments: { sortBy, after, before } }), [sortBy, after, before]);
  const initial = useQuery(RecentActivityCommentsQuery, { variables: { selector, limit: INITIAL_FETCH_LIMIT } });
  const background = useQuery(RecentActivityCommentsQuery, { variables: { selector, limit: BACKGROUND_FETCH_LIMIT }, skip: !secondaryReady });
  const results = background.data?.comments?.results ?? initial.data?.comments?.results ?? [];
  return { results, isInitialLoading: initial.loading && !initial.data };
}

// Wraps a post in the ActivityItem shape, or returns null if it lacks a timestamp.
function toPostActivityItem(post: PostsList): ActivityItem | null {
  if (!post.postedAt) return null;
  return { kind: 'post', post, postedAt: new Date(post.postedAt), baseScore: post.baseScore ?? 0 };
}

// Wraps a comment in the ActivityItem shape, dropping comments we can't link to a parent.
function toCommentActivityItem(comment: CommentsListWithParentMetadata): ActivityItem | null {
  if (!comment.postedAt) return null;
  // Skip comments whose parent post/tag we don't have access to; matches RecentComments.tsx
  if (!comment.post?._id && !comment.tag?._id) return null;
  return { kind: 'comment', comment, postedAt: new Date(comment.postedAt), baseScore: comment.baseScore ?? 0 };
}

function isPresent<T>(item: T | null): item is T {
  return item !== null;
}

// Highest-karma items appear first.
function compareByBaseScoreDesc(a: ActivityItem, b: ActivityItem): number {
  return b.baseScore - a.baseScore;
}

// Most recent first.
function compareByPostedAtDesc(a: ActivityItem, b: ActivityItem): number {
  return b.postedAt.getTime() - a.postedAt.getTime();
}

// Oldest first.
function compareByPostedAtAsc(a: ActivityItem, b: ActivityItem): number {
  return a.postedAt.getTime() - b.postedAt.getTime();
}

function getMergedSortComparator(sortBy: ActivitySortBy): (a: ActivityItem, b: ActivityItem) => number {
  if (sortBy === 'new') return compareByPostedAtDesc;
  if (sortBy === 'old') return compareByPostedAtAsc;
  return compareByBaseScoreDesc;
}

// Merge post and comment results into a single list, sorted to match the chosen mode.
function buildSortedItems(
  posts: readonly PostsList[],
  comments: readonly CommentsListWithParentMetadata[],
  sortBy: ActivitySortBy,
): ActivityItem[] {
  const postItems = posts.map(toPostActivityItem).filter(isPresent);
  const commentItems = comments.map(toCommentActivityItem).filter(isPresent);
  return [...postItems, ...commentItems].sort(getMergedSortComparator(sortBy));
}

// One-call entry point for an ActivityBucket: returns the sorted feed and loading state.
export function useActivityBucketItems(args: BucketWindowArgs) {
  const posts = useBucketPosts(args);
  const comments = useBucketComments(args);
  const items = useMemo(
    () => buildSortedItems(posts.results, comments.results, args.sortBy),
    [posts.results, comments.results, args.sortBy],
  );
  return { items, isInitialLoading: posts.isInitialLoading || comments.isInitialLoading };
}
