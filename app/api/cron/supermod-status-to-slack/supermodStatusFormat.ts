export const PACIFIC_TZ = 'America/Los_Angeles';
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export interface ModeratorCount {
  userId: string;
  displayName: string;
  count: number;
}

export interface OldestUserInfo {
  displayName: string;
  userId: string;
  reviewGroupLabel: string;
  ageMs: number;
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
  oldestUser: OldestUserInfo | null;
  averageProcessTimeMs: number | null;
  maxProcessTimeMs: number | null;
  longestHandled: LongestHandledUser[];
  daysLate: DaysLateBucket[];
  siteUrl: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function getPacificYmd(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value);
  return { year: num('year'), month: num('month'), day: num('day') };
}

export const REPORT_HOUR = 9;
export const REPORT_MINUTE = 30;

export function pacificWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): Date {
  const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
  const time = `${pad2(hour)}:${pad2(minute)}:00`;
  const asPst = new Date(`${ymd}T${time}-08:00`);
  const hourInPacific = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TZ,
    hour: 'numeric',
    hour12: false,
  }).format(asPst));
  const normalizedHour = hourInPacific === 24 ? 0 : hourInPacific;
  if (normalizedHour === hour) {
    return asPst;
  }
  return new Date(`${ymd}T${time}-07:00`);
}

export function getMostRecentPacificReportTime(now: Date): Date {
  const { year, month, day } = getPacificYmd(now);
  const todayReportTime = pacificWallTimeToUtc(year, month, day, REPORT_HOUR, REPORT_MINUTE);
  if (now.getTime() >= todayReportTime.getTime()) {
    return todayReportTime;
  }
  const previousCalendarDay = new Date(todayReportTime.getTime() - (12 * MS_PER_HOUR));
  const ymd = getPacificYmd(previousCalendarDay);
  return pacificWallTimeToUtc(ymd.year, ymd.month, ymd.day, REPORT_HOUR, REPORT_MINUTE);
}

export function addPacificDays(pacificReportTime: Date, days: number): Date {
  const ymd = getPacificYmd(pacificReportTime);
  const utcAnchor = Date.UTC(ymd.year, ymd.month - 1, ymd.day, 20);
  const shifted = new Date(utcAnchor + (days * MS_PER_DAY));
  const next = getPacificYmd(shifted);
  return pacificWallTimeToUtc(next.year, next.month, next.day, REPORT_HOUR, REPORT_MINUTE);
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
  const startYmd = getPacificYmd(windowStart);
  const endYmd = getPacificYmd(lastInclusiveDay);
  if (startYmd.month === endYmd.month && startYmd.year === endYmd.year) {
    return `${start}–${endYmd.day}`;
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

type SlackRawTextCell = { type: 'raw_text'; text: string };
type SlackRichTextCell = {
  type: 'rich_text';
  elements: Array<{
    type: 'rich_text_section';
    elements: Array<{ type: 'link'; url: string; text: string } | { type: 'text'; text: string }>;
  }>;
};
type SlackTableCell = SlackRawTextCell | SlackRichTextCell;
type SlackTableBlock = {
  type: 'table';
  column_settings?: Array<{ align?: 'left' | 'center' | 'right'; is_wrapped?: boolean }>;
  rows: SlackTableCell[][];
};
type SlackSectionBlock = { type: 'section'; text: { type: 'mrkdwn'; text: string } };
export type SlackMessageBlock = SlackSectionBlock | SlackTableBlock;

function rawCell(text: string): SlackRawTextCell {
  return { type: 'raw_text', text: text.length > 0 ? text : ' ' };
}

function linkCell(label: string, url: string): SlackRichTextCell {
  return {
    type: 'rich_text',
    elements: [{
      type: 'rich_text_section',
      elements: [{ type: 'link', url, text: label }],
    }],
  };
}

function slackSection(text: string): SlackSectionBlock {
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
