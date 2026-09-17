import DataLoader from "dataloader";
import { getAdjustedReviewGroupCounts, getUserQueueTabCount } from '@/components/sunshineDashboard/supermod/reviewGroupCounts';
import { UNREVIEWED_FIRST_POST } from '@/lib/collections/moderatorActions/constants';
import { getLastRemovedFromReviewQueueAt, getUserReviewGroup } from '@/lib/collections/users/reviewGroupResolvers';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import { getModerationUserQueueCounts } from '@/server/resolvers/moderationUserQueueCounts';

const counts = { newContent: 150, offboard: 10, highContext: 0, maybeSpam: 0, automod: 0, snoozeExpired: 0, unknown: 0 };
const user = { _id: 'queued', reviewGroup: 'newContent' as const, needsReview: true, banned: null, reviewedByUserId: null, signUpReCaptchaRating: null };

describe('Full moderation queue counts', () => {
  afterEach(() => jest.restoreAllMocks());
  test('keeps totals beyond the loaded page and adjusts removal, undo, and regrouping', () => {
    expect(getAdjustedReviewGroupCounts(counts, [user], [user])).toEqual(counts);
    expect(getAdjustedReviewGroupCounts(counts, [user], []).newContent).toBe(149);
    expect(getAdjustedReviewGroupCounts(counts, [user], [{ ...user, reviewGroup: 'offboard' }])).toEqual({ ...counts, newContent: 149, offboard: 11 });
    expect(getAdjustedReviewGroupCounts(counts, [user], [user]).newContent).toBe(150);
  });

  test('does not count deep-linked users outside the queue', () => {
    for (const other of [{ ...user, needsReview: false }, { ...user, banned: '2030-01-01' }, { ...user, signUpReCaptchaRating: 0 }]) {
      expect(getAdjustedReviewGroupCounts(counts, [other], [])).toEqual(counts);
    }
  });

  test('ignores GraphQL metadata when calculating the total', () => {
    const graphqlCounts = { __typename: 'ModerationUserQueueCounts', ...counts };
    const adjusted = getAdjustedReviewGroupCounts(graphqlCounts, [user], []);
    expect(Object.values(adjusted).reduce((sum, count) => sum + count, 0)).toBe(159);
  });

  test('splits full queue totals into fetched and remaining users, excluding unrelated direct links', () => {
    const loadedUsers = Array.from({ length: 100 }, (_, index) => ({ ...user, _id: `loaded${index}` }));
    const withDirectUser = [...loadedUsers, { ...user, _id: 'outside', needsReview: false }];
    expect(getUserQueueTabCount(150, withDirectUser, 'newContent')).toEqual({ fetched: 100, remaining: 50 });
    expect(getUserQueueTabCount(160, withDirectUser, 'all')).toEqual({ fetched: 100, remaining: 60 });
    expect(getUserQueueTabCount(10, withDirectUser, 'offboard')).toEqual({ fetched: 0, remaining: 10 });
    expect(getUserQueueTabCount(0, withDirectUser, 'unknown')).toEqual({ fetched: 0, remaining: 0 });
    const afterRemoval = loadedUsers.slice(1);
    const adjusted = getAdjustedReviewGroupCounts(counts, loadedUsers, afterRemoval);
    expect(getUserQueueTabCount(adjusted.newContent, afterRemoval, 'newContent')).toEqual({ fetched: 99, remaining: 50 });
  });

  test('loads the latest removal for every user in one batch', async () => {
    const context = createAdminContext();
    const first = new Date('2026-01-02');
    const second = new Date('2026-01-01');
    const find = jest.spyOn(context.FieldChanges, 'find');
    jest.spyOn(context.FieldChanges, 'executeReadQuery').mockImplementation(async (_query, data) => [
        { documentId: 'first', createdAt: first },
        { documentId: 'second', createdAt: second },
      ].slice(0, data?.options?.limit ?? 2));
    expect(await Promise.all([
      getLastRemovedFromReviewQueueAt(context, 'first'),
      getLastRemovedFromReviewQueueAt(context, 'second'),
    ])).toEqual([first, second]);
    expect(find).toHaveBeenCalledTimes(1);
    find.mockRestore();
  });

  test('counts every matching user, including users beyond the first 100', async () => {
    const context = createAdminContext();
    const users = Array.from({ length: 151 }, (_, index) => ({ _id: `user${index}`, karma: index === 0 ? -1 : 0 }));
    const find = jest.spyOn(context.Users, 'find');
    jest.spyOn(context.Users, 'executeReadQuery').mockResolvedValue(users);
    jest.spyOn(context.FieldChanges, 'executeReadQuery').mockResolvedValue([]);
    jest.spyOn(context.ModeratorActions, 'executeReadQuery').mockResolvedValue([
      { userId: 'user0', type: UNREVIEWED_FIRST_POST, createdAt: new Date(), endedAt: null },
      { userId: 'user1', type: UNREVIEWED_FIRST_POST, createdAt: new Date(), endedAt: null },
    ]);
    context.extraLoaders.offboardCandidates = new DataLoader(async (ids: readonly string[]) => ids.map(() => false));
    expect(await getModerationUserQueueCounts(context)).toEqual({
      newContent: 1, offboard: 1, highContext: 0, maybeSpam: 0, automod: 0, snoozeExpired: 0, unknown: 149,
    });
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ needsReview: true, banned: null }), {}, { _id: 1, karma: 1 });
    expect(await getUserReviewGroup(context, users[0])).toBe('offboard');
    expect(await getUserReviewGroup(context, users[1])).toBe('newContent');
  });

  test('requires moderator access before reading queue data', async () => {
    const context = createAdminContext({ currentUser: null });
    await expect(getModerationUserQueueCounts(context)).rejects.toThrow('Only admins and moderators');
  });
});
