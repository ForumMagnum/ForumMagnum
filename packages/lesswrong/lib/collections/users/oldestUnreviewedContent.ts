import { getWithCustomLoader } from '@/lib/loaders';
import { postStatuses } from '@/lib/collections/posts/constants';

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

export async function getOldestUnreviewedContentAt(context: ResolverContext, userId: string): Promise<Date | null> {
  return getWithCustomLoader(context, 'oldestUnreviewedContentAt', userId, async (userIds) => {
    const [posts, comments] = await Promise.all([
      context.Posts.find({
        ...unreviewedUserPostSelector,
        userId: { $in: userIds },
      }, { sort: { postedAt: 1 } }, { userId: 1, postedAt: 1 }).fetch(),
      context.Comments.find({
        ...unreviewedUserCommentSelector,
        userId: { $in: userIds },
      }, { sort: { postedAt: 1 } }, { userId: 1, postedAt: 1 }).fetch(),
    ]);
    const dates = new Map<string, Date>();
    for (const content of [...posts, ...comments]) {
      const oldest = dates.get(content.userId);
      if (!oldest || content.postedAt < oldest) dates.set(content.userId, content.postedAt);
    }
    return userIds.map(id => dates.get(id) ?? null);
  });
}
