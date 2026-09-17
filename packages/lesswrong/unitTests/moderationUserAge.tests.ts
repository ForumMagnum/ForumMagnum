import * as sqlClient from "@/server/sql/sqlClient";
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { getOldestUnreviewedContentAt } from '@/lib/collections/users/oldestUnreviewedContent';
import { getModerationNewUsers } from '@/server/resolvers/moderationNewUsers';

const mockSqlClient = { any: jest.fn() };
jest.mock('@/server/sql/sqlClient', () => ({
  getSqlClient: () => mockSqlClient,
}));

describe('New user queue age', () => {
  beforeEach(() => {
    mockSqlClient.any.mockReset();
    jest.spyOn(createAdminContext().Comments, 'executeReadQuery').mockResolvedValue([]);
  });
  afterEach(() => jest.restoreAllMocks());

  test('loads the oldest pending post for each user in one batch, with no per-batch limit', async () => {
    const context = createAdminContext();
    const oldest = new Date('2026-01-01');
    const newer = new Date('2026-01-03');
    const find = jest.spyOn(context.Posts, 'find');
    jest.spyOn(context.Posts, 'executeReadQuery').mockResolvedValue([
      { userId: 'first', postedAt: oldest },
      { userId: 'first', postedAt: newer },
      { userId: 'second', postedAt: newer },
    ]);
    expect(await Promise.all(['first', 'second', 'empty'].map(id => getOldestUnreviewedContentAt(context, id))))
      .toEqual([oldest, newer, null]);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      reviewedByUserId: null, rejected: { $ne: true },
      $or: [{ draft: false }, { wasEverUndrafted: true }],
    }), { sort: { postedAt: 1 } }, expect.anything());
  });

  test('uses the oldest pending content across posts and comments, including comment-only users', async () => {
    const context = createAdminContext();
    const older = new Date('2025-12-01');
    const newer = new Date('2026-01-01');
    jest.spyOn(context.Posts, 'executeReadQuery').mockResolvedValue([
      { userId: 'commentFirst', postedAt: newer },
      { userId: 'postFirst', postedAt: older },
    ]);
    jest.spyOn(context.Comments, 'executeReadQuery').mockResolvedValue([
      { userId: 'commentFirst', postedAt: older },
      { userId: 'commentOnly', postedAt: older },
      { userId: 'postFirst', postedAt: newer },
    ]);
    const find = jest.spyOn(context.Comments, 'find');
    expect(await Promise.all(['commentFirst', 'postFirst', 'commentOnly', 'empty']
      .map(id => getOldestUnreviewedContentAt(context, id))))
      .toEqual([older, older, older, null]);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      authorIsUnreviewed: true,
      reviewedByUserId: null,
      rejected: { $ne: true },
      draft: false,
    }), { sort: { postedAt: 1 } }, expect.anything());
  });

  test('includes previously published deleted drafts in the maximum waiting age', async () => {
    const context = createAdminContext();
    const twelveDaysAgo = new Date('2026-09-04T22:12:29.268Z');
    const find = jest.spyOn(context.Posts, 'find');
    jest.spyOn(context.Posts, 'executeReadQuery').mockResolvedValue([
      { userId: 'author', postedAt: twelveDaysAgo },
      { userId: 'author', postedAt: new Date('2026-09-07T04:40:38.970Z') },
      { userId: 'author', postedAt: new Date('2026-09-09T05:33:16.370Z') },
    ]);
    expect(await getOldestUnreviewedContentAt(context, 'author')).toEqual(twelveDaysAgo);
    const [selector] = find.mock.calls[0];
    expect(selector).not.toHaveProperty('deletedDraft');
    expect(selector).toHaveProperty('$or', [{ draft: false }, { wasEverUndrafted: true }]);

    const query = jest.spyOn(sqlClient.getSqlClient(), 'any').mockResolvedValue([]);
    await context.repos.users.getNewUsersByOldestUnreviewedContent({ needsReview: true }, 10, 0);
    expect(query.mock.calls[0][0]).not.toContain('"deletedDraft"');
  });

  test('orders by the oldest post or comment before pagination and puts users without pending content last', async () => {
    const context = createAdminContext();
    const query = jest.spyOn(sqlClient.getSqlClient(), 'any').mockResolvedValue([]);
    await context.repos.users.getNewUsersByOldestUnreviewedContent({ needsReview: true }, 10, 20);
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, args] = query.mock.calls[0];
    expect(sql).toContain('MIN("postedAt")');
    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('FROM "Comments"');
    expect(sql).toContain('"authorIsUnreviewed" IS TRUE');
    expect(sql).toMatch(/ORDER BY pending\."oldestUnreviewedContentAt" ASC NULLS LAST,[\s\S]*LIMIT \$\d+ OFFSET \$\d+/);
    expect(sql).toContain('"reviewedByUserId" IS NULL');
    expect(sql).toContain('"wasEverUndrafted"');
    expect(args).toEqual(expect.arrayContaining([10, 20]));
  });

  test('passes pagination to the sorted query while counting the whole queue', async () => {
    const context = createAdminContext();
    const ordered = jest.spyOn(context.repos.users, 'getNewUsersByOldestUnreviewedContent').mockResolvedValue([]);
    const count = jest.spyOn(context.Users, 'executeReadQuery').mockResolvedValue([{ count: '150' }]);
    expect(await getModerationNewUsers(context, { limit: 10, offset: 20, enableTotal: true }))
      .toEqual({ results: [], totalCount: 150 });
    expect(ordered).toHaveBeenCalledWith(expect.objectContaining({ needsReview: true, banned: null }), 10, 20);
    expect(count).toHaveBeenCalledTimes(1);
  });

  test('requires moderator access before fetching users', async () => {
    await expect(getModerationNewUsers(createAdminContext({ currentUser: null }), {}))
      .rejects.toThrow('Only admins and moderators');
  });
});
