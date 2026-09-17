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

export async function getOldestUnreviewedPostAt(context: ResolverContext, userId: string): Promise<Date | null> {
  return getWithCustomLoader(context, 'oldestUnreviewedPostAt', userId, async (userIds) => {
    const posts = await context.Posts.find({
      ...unreviewedUserPostSelector,
      userId: { $in: userIds },
    }, { sort: { postedAt: 1 } }, { userId: 1, postedAt: 1 }).fetch();
    const dates = new Map<string, Date>();
    for (const post of posts) {
      if (!dates.has(post.userId)) dates.set(post.userId, post.postedAt);
    }
    return userIds.map(id => dates.get(id) ?? null);
  });
}
