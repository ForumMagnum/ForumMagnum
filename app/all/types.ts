// Discriminated union for a single entry in the recent-activity feed.
// Posts and comments are intermixed and sorted by karma in the same list.
export type ActivityItem =
  | { kind: 'post'; post: PostsList; postedAt: Date; baseScore: number }
  | { kind: 'comment'; comment: CommentsListWithParentMetadata; postedAt: Date; baseScore: number };

// User-selectable sort modes for an ActivityBucket.
export type ActivitySortBy = 'top' | 'new' | 'old' | 'magic';
