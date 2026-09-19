import { postStatuses } from '@/lib/collections/posts/constants';

// What counts as a user's content still waiting for moderator review. Shared
// between the oldestUnreviewedContentAt field resolver and the SQL that orders
// the new user queue by it, so the two never disagree.

export const unreviewedUserPostSelector: MongoSelector<DbPost> = {
  reviewedByUserId: null,
  rejected: { $ne: true },
  status: { $ne: postStatuses.STATUS_DELETED },
  isFuture: { $ne: true },
  shortform: { $ne: true },
  groupId: null,
  // Moderators still see previously published posts after the author deletes
  // the draft. Include those, but never expose drafts that were never published.
  $or: [{ draft: false }, { wasEverUndrafted: true }],
};

export const unreviewedUserCommentSelector: MongoSelector<DbComment> = {
  // Approval clears this flag without setting reviewedByUserId.
  authorIsUnreviewed: true,
  reviewedByUserId: null,
  rejected: { $ne: true },
  // Deleted comments remain visible to moderators, just like published posts.
  draft: false,
};
