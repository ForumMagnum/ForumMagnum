import { UsersViews } from '@/lib/collections/users/views';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';

export interface ModerationNewUsersOptions {
  limit?: number | null;
  offset?: number | null;
  enableTotal?: boolean | null;
}

export async function getModerationNewUsers(context: ResolverContext, options: ModerationNewUsersOptions) {
  if (!userIsAdminOrMod(context.currentUser)) {
    throw new Error('Only admins and moderators can see the new user queue');
  }
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;
  if (limit < 0 || offset < 0) throw new Error('Queue limit and offset must be nonnegative');
  const { selector } = await viewTermsToQuery(UsersViews, { view: 'sunshineNewUsers' }, {}, context);
  const [users, totalCount] = await Promise.all([
    context.repos.users.getNewUsersByOldestUnreviewedPost(selector, limit, offset),
    options.enableTotal ? context.Users.find(selector).count() : undefined,
  ]);
  return {
    results: await accessFilterMultiple(context.currentUser, 'Users', users, context),
    totalCount,
  };
}
