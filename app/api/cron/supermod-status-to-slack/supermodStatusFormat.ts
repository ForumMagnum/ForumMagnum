import moment from '@/lib/moment-timezone';
import type { Block, RichTextBlock, SectionBlock } from '@slack/web-api';

export const PACIFIC_TZ = 'America/Los_Angeles';
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface ModeratorCount {
  userId: string;
  displayName: string;
  count: number;
}

export interface DaysLateBucket {
  days: number;
  count: number;
}

export interface LongestHandledUser {
  displayName: string;
  userId: string;
  durationMs: number;
  reviewGroupLabel: string;
}

export interface SupermodStatusReport {
  windowStart: Date;
  windowEnd: Date;
  usersHandled: ModeratorCount[];
  postsReviewed: ModeratorCount[];
  remainingYesterdayUsers: number;
  remainingYesterdayUsersLate: number;
  remainingYesterdayPosts: number;
  remainingYesterdayPostsLate: number;
  newWaitingUsers: number;
  newWaitingPosts: number;
  averageProcessTimeMs: number | null;
  longestHandled: LongestHandledUser[];
  daysLate: DaysLateBucket[];
  siteUrl: string;
}

export function getMostRecentPacificReportTime(now: Date): Date {
  const reportTime = moment.tz(now, PACIFIC_TZ).startOf('day').hour(9).minute(30);
  if (reportTime.isAfter(now)) reportTime.subtract(1, 'day');
  return reportTime.toDate();
}

// Vercel invokes both UTC candidates; only the one at 9:30 Pacific should send.
export function isSupermodReportTime(now: Date): boolean {
  const localTime = moment.tz(now, PACIFIC_TZ);
  return localTime.hour() === 9 && localTime.minute() >= 30;
}

export function addPacificDays(reportTime: Date, days: number): Date {
  return moment.tz(reportTime, PACIFIC_TZ).add(days, 'days').toDate();
}

export function getDailyWindow(now: Date): { windowStart: Date; windowEnd: Date } {
  const windowEnd = getMostRecentPacificReportTime(now);
  return { windowStart: addPacificDays(windowEnd, -1), windowEnd };
}

export function getWeeklyWindow(now: Date): { windowStart: Date; windowEnd: Date } {
  const windowEnd = getMostRecentPacificReportTime(now);
  return { windowStart: addPacificDays(windowEnd, -7), windowEnd };
}

export function getTwoMonthWindow(windowEnd: Date): { windowStart: Date; windowEnd: Date } {
  return { windowStart: addPacificDays(windowEnd, -60), windowEnd };
}

export function formatPacificDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: PACIFIC_TZ,
  });
}

export function formatWeeklyDateRange(windowStart: Date, windowEnd: Date): string {
  const lastInclusiveDay = addPacificDays(windowEnd, -1);
  const start = formatPacificDate(windowStart);
  const end = moment.tz(lastInclusiveDay, PACIFIC_TZ);
  if (moment.tz(windowStart, PACIFIC_TZ).isSame(end, 'month')) {
    return `${start}–${end.date()}`;
  }
  return `${start}–${formatPacificDate(lastInclusiveDay)}`;
}

export function formatAge(ageMs: number): string {
  const totalHours = Math.floor(ageMs / MS_PER_HOUR);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (totalHours > 0) {
    return `${totalHours}h`;
  }
  const minutes = Math.max(1, Math.floor(ageMs / (60 * 1000)));
  return `${minutes}m`;
}

export function formatAverageProcessTime(averageMs: number): string {
  const days = averageMs / MS_PER_DAY;
  if (days >= 1) {
    return `${Math.round(days * 10) / 10} days`;
  }
  const hours = averageMs / MS_PER_HOUR;
  return `${Math.round(hours * 10) / 10}h`;
}

export function formatModeratorCounts(counts: ModeratorCount[]): string {
  if (counts.length === 0) {
    return 'none';
  }
  const sorted = [...counts].sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));
  return sorted.map(entry => `${entry.displayName}: ${entry.count}`).join(', ');
}

export function daysLateFromAge(ageMs: number): number {
  return Math.floor(ageMs / MS_PER_DAY);
}

export function groupDaysLate(agesMs: number[]): DaysLateBucket[] {
  const counts = new Map<number, number>();
  for (const ageMs of agesMs) {
    const days = daysLateFromAge(ageMs);
    if (days < 2) continue;
    counts.set(days, (counts.get(days) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([days, count]) => ({ days, count }))
    .sort((a, b) => a.days - b.days);
}

function formatStackCount(total: number, late: number, singular: string, plural: string): string {
  const noun = total === 1 ? singular : plural;
  return `${total} ${noun} (${late} late)`;
}

export function formatDailySupermodMessage(report: SupermodStatusReport): string {
  const lines = [
    `*Supermod* (since yesterday 9:30am)`,
    `Yesterday's inbox: ${formatStackCount(report.remainingYesterdayUsers, report.remainingYesterdayUsersLate, 'user', 'users')}, ${formatStackCount(report.remainingYesterdayPosts, report.remainingYesterdayPostsLate, 'post', 'posts')}`,
    `Users handled: ${formatModeratorCounts(report.usersHandled)}`,
    `Posts reviewed: ${formatModeratorCounts(report.postsReviewed)}`,
    ``,
    `Today's inbox: ${report.newWaitingUsers} users, ${report.newWaitingPosts} ${report.newWaitingPosts === 1 ? 'post' : 'posts'}`,
  ];

  return lines.join('\n');
}

function formatAvgProcessTimeLine(averageProcessTimeMs: number | null): string {
  return `Avg time to process a user: ${averageProcessTimeMs === null ? 'n/a' : formatAverageProcessTime(averageProcessTimeMs)}`;
}

function supermodUserUrl(siteUrl: string, userId: string): string {
  const base = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
  return `${base}/admin/supermod?user=${userId}`;
}

function formatMostLateLines(users: LongestHandledUser[], siteUrl: string): string[] {
  if (users.length === 0) {
    return ['Most late: n/a'];
  }
  return [
    'Most late:',
    ...users.map(user => `<${supermodUserUrl(siteUrl, user.userId)}|${user.displayName}> — ${formatAge(user.durationMs)} — ${user.reviewGroupLabel}`),
  ];
}

interface SlackRawTextCell { type: 'raw_text'; text: string }
interface SlackTableBlock extends Block {
  type: 'table';
  column_settings: Array<{ align: 'left' | 'right' }>;
  rows: Array<Array<SlackRawTextCell | RichTextBlock>>;
}
export type SlackMessageBlock = SectionBlock | SlackTableBlock;

function rawCell(text: string): SlackRawTextCell {
  return { type: 'raw_text', text: text.length > 0 ? text : ' ' };
}

function linkCell(label: string, url: string): RichTextBlock {
  return {
    type: 'rich_text',
    elements: [{
      type: 'rich_text_section',
      elements: [{ type: 'link', url, text: label }],
    }],
  };
}

function slackSection(text: string): SectionBlock {
  return { type: 'section', text: { type: 'mrkdwn', text } };
}

export function formatWeeklySupermodMessage(
  report: SupermodStatusReport,
  lastTwoMonths?: SupermodStatusReport,
  options?: { includeMostLate?: boolean },
): string {
  const includeMostLate = options?.includeMostLate ?? true;
  const range = formatWeeklyDateRange(report.windowStart, report.windowEnd);
  const lines = [
    `*Supermod week* (${range})`,
    `Users: ${formatModeratorCounts(report.usersHandled)}`,
    `Posts: ${formatModeratorCounts(report.postsReviewed)}`,
    ``,
    formatAvgProcessTimeLine(report.averageProcessTimeMs),
  ];

  if (report.daysLate.length === 0) {
    lines.push('No users currently 2+ days late');
  } else {
    for (const bucket of report.daysLate) {
      const noun = bucket.count === 1 ? 'user' : 'users';
      lines.push(`${bucket.days} days late: ${bucket.count} ${noun}`);
    }
  }

  if (lastTwoMonths) {
    const twoMonthRange = formatWeeklyDateRange(lastTwoMonths.windowStart, lastTwoMonths.windowEnd);
    lines.push(
      ``,
      `*Last 2 months* (${twoMonthRange})`,
      `Users: ${formatModeratorCounts(lastTwoMonths.usersHandled)}`,
      `Posts: ${formatModeratorCounts(lastTwoMonths.postsReviewed)}`,
      ``,
      formatAvgProcessTimeLine(lastTwoMonths.averageProcessTimeMs),
    );
    if (includeMostLate) {
      lines.push(...formatMostLateLines(lastTwoMonths.longestHandled, lastTwoMonths.siteUrl));
    }
  }

  return lines.join('\n');
}

export function formatWeeklySupermodBlocks(
  report: SupermodStatusReport,
  lastTwoMonths?: SupermodStatusReport,
): SlackMessageBlock[] {
  const blocks: SlackMessageBlock[] = [
    slackSection(formatWeeklySupermodMessage(report, lastTwoMonths, { includeMostLate: false })),
  ];

  if (!lastTwoMonths) {
    return blocks;
  }
  if (lastTwoMonths.longestHandled.length === 0) {
    blocks.push(slackSection('Most late: n/a'));
    return blocks;
  }
  blocks.push({
    type: 'table',
    column_settings: [{ align: 'left' }, { align: 'right' }, { align: 'left' }],
    rows: [
      [rawCell('Most late'), rawCell('Wait'), rawCell('Tab')],
      ...lastTwoMonths.longestHandled.map(user => [
        linkCell(user.displayName, supermodUserUrl(lastTwoMonths.siteUrl, user.userId)),
        rawCell(formatAge(user.durationMs)),
        rawCell(user.reviewGroupLabel),
      ]),
    ],
  });
  return blocks;
}
