import { UsersViews } from '@/lib/collections/users/views';
import { getUserReviewGroup } from '@/lib/collections/users/reviewGroupResolvers';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';

export async function getModerationUserQueueCounts(context: ResolverContext): Promise<Record<ReviewGroup, number>> {
  if (!userIsAdminOrMod(context.currentUser)) {
    throw new Error('Only admins and moderators can see moderation queue counts');
  }
  const { selector } = await viewTermsToQuery(UsersViews, { view: 'sunshineNewUsers' }, {}, context);
  // Only fetch the fields needed for classification, without the view's pagination.
  // The shared classifier batches moderator actions, removal history, and offboard checks.
  const users = await context.Users.find(selector, {}, { _id: 1, karma: 1 }).fetch();
  const groups = await Promise.all(users.map(user => getUserReviewGroup(context, user)));
  const counts = { newContent: 0, offboard: 0, highContext: 0, maybeSpam: 0, automod: 0, snoozeExpired: 0, unknown: 0 };
  for (const group of groups) counts[group]++;
  return counts;
}
