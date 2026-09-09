import {
  addPacificDays,
  formatAge,
  formatAverageProcessTime,
  formatDailySupermodMessage,
  formatModeratorCounts,
  formatWeeklyDateRange,
  formatWeeklySupermodMessage,
  getDailyWindow,
  getMostRecentPacificReportTime,
  groupDaysLate,
  pacificWallTimeToUtc,
  type SupermodStatusReport,
} from '../../../app/api/cron/supermod-status-to-slack/supermodStatusFormat';

describe('supermodStatusFormat', () => {
  it('uses today 9:30am Pacific as the daily window end after 9:30am', () => {
    // 16:45 UTC on 2026-03-20 is 9:45am PDT
    const now = new Date('2026-03-20T16:45:00.000Z');
    const { windowStart, windowEnd } = getDailyWindow(now);
    expect(windowEnd.toISOString()).toBe(pacificWallTimeToUtc(2026, 3, 20, 9, 30).toISOString());
    expect(windowStart.toISOString()).toBe(pacificWallTimeToUtc(2026, 3, 19, 9, 30).toISOString());
  });

  it('uses yesterday 9:30am Pacific when it is still before 9:30am', () => {
    // 16:00 UTC on 2026-03-20 is 9am PDT
    const now = new Date('2026-03-20T16:00:00.000Z');
    const windowEnd = getMostRecentPacificReportTime(now);
    expect(windowEnd.toISOString()).toBe(pacificWallTimeToUtc(2026, 3, 19, 9, 30).toISOString());
  });

  it('adds calendar days across Pacific DST', () => {
    // 2026-03-08 9:30am PST -> 2026-03-09 9:30am PDT is 23 hours
    const beforeDst = pacificWallTimeToUtc(2026, 3, 8, 9, 30);
    const afterDst = addPacificDays(beforeDst, 1);
    expect(afterDst.toISOString()).toBe(pacificWallTimeToUtc(2026, 3, 9, 9, 30).toISOString());
  });

  it('formats counts, ages, and averages', () => {
    expect(formatModeratorCounts([])).toBe('none');
    expect(formatModeratorCounts([
      { userId: '1', displayName: 'ruby', count: 5 },
      { userId: '2', displayName: 'habryka', count: 8 },
    ])).toBe('habryka: 8, ruby: 5');
    expect(formatAge((2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000))).toBe('2d 4h');
    expect(formatAverageProcessTime(1.4 * 24 * 60 * 60 * 1000)).toBe('1.4 days');
    expect(formatAverageProcessTime(11 * 60 * 60 * 1000)).toBe('11h');
  });

  it('groups days-late buckets from 2 days up, skipping empty days', () => {
    const day = 24 * 60 * 60 * 1000;
    expect(groupDaysLate([
      1.5 * day,
      2.1 * day,
      2.9 * day,
      3.2 * day,
      5.0 * day,
    ])).toEqual([
      { days: 2, count: 2 },
      { days: 3, count: 1 },
      { days: 5, count: 1 },
    ]);
  });

  it('formats the daily and weekly Slack messages', () => {
    const windowEnd = pacificWallTimeToUtc(2026, 3, 9, 9, 30);
    const windowStart = addPacificDays(windowEnd, -7);
    const report: SupermodStatusReport = {
      windowStart,
      windowEnd,
      usersHandled: [{ userId: '1', displayName: 'habryka', count: 8 }],
      postsReviewed: [{ userId: '2', displayName: 'ruby', count: 5 }],
      remainingYesterdayUsers: 90,
      remainingYesterdayUsersLate: 30,
      remainingYesterdayPosts: 2,
      remainingYesterdayPostsLate: 1,
      newWaitingUsers: 9,
      newWaitingPosts: 2,
      oldestUser: {
        displayName: 'Alice',
        userId: 'aliceId',
        reviewGroupLabel: 'new content',
        ageMs: (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000),
      },
      averageProcessTimeMs: 1.4 * 24 * 60 * 60 * 1000,
      maxProcessTimeMs: 6 * 24 * 60 * 60 * 1000,
      longestHandled: [],
      daysLate: [
        { days: 2, count: 3 },
        { days: 3, count: 1 },
        { days: 5, count: 1 },
      ],
      siteUrl: 'https://www.lesswrong.com/',
    };

    expect(formatDailySupermodMessage(report)).toContain("Yesterday's inbox: 90 users (30 late), 2 posts (1 late)");
    expect(formatDailySupermodMessage(report)).toContain('Users handled: habryka: 8');
    expect(formatDailySupermodMessage(report)).not.toContain('Remaining from yesterday');
    expect(formatDailySupermodMessage(report)).toContain("\n\nToday's inbox: 9 users, 2 posts");
    expect(formatDailySupermodMessage(report)).not.toContain('Oldest user');
    expect(formatDailySupermodMessage(report)).not.toContain('Oldest post');
    expect(formatDailySupermodMessage(report)).not.toContain('Resolved');

    expect(formatWeeklyDateRange(windowStart, windowEnd)).toBe('Mar 2–8');
    expect(formatWeeklySupermodMessage(report)).toContain('Posts: ruby: 5\n\nAvg time to process a user: 1.4 days');
    expect(formatWeeklySupermodMessage(report)).toContain('Avg time to process a user: 1.4 days');
    expect(formatWeeklySupermodMessage(report)).toContain('2 days late: 3 users');
    expect(formatWeeklySupermodMessage(report)).toContain('5 days late: 1 user');

    const lastTwoMonths: SupermodStatusReport = {
      ...report,
      windowStart: addPacificDays(windowEnd, -60),
      usersHandled: [{ userId: '1', displayName: 'habryka', count: 80 }],
      postsReviewed: [{ userId: '2', displayName: 'ruby', count: 50 }],
      averageProcessTimeMs: 1.8 * 24 * 60 * 60 * 1000,
      maxProcessTimeMs: (12 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000),
      longestHandled: [{
        displayName: 'Alice',
        userId: 'aliceId',
        durationMs: (12 * 24 * 60 * 60 * 1000) + (3 * 60 * 60 * 1000),
        reviewGroupLabel: 'Offboard?',
      }],
    };
    const weeklyWithTwoMonths = formatWeeklySupermodMessage(report, lastTwoMonths);
    expect(weeklyWithTwoMonths).toContain('*Last 2 months*');
    expect(weeklyWithTwoMonths).toContain('Users: habryka: 80');
    expect(weeklyWithTwoMonths).toContain('Posts: ruby: 50');
    expect(weeklyWithTwoMonths).toContain('Avg time to process a user: 1.8 days');
    expect(weeklyWithTwoMonths).toContain('<https://www.lesswrong.com/admin/supermod?user=aliceId|Alice> — 12d 3h — Offboard?');
  });
});
