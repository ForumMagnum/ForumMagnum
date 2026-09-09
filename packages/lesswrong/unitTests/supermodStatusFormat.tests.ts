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
  isSupermodReportTime,
  getWeeklyWindow,
  formatWeeklySupermodBlocks,
  type SupermodStatusReport,
} from '../../../app/api/cron/supermod-status-to-slack/supermodStatusFormat';

describe('supermodStatusFormat', () => {
  it('uses today 9:30am Pacific as the daily window end after 9:30am', () => {
    // 16:45 UTC on 2026-03-20 is 9:45am PDT
    const now = new Date('2026-03-20T16:45:00.000Z');
    const { windowStart, windowEnd } = getDailyWindow(now);
    expect(windowEnd.toISOString()).toBe('2026-03-20T16:30:00.000Z');
    expect(windowStart.toISOString()).toBe('2026-03-19T16:30:00.000Z');
  });

  it('uses yesterday 9:30am Pacific when it is still before 9:30am', () => {
    // 16:00 UTC on 2026-03-20 is 9am PDT
    const now = new Date('2026-03-20T16:00:00.000Z');
    const windowEnd = getMostRecentPacificReportTime(now);
    expect(windowEnd.toISOString()).toBe('2026-03-19T16:30:00.000Z');
  });

  it.each([
    ['2026-03-07T17:30:00Z', '2026-03-08T16:30:00.000Z', 23],
    ['2026-10-31T16:30:00Z', '2026-11-01T17:30:00.000Z', 25],
  ])('adds a Pacific calendar day across DST from %s', (start, expected, hours) => {
    const before = new Date(start);
    const after = addPacificDays(before, 1);
    expect(after.toISOString()).toBe(expected);
    expect(after.getTime() - before.getTime()).toBe(hours * 60 * 60 * 1000);
    expect(getDailyWindow(after).windowStart).toEqual(before);
  });

  it.each([
    ['2026-09-07T16:30:00Z', true],
    ['2026-09-07T17:30:00Z', false],
    ['2026-12-07T16:30:00Z', false],
    ['2026-12-07T17:30:00Z', true],
    ['2026-12-07T17:35:00Z', true],
  ])('gates the UTC cron candidate %s', (now, expected) => {
    expect(isSupermodReportTime(new Date(now))).toBe(expected);
  });

  it('ends the winter weekly report on Monday morning', () => {
    const { windowStart, windowEnd } = getWeeklyWindow(new Date('2026-12-07T17:30:00Z'));
    expect(windowEnd.toISOString()).toBe('2026-12-07T17:30:00.000Z');
    expect(windowStart.toISOString()).toBe('2026-11-30T17:30:00.000Z');
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
    const windowEnd = new Date('2026-03-09T16:30:00Z');
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
      averageProcessTimeMs: 1.4 * 24 * 60 * 60 * 1000,
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
    expect(formatWeeklySupermodBlocks(report, lastTwoMonths)[1]).toMatchObject({
      type: 'table',
      rows: [
        [{ text: 'Most late' }, { text: 'Wait' }, { text: 'Tab' }],
        [{ type: 'rich_text', elements: [{ elements: [{ type: 'link', text: 'Alice' }] }] }, { text: '12d 3h' }, { text: 'Offboard?' }],
      ],
    });
    expect(weeklyWithTwoMonths).toContain('<https://www.lesswrong.com/admin/supermod?user=aliceId|Alice> — 12d 3h — Offboard?');
  });
});
