import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { moderationGqlQueries } from '@/server/resolvers/moderationResolvers';
import { getPendingContentStats, getReviewGroupForUser } from '@/server/users/reviewQueue';
import { UNREVIEWED_POST } from '@/lib/collections/moderatorActions/constants';
import type { PendingContentStats } from '@/server/repos/UsersRepo';

// All database methods used below are mocked; no SQL connection is created.
jest.mock('@/server/sql/sqlClient', () => ({ getSqlClient: jest.fn(() => ({})) }));

describe('moderation queue pagination', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it('ranks the whole queue before limiting and reuses the ranking metadata for fields', async () => {
    const context = createAdminContext({ forumType: 'LessWrong' });
    const template = context.currentUser;
    if (!template) throw new Error('Expected a context user');
    const users = Array.from({ length: 105 }, (_, i): DbUser => ({
      ...template,
      _id: `post-${i}`,
      createdAt: new Date('2026-01-01'),
      sunshineFlagged: false,
      reviewedByUserId: null,
      postCount: 1,
      commentCount: 0,
      needsReview: true,
      banned: null,
    }));
    users.push(
      { ...users[0], _id: 'newer-comment' },
      { ...users[0], _id: 'oldest-comment' },
      { ...users[0], _id: 'flagged-post', sunshineFlagged: true },
    );
    const userCursor = context.Users.find({});
    jest.spyOn(context.Users, 'find').mockReturnValue(Object.assign(userCursor, {
      fetch: jest.fn().mockResolvedValue(users),
    }));
    const actionCursor = context.ModeratorActions.find({});
    const actions = jest.fn().mockResolvedValue(users.map(user => ({
      userId: user._id, type: UNREVIEWED_POST, createdAt: new Date('2026-01-01'), endedAt: null,
    })));
    jest.spyOn(context.ModeratorActions, 'find').mockReturnValue(Object.assign(actionCursor, { fetch: actions }));
    const stats = jest.spyOn(context.repos.users, 'getPendingContentStats').mockImplementation(async ids => ids.map((id): PendingContentStats => ({
      pendingPostCount: id.includes('comment') ? 0 : 1,
      pendingCommentCount: id.includes('comment') ? 1 : 0,
      oldestPendingContentAt: new Date(id === 'newer-comment' ? '2026-01-03' : '2026-01-02'),
      approvedContentCount: 0,
    })));
    const removed = jest.spyOn(context.repos.users, 'getLastRemovedFromReviewQueueAt').mockImplementation(async ids => ids.map(() => null));
    const rejected = jest.spyOn(context.repos.users, 'getRejectedContentCounts').mockImplementation(async ids => ids.map(() => 0));
    for (const user of users) context.loaders.Users.prime(user._id, user);

    const [first, next] = await Promise.all([
      moderationGqlQueries.supermodQueueUsers(undefined, { limit: 2 }, context),
      moderationGqlQueries.supermodQueueUsers(undefined, { limit: 1, offset: 2 }, context),
    ]);
    expect(first.results.map(user => user._id)).toEqual(['flagged-post', 'oldest-comment']);
    expect(next.results.map(user => user._id)).toEqual(['newer-comment']);
    expect(first.totalCount).toBe(108);
    expect(await getReviewGroupForUser(context, 'oldest-comment')).toBe('newContent');
    expect((await getPendingContentStats(context, 'oldest-comment')).pendingCommentCount).toBe(1);
    for (const query of [stats, removed, rejected, actions]) expect(query).toHaveBeenCalledTimes(1);
  });

  it('rejects non-moderators before reading queue data', async () => {
    const context = createAdminContext({ forumType: 'LessWrong', currentUser: null });
    const find = jest.spyOn(context.Users, 'find');
    await expect(moderationGqlQueries.supermodQueueUsers(undefined, { limit: 10 }, context)).rejects.toThrow('Only admins and moderators');
    expect(find).not.toHaveBeenCalled();
  });
});
