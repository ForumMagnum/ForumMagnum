import { useMemo } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { RecentActivityPostsQuery, RecentActivityCommentsQuery } from './queries';
import type { ActivityItem } from './types';

// Smaller batch fetched eagerly so something renders quickly.
const INITIAL_FETCH_LIMIT = 7;
// Larger batch fetched after first paint, so "load more" already has data.
const BACKGROUND_FETCH_LIMIT = 30;

export interface BucketWindowArgs {
  after: string;
  before: string;
  secondaryReady: boolean;
}

// Two-stage fetch for posts: small batch first, then a larger background batch.
function useBucketPosts({after, before, secondaryReady}: BucketWindowArgs) {
  const selector = useMemo(() => ({ top: { after, before } }), [after, before]);
  const initial = useQuery(RecentActivityPostsQuery, { variables: { selector, limit: INITIAL_FETCH_LIMIT } });
  const background = useQuery(RecentActivityPostsQuery, { variables: { selector, limit: BACKGROUND_FETCH_LIMIT }, skip: !secondaryReady });
  const results = background.data?.posts?.results ?? initial.data?.posts?.results ?? [];
  return { results, isInitialLoading: initial.loading && !initial.data };
}

// Two-stage fetch for comments, same shape as useBucketPosts.
function useBucketComments({after, before, secondaryReady}: BucketWindowArgs) {
  const selector = useMemo(() => ({ allRecentComments: { sortBy: 'top', after, before } }), [after, before]);
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

// Merge post and comment results into a single karma-sorted list of ActivityItems.
function buildKarmaSortedItems(posts: readonly PostsList[], comments: readonly CommentsListWithParentMetadata[]): ActivityItem[] {
  const postItems = posts.map(toPostActivityItem).filter(isPresent);
  const commentItems = comments.map(toCommentActivityItem).filter(isPresent);
  return [...postItems, ...commentItems].sort(compareByBaseScoreDesc);
}

// One-call entry point for an ActivityBucket: returns the karma-sorted feed and loading state.
export function useActivityBucketItems(args: BucketWindowArgs) {
  const posts = useBucketPosts(args);
  const comments = useBucketComments(args);
  const items = useMemo(
    () => buildKarmaSortedItems(posts.results, comments.results),
    [posts.results, comments.results],
  );
  return { items, isInitialLoading: posts.isInitialLoading || comments.isInitialLoading };
}
