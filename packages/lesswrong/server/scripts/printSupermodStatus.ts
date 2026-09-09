/* eslint-disable no-console */
import { reviewTriggerModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { getModeratorActionGroup, getReviewGroupFromActions } from '@/lib/collections/users/reviewGroups';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { postMessage } from '@/server/slack/client';
import { getLongestHandledUsers, getSupermodStatus } from '../../../../app/api/cron/supermod-status-to-slack/getSupermodStatus';
import {
  formatAge,
  formatDailySupermodMessage,
  formatWeeklySupermodBlocks,
  formatWeeklySupermodMessage,
  getDailyWindow,
  getTwoMonthWindow,
  getWeeklyWindow,
  type SupermodStatusReport,
} from '../../../../app/api/cron/supermod-status-to-slack/supermodStatusFormat';

const PROD_SITE_URL = 'https://www.lesswrong.com/';

async function loadStatus(windowStart: Date, windowEnd: Date): Promise<SupermodStatusReport> {
  const context = createAnonymousContext();
  const report = await getSupermodStatus(context, windowStart, windowEnd);
  report.siteUrl = PROD_SITE_URL;
  return report;
}

async function loadReplay(now: Date, weekly: boolean): Promise<{
  windowStart: Date;
  windowEnd: Date;
  report: SupermodStatusReport;
  lastTwoMonths?: SupermodStatusReport;
}> {
  const { windowStart, windowEnd } = weekly ? getWeeklyWindow(now) : getDailyWindow(now);
  if (!weekly) {
    return { windowStart, windowEnd, report: await loadStatus(windowStart, windowEnd) };
  }
  const twoMonths = getTwoMonthWindow(windowEnd);
  const [report, lastTwoMonths] = await Promise.all([
    loadStatus(windowStart, windowEnd),
    loadStatus(twoMonths.windowStart, twoMonths.windowEnd),
  ]);
  return { windowStart, windowEnd, report, lastTwoMonths };
}

export async function printSupermodDailyAsOfThisMorning() {
  const { windowStart, windowEnd, report } = await loadReplay(new Date('2026-09-08T16:45:00.000Z'), false);
  const message = formatDailySupermodMessage(report);
  console.log(`Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);
  console.log(message);
  return message;
}

export async function printSupermodWeeklyAsOfThisMorning() {
  // Monday 9:30am PT window (weekly cron day), replayed after that 9:30am.
  const { windowStart, windowEnd, report, lastTwoMonths } = await loadReplay(new Date('2026-09-07T16:45:00.000Z'), true);
  const message = formatWeeklySupermodMessage(report, lastTwoMonths);
  console.log(`Window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);
  console.log(message);
  return message;
}

async function postToModeration(label: string, text: string, blocks?: ReturnType<typeof formatWeeklySupermodBlocks>) {
  console.log(text);
  await postMessage({
    text,
    channelName: 'moderation',
    options: { mrkdwn: true, unfurl_links: false, unfurl_media: false, blocks },
  });
  console.log(`Posted ${label} to #moderation`);
}

export async function postSupermodDailyAsOfThisMorning() {
  const { report } = await loadReplay(new Date('2026-09-08T16:45:00.000Z'), false);
  await postToModeration('daily supermod status', formatDailySupermodMessage(report));
}

export async function printLongestTwoMonthTabs() {
  const { windowEnd } = getWeeklyWindow(new Date('2026-09-07T16:45:00.000Z'));
  const { windowStart } = getTwoMonthWindow(windowEnd);
  const context = createAnonymousContext();
  const longest = await getLongestHandledUsers(context, windowStart, windowEnd, 3);
  const tabName: Record<string, string> = {
    newContent: 'New Content',
    offboard: 'Offboard?',
    highContext: 'High Context',
    maybeSpam: 'Maybe Spam',
    automod: 'Automod',
    snoozeExpired: 'Snooze Expired',
    unknown: 'Unknown',
  };

  for (const row of longest) {
    const user = await context.Users.findOne({ _id: row.userId });
    const [actions, needsReviewChanges] = await Promise.all([
      context.ModeratorActions.find({ userId: row.userId }).fetch(),
      context.FieldChanges.find({ documentId: row.userId, fieldName: 'needsReview' }).fetch(),
    ]);
    const previousClearTs = needsReviewChanges
      .filter(change => (change.newValue === false || change.newValue === 'false') && new Date(change.createdAt).getTime() < row.handledAt.getTime())
      .map(change => new Date(change.createdAt).getTime())
      .reduce((max, ts) => Math.max(max, ts), 0);
    const previousClear = previousClearTs > 0 ? new Date(previousClearTs) : null;
    const asOfHandle = actions
      .filter(action => reviewTriggerModeratorActions.has(action.type))
      .filter(action => new Date(action.createdAt).getTime() <= row.handledAt.getTime())
      .map(action => {
        const endedAt = action.endedAt ? new Date(action.endedAt).getTime() : null;
        return {
          type: action.type,
          createdAt: action.createdAt,
          active: endedAt === null || endedAt >= row.handledAt.getTime(),
        };
      });
    let group = getReviewGroupFromActions(asOfHandle, previousClear);
    const offboardIds = user && group === 'newContent'
      ? await context.repos.users.getOffboardCandidateUserIds([user._id])
      : [];
    if (user && group === 'newContent' && (user.karma < 0 || offboardIds.includes(user._id))) {
      group = 'offboard';
    }
    const fresh = asOfHandle.filter(action => action.active && new Date(action.createdAt).getTime() > (previousClear?.getTime() ?? 0));
    console.log([
      `${row.displayName}: ${tabName[group] ?? group}`,
      `  karma now: ${user?.karma ?? 'n/a'}`,
      `  fresh triggers: ${fresh.map(action => `${action.type} (${getModeratorActionGroup(action.type)})`).join(', ') || 'none'}`,
    ].join('\n'));
  }
}

export async function printLongestTwoMonthHandled() {
  const { windowEnd } = getWeeklyWindow(new Date('2026-09-07T16:45:00.000Z'));
  const { windowStart } = getTwoMonthWindow(windowEnd);
  const context = createAnonymousContext();
  const longest = await getLongestHandledUsers(context, windowStart, windowEnd, 3);
  const handlerIds = longest.map(row => row.handledByUserId).filter((id): id is string => !!id);
  const handlers = handlerIds.length
    ? await context.Users.find({ _id: { $in: handlerIds } }, { projection: { _id: 1, displayName: 1, username: 1, fullName: 1 } }).fetch()
    : [];
  const handlerNames = new Map(handlers.map(user => [user._id, user.displayName || user.username || 'Unknown']));
  for (const [index, row] of longest.entries()) {
    console.log([
      `${index + 1}. ${row.displayName}${row.username ? ` (@${row.username})` : ''} ${row.userId}`,
      `   wait: ${formatAge(row.durationMs)}`,
      `   entered: ${row.queuedAt.toISOString()}`,
      `   handled: ${row.handledAt.toISOString()} by ${row.handledByUserId ? (handlerNames.get(row.handledByUserId) || row.handledByUserId) : 'unknown'}`,
    ].join('\n'));
  }
  return longest;
}

export async function postSupermodWeeklyAsOfThisMorning() {
  const { report, lastTwoMonths } = await loadReplay(new Date('2026-09-07T16:45:00.000Z'), true);
  await postToModeration(
    'weekly supermod status',
    formatWeeklySupermodMessage(report, lastTwoMonths),
    formatWeeklySupermodBlocks(report, lastTwoMonths),
  );
}
