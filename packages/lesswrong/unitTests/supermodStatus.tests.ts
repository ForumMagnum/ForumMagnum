import { UNREVIEWED_COMMENT, MANUAL_NEEDS_REVIEW } from '@/lib/collections/moderatorActions/constants';
import { getUserReviewHistory, summarizeSupermodStatus, type SupermodStatusData } from '../../../app/api/cron/supermod-status-to-slack/getSupermodStatus';

const user = {
  _id: 'user', displayName: 'User', username: 'user', fullName: null, karma: 1,
  createdAt: new Date('2026-08-01T00:00:00Z'), needsReview: true,
  reviewedByUserId: null, banned: null, deleted: false,
};
const moderator = { ...user, _id: 'moderator', displayName: 'Moderator' };
const day = 24 * 60 * 60 * 1000;

function date(dayOfMonth: number): Date {
  return new Date(Date.UTC(2026, 8, dayOfMonth, 16, 30));
}

function trigger(dayOfMonth: number, endedAt: Date | null = null): Pick<DbModeratorAction, 'type' | 'createdAt' | 'endedAt'> {
  return { type: UNREVIEWED_COMMENT, createdAt: date(dayOfMonth), endedAt };
}

function clear(dayOfMonth: number) {
  return { documentId: user._id, userId: moderator._id, createdAt: date(dayOfMonth), oldValue: true, newValue: false };
}

function reportData(history: { queuedAt: Date | null | undefined; handled: SupermodStatusData['userReviews'] }): SupermodStatusData {
  return {
    windowEnd: date(9), siteUrl: 'https://www.lesswrong.com/', adminTeamAccountId: 'automod',
    usersById: { [user._id]: user }, moderatorsById: { [moderator._id]: moderator },
    queuedUsers: history.queuedAt === undefined ? [] : [history.queuedAt],
    queuedPosts: [], userReviews: history.handled, postReviews: [],
  };
}

describe('supermod queue history', () => {
  it('preserves the first entry when more comments arrive', () => {
    const history = getUserReviewHistory(user, [trigger(4), trigger(1)], [], date(9));
    expect(history.queuedAt).toEqual(date(1));
    const report = summarizeSupermodStatus(reportData(history), date(3));
    expect(report.remainingYesterdayUsers).toBe(1);
    expect(report.remainingYesterdayUsersLate).toBe(1);
    expect(report.newWaitingUsers).toBe(0);
    expect(report.daysLate).toEqual([{ days: 8, count: 1 }]);
  });

  it('keeps completed episodes when the user later re-enters the queue', () => {
    const history = getUserReviewHistory(user, [trigger(6), trigger(1)], [clear(5), clear(8)], date(9));
    expect(history.handled.map(review => review.queuedAt)).toEqual([date(1), date(6)]);
    expect(history.queuedAt).toBeUndefined();
    const report = summarizeSupermodStatus(reportData(history), date(1), new Set());
    expect(report.usersHandled).toEqual([{ userId: moderator._id, displayName: 'Moderator', count: 2 }]);
    expect(report.averageProcessTimeMs).toBe(3 * day);
    expect(report.longestHandled.map(review => review.durationMs)).toEqual([4 * day, 2 * day]);
  });

  it.each([
    { ...user, banned: date(30) },
    { ...user, deleted: true },
  ])('credits work even when handling bans or deletes the user', (handledUser) => {
    const history = getUserReviewHistory(handledUser, [trigger(1)], [clear(5)], date(9));
    const report = summarizeSupermodStatus(reportData(history), date(1));
    expect(report.usersHandled[0].count).toBe(1);
    expect(report.averageProcessTimeMs).toBe(4 * day);
  });

  it('excludes arrivals at or after the snapshot cutoff', () => {
    for (const arrival of [9, 10]) {
      const history = getUserReviewHistory(user, [trigger(arrival)], [], date(9));
      expect(history.queuedAt).toBeUndefined();
      expect(summarizeSupermodStatus(reportData(history), date(8)).remainingYesterdayUsers).toBe(0);
    }
  });

  it('preserves an earlier queue episode across clearances after the cutoff', () => {
    const history = getUserReviewHistory(user, [trigger(1), trigger(11)], [clear(10)], date(9));
    expect(history.queuedAt).toEqual(date(1));
    expect(history.handled).toEqual([]);
  });

  it('does not reset a queue entry when its triggering action expires', () => {
    const history = getUserReviewHistory(user, [trigger(1, date(2)), trigger(4)], [clear(5)], date(9));
    expect(history.handled[0].queuedAt).toEqual(date(1));
  });

  it('does not let later triggers change the tab of a completed review', () => {
    const laterFlag = { type: MANUAL_NEEDS_REVIEW, createdAt: date(6), endedAt: null } satisfies Pick<DbModeratorAction, 'type' | 'createdAt' | 'endedAt'>;
    const history = getUserReviewHistory(user, [trigger(1), laterFlag], [clear(5)], date(9));
    expect(history.handled[0].reviewGroup).toBe('newContent');
  });

  it('uses explicit field-change entries when there is no moderator action', () => {
    const entry = { ...clear(1), oldValue: false, newValue: true };
    const history = getUserReviewHistory(user, [], [entry, clear(5)], date(9));
    expect(history.handled[0].queuedAt).toEqual(date(1));
  });

  it('keeps unknown ages out of duration statistics without dropping handled credit', () => {
    const history = getUserReviewHistory(user, [], [clear(5)], date(9));
    const report = summarizeSupermodStatus(reportData(history), date(1));
    expect(report.usersHandled[0].count).toBe(1);
    expect(report.averageProcessTimeMs).toBeNull();
    expect(getUserReviewHistory(user, [], [], date(9)).queuedAt).toBeNull();
  });

  it('does not count clearing an already-cleared flag as handling a user', () => {
    const history = getUserReviewHistory(user, [], [{ ...clear(5), oldValue: false }], date(9));
    expect(history.handled).toEqual([]);
    expect(history.queuedAt).toBeUndefined();
  });

  it('aggregates overlapping windows from the same records', () => {
    const history = getUserReviewHistory(user, [trigger(1), trigger(6)], [clear(5), clear(8)], date(9));
    const data = reportData(history);
    expect(summarizeSupermodStatus(data, date(6)).usersHandled[0].count).toBe(1);
    expect(summarizeSupermodStatus(data, date(1)).usersHandled[0].count).toBe(2);
    expect(summarizeSupermodStatus(data, date(6)).averageProcessTimeMs).toBe(2 * day);
  });
});
