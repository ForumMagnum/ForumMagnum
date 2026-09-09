import { UNREVIEWED_COMMENT } from '@/lib/collections/moderatorActions/constants';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { getSupermodStatus } from '../../../app/api/cron/supermod-status-to-slack/getSupermodStatus';

jest.mock('@/server/repos', () => ({
  getAllRepos: () => ({ users: { getOffboardCandidateUserIds: jest.fn().mockResolvedValue([]) } }),
}));

function date(day: number): Date {
  return new Date(Date.UTC(2026, 8, day, 16, 30));
}

function cursor<T>(rows: T[]) {
  return { fetch: jest.fn().mockResolvedValue(rows) };
}

function setupReport() {
  const context = createAnonymousContext();
  const user = {
    _id: 'handled', displayName: 'Handled', username: 'handled', fullName: null, karma: 1,
    createdAt: date(1), needsReview: false, reviewedByUserId: 'moderator', banned: date(30), deleted: false,
  };
  const waiting = { ...user, _id: 'waiting', banned: null, needsReview: true, reviewedByUserId: null };
  const later = { ...waiting, _id: 'later' };
  const clear = {
    documentId: user._id, userId: 'moderator', fieldName: 'needsReview',
    createdAt: date(5), oldValue: true, newValue: false,
  };
  const review = {
    documentId: 'reviewedPost', userId: 'moderator', fieldName: 'reviewedByUserId',
    createdAt: date(5), oldValue: null, newValue: 'moderator',
  };
  const usersFind = jest.spyOn(context.Users, 'find').mockImplementation(jest.fn()
    .mockReturnValueOnce(cursor([user, waiting, later]))
    .mockReturnValueOnce(cursor([{ ...user, _id: 'moderator', displayName: 'Moderator' }])));
  const postsFind = jest.spyOn(context.Posts, 'find').mockImplementation(jest.fn().mockReturnValue(cursor([
    { _id: 'reviewedPost', postedAt: date(1), createdAt: date(1), reviewedByUserId: 'moderator' },
    { _id: 'waitingPost', postedAt: date(1), createdAt: date(1), reviewedByUserId: 'moderator' },
    { _id: 'laterPost', postedAt: date(10), createdAt: date(10), reviewedByUserId: null },
  ])));
  const changesFind = jest.spyOn(context.FieldChanges, 'find').mockImplementation(jest.fn()
    .mockReturnValueOnce(cursor([clear, review, { ...review, documentId: 'waitingPost', createdAt: date(10) }]))
    .mockReturnValueOnce(cursor([clear])));
  const actionsFind = jest.spyOn(context.ModeratorActions, 'find').mockImplementation(jest.fn().mockReturnValue(cursor([
    { userId: user._id, type: UNREVIEWED_COMMENT, createdAt: date(1), endedAt: null },
    { userId: waiting._id, type: UNREVIEWED_COMMENT, createdAt: date(2), endedAt: null },
    { userId: later._id, type: UNREVIEWED_COMMENT, createdAt: date(10), endedAt: null },
  ])));
  return { context, usersFind, postsFind, changesFind, actionsFind };
}

afterEach(() => jest.restoreAllMocks());

describe('loading supermod reports', () => {
  it('shares the queue and history queries across weekly and two-month reports', async () => {
    const { context, usersFind, postsFind, changesFind, actionsFind } = setupReport();
    const { report, lastTwoMonths } = await getSupermodStatus(context, date(6), date(9), date(1));
    expect(report.usersHandled).toEqual([]);
    expect(report.postsReviewed).toEqual([]);
    expect(report.remainingYesterdayUsers).toBe(1);
    expect(report.remainingYesterdayPosts).toBe(1);
    expect(report.newWaitingUsers).toBe(0);
    expect(report.newWaitingPosts).toBe(0);
    expect(lastTwoMonths?.usersHandled[0].count).toBe(1);
    expect(lastTwoMonths?.postsReviewed[0].count).toBe(1);
    expect(lastTwoMonths?.averageProcessTimeMs).toBe(4 * 24 * 60 * 60 * 1000);
    expect(lastTwoMonths?.longestHandled[0].userId).toBe('handled');
    expect(usersFind).toHaveBeenCalledTimes(2); // Candidate users, then moderator names.
    expect(postsFind).toHaveBeenCalledTimes(1);
    expect(changesFind).toHaveBeenCalledTimes(2); // Recent activity, then user history.
    expect(actionsFind).toHaveBeenCalledTimes(1);
    expect(context.repos.users.getOffboardCandidateUserIds).toHaveBeenCalledWith(['handled']);

    const userSelector = usersFind.mock.calls[0][0];
    expect(userSelector).toHaveProperty('$or.1._id.$in', ['handled']);
    expect(userSelector).not.toHaveProperty('$or.1.banned');
    expect(userSelector).not.toHaveProperty('$or.1.deleted');
    expect(userSelector).toHaveProperty('$or.1.$or'); // Preserve the view's recaptcha eligibility.
    const postSelector = postsFind.mock.calls[0][0];
    expect(postSelector).toHaveProperty('$or.1.status');
    expect(postSelector).toHaveProperty('$or.1.hiddenRelatedQuestion', false);
    expect(postSelector).toHaveProperty('$or.1.groupId');
    expect(postSelector).not.toHaveProperty('$or.1.reviewedByUserId');
  });

  it('does not load offboard candidates for a daily report', async () => {
    const { context } = setupReport();
    const { lastTwoMonths } = await getSupermodStatus(context, date(4), date(9));
    expect(lastTwoMonths).toBeUndefined();
    expect(context.repos.users.getOffboardCandidateUserIds).not.toHaveBeenCalled();
  });
});
