import moment from '@/lib/moment-timezone';
import countBy from 'lodash/countBy';
import groupBy from 'lodash/groupBy';
import keyBy from 'lodash/keyBy';
import meanBy from 'lodash/meanBy';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';
import { reviewTriggerModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { PostsViews } from '@/lib/collections/posts/views';
import { userGetDisplayName } from '@/lib/collections/users/helpers';
import { getReviewGroupDisplayName, getReviewGroupFromActions } from '@/lib/collections/users/reviewGroups';
import { UsersViews } from '@/lib/collections/users/views';
import { adminAccountSetting } from '@/lib/instanceSettings';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';
import { addPacificDays, PACIFIC_TZ, daysLateFromAge, groupDaysLate, type ModeratorCount, type SupermodStatusReport } from './supermodStatusFormat';

interface ReportUser extends Pick<DbUser,
  '_id' | 'displayName' | 'username' | 'fullName' | 'karma' | 'createdAt' |
  'needsReview' | 'reviewedByUserId' | 'banned' | 'deleted'
> {}

interface ReviewChange extends Pick<DbFieldChange, 'documentId' | 'userId' | 'createdAt'> {
  oldValue: unknown;
  newValue: unknown;
}

interface ReviewAction extends Pick<DbModeratorAction, 'type' | 'createdAt' | 'endedAt'> {}

interface UserReview {
  userId: string;
  actorId: string | null;
  handledAt: Date;
  queuedAt: Date | null;
  reviewGroup: ReviewGroup;
}

interface UserReviewEvent {
  createdAt: Date;
  clear?: ReviewChange;
}

interface UserReviewHistory {
  // undefined: outside the queue; null: queued, but the entry predates known history.
  queuedAt: Date | null | undefined;
  handled: UserReview[];
}

export interface SupermodStatusData {
  windowEnd: Date;
  siteUrl: string;
  adminTeamAccountId: string | null;
  usersById: Record<string, ReportUser>;
  moderatorsById: Record<string, ReportUser>;
  queuedUsers: Array<Date | null>;
  queuedPosts: Date[];
  userReviews: UserReview[];
  postReviews: ReviewChange[];
}

function isReviewEntry(change: ReviewChange): boolean {
  return change.newValue === true || change.newValue === 'true';
}

function isReviewClear(change: ReviewChange): boolean {
  return change.newValue === false || change.newValue === 'false';
}

function isPostReview(change: ReviewChange): boolean {
  return typeof change.newValue === 'string' && change.newValue.length > 0;
}

function documentIds(changes: ReviewChange[]): string[] {
  return [...new Set(changes.flatMap(change => change.documentId ? [change.documentId] : []))];
}

/** Repeated triggers don't restart a wait, and ending a trigger doesn't clear needsReview. */
export function getUserReviewHistory(
  user: ReportUser,
  actions: ReviewAction[],
  changes: ReviewChange[],
  windowEnd: Date,
): UserReviewHistory {
  const triggers = actions.filter(action => reviewTriggerModeratorActions.has(action.type)
    && (!action.endedAt || action.endedAt > action.createdAt));
  const events: UserReviewEvent[] = sortBy([
    ...triggers.map(action => ({ createdAt: action.createdAt })),
    ...changes.filter(isReviewEntry).map(change => ({ createdAt: change.createdAt })),
    ...changes.filter(isReviewClear).map(clear => ({ createdAt: clear.createdAt, clear })),
  ], 'createdAt');
  const firstClear = events[0]?.clear;
  const currentlyQueued = user.needsReview && !user.reviewedByUserId && !user.banned && !user.deleted;
  let queuedAt: Date | null | undefined = user.createdAt < windowEnd && (
    (!events.length && currentlyQueued) || firstClear?.oldValue === true || firstClear?.oldValue === 'true'
  ) ? null : undefined;
  let previousClear: Date | null = null;
  const handled: UserReview[] = [];

  for (const event of events) {
    if (event.createdAt >= windowEnd) break;
    if (!event.clear) {
      if (queuedAt === undefined) queuedAt = event.createdAt;
      continue;
    }
    if (event.clear.oldValue === true || event.clear.oldValue === 'true') {
      const actionsAtHandle = triggers.filter(action => action.createdAt <= event.createdAt).map(action => ({
        ...action,
        active: !action.endedAt || action.endedAt >= event.createdAt,
      }));
      handled.push({
        userId: user._id,
        actorId: event.clear.userId,
        handledAt: event.createdAt,
        queuedAt: queuedAt ?? null,
        reviewGroup: getReviewGroupFromActions(actionsAtHandle, previousClear),
      });
    }
    queuedAt = undefined;
    previousClear = event.createdAt;
  }
  return { queuedAt, handled };
}

function countModerators(actorIds: Array<string | null>, data: SupermodStatusData): ModeratorCount[] {
  const counts = countBy(actorIds.filter(id => id && id !== data.adminTeamAccountId));
  return Object.entries(counts).map(([userId, count]) => ({
    userId,
    displayName: userGetDisplayName(data.moderatorsById[userId]) || 'Unknown',
    count,
  }));
}

function handledDurations(data: SupermodStatusData, windowStart: Date) {
  return data.userReviews.flatMap(review => review.handledAt >= windowStart && review.queuedAt
    ? [{ ...review, durationMs: review.handledAt.getTime() - review.queuedAt.getTime() }]
    : []);
}

function queueCounts(entries: Array<Date | null>, windowStart: Date, windowEnd: Date) {
  return {
    leftover: entries.filter(entry => !entry || entry < windowStart).length,
    late: entries.filter(entry => entry && entry < windowStart
      && daysLateFromAge(windowEnd.getTime() - entry.getTime()) >= 2).length,
    newWaiting: entries.filter(entry => entry && entry >= windowStart).length,
  };
}

export function summarizeSupermodStatus(
  data: SupermodStatusData,
  windowStart: Date,
  offboardIds?: ReadonlySet<string>,
): SupermodStatusReport {
  const { windowEnd } = data;
  const users = queueCounts(data.queuedUsers, windowStart, windowEnd);
  const posts = queueCounts(data.queuedPosts, windowStart, windowEnd);
  const durations = handledDurations(data, windowStart);
  return {
    windowStart,
    windowEnd,
    usersHandled: countModerators(data.userReviews.filter(review => review.handledAt >= windowStart).map(review => review.actorId), data),
    postsReviewed: countModerators(data.postReviews.filter(review => review.createdAt >= windowStart).map(review => review.userId), data),
    remainingYesterdayUsers: users.leftover,
    remainingYesterdayUsersLate: users.late,
    remainingYesterdayPosts: posts.leftover,
    remainingYesterdayPostsLate: posts.late,
    newWaitingUsers: users.newWaiting,
    newWaitingPosts: posts.newWaiting,
    averageProcessTimeMs: durations.length ? meanBy(durations, 'durationMs') : null,
    longestHandled: offboardIds ? sortBy(durations, record => -record.durationMs).slice(0, 3).map(record => {
      const user = data.usersById[record.userId];
      const group = record.reviewGroup === 'newContent' && (user.karma < 0 || offboardIds.has(user._id))
        ? 'offboard' : record.reviewGroup;
      return {
        userId: user._id,
        displayName: userGetDisplayName(user) || 'Unknown',
        durationMs: record.durationMs,
        reviewGroupLabel: getReviewGroupDisplayName(group),
      };
    }) : [],
    daysLate: groupDaysLate(data.queuedUsers.flatMap(entry => entry ? [windowEnd.getTime() - entry.getTime()] : [])),
    siteUrl: data.siteUrl,
  };
}

/** Load overlapping activity windows and their common queue snapshot together. */
export async function getSupermodStatus(
  context: ResolverContext,
  windowEnd: Date,
): Promise<{
  daily: SupermodStatusReport;
  weekly?: { report: SupermodStatusReport; lastTwoMonths: SupermodStatusReport };
}> {
  const includeWeekly = moment.tz(windowEnd, PACIFIC_TZ).isoWeekday() === 1;
  const dailyStart = addPacificDays(windowEnd, -1);
  const twoMonthStart = addPacificDays(windowEnd, -60);
  const start = includeWeekly ? twoMonthStart : dailyStart;
  const [userQuery, postQuery, recentChanges] = await Promise.all([
    viewTermsToQuery(UsersViews, { view: 'sunshineNewUsers' }, undefined, context),
    viewTermsToQuery(PostsViews, { view: 'sunshineNewPosts' }, undefined, context),
    context.FieldChanges.find({
      fieldName: { $in: ['needsReview', 'reviewedByUserId'] },
      createdAt: { $gte: start },
    }).fetch(),
  ]);
  const clears = recentChanges.filter(change => change.fieldName === 'needsReview' && isReviewClear(change));
  const reviews = recentChanges.filter(change => change.fieldName === 'reviewedByUserId' && isPostReview(change));

  // Keep the view's eligibility rules, but historical work must survive the ban,
  // deletion, approval or snooze that resulted from handling the user.
  const historicalUserSelector = omit(userQuery.selector, ['needsReview', 'reviewedByUserId', 'banned', 'deleted']);
  const historicalPostSelector = omit(postQuery.selector, ['reviewedByUserId']);
  const [users, posts] = await Promise.all([
    context.Users.find({ $or: [userQuery.selector, { ...historicalUserSelector, _id: { $in: documentIds(clears) } }] }, {
      sort: userQuery.options.sort,
    }).fetch(),
    context.Posts.find({ $or: [postQuery.selector, { ...historicalPostSelector, _id: { $in: documentIds(reviews) } }] }).fetch(),
  ]);
  const userIds = users.map(user => user._id);
  const actorIds = [...new Set([...clears, ...reviews].flatMap(change => change.userId ? [change.userId] : []))];
  const [actions, userChanges, moderators] = await Promise.all([
    userIds.length ? context.ModeratorActions.find({
      userId: { $in: userIds },
      type: { $in: [...reviewTriggerModeratorActions] },
    }).fetch() : [],
    userIds.length ? context.FieldChanges.find({ documentId: { $in: userIds }, fieldName: 'needsReview' }).fetch() : [],
    actorIds.length ? context.Users.find({ _id: { $in: actorIds } }, {
      projection: { _id: 1, displayName: 1, username: 1, fullName: 1 },
    }).fetch() : [],
  ]);
  const actionsByUser = groupBy(actions, 'userId');
  const changesByUser = groupBy(userChanges, 'documentId');
  const histories = users.map(user => getUserReviewHistory(user, actionsByUser[user._id] ?? [], changesByUser[user._id] ?? [], windowEnd));
  const postChanges = groupBy(sortBy(recentChanges.filter(change => change.fieldName === 'reviewedByUserId'), 'createdAt'), 'documentId');
  const adminTeamAccountId = adminAccountSetting.get()?._id ?? null;
  const postsById = keyBy(posts, '_id');
  const data: SupermodStatusData = {
    windowEnd,
    siteUrl: getSiteUrl(),
    adminTeamAccountId,
    usersById: keyBy(users, '_id'),
    moderatorsById: keyBy(moderators, '_id'),
    // Match the inbox's 100-user page, applying its database sort only once.
    queuedUsers: histories.flatMap(history => history.queuedAt === undefined ? [] : [history.queuedAt]).slice(0, 100),
    queuedPosts: posts.flatMap(post => {
      const firstLaterChange = postChanges[post._id]?.find(change => change.createdAt >= windowEnd);
      const reviewerAtCutoff = firstLaterChange ? firstLaterChange.oldValue : post.reviewedByUserId;
      const queuedAt = post.postedAt ?? post.createdAt;
      return !reviewerAtCutoff && queuedAt < windowEnd ? [queuedAt] : [];
    }),
    userReviews: histories.flatMap(history => history.handled).filter(review => review.handledAt >= start),
    postReviews: reviews.filter(change => change.documentId && postsById[change.documentId] && change.createdAt < windowEnd
      && (!change.oldValue || (adminTeamAccountId && change.oldValue === adminTeamAccountId))),
  };
  const daily = summarizeSupermodStatus(data, dailyStart);
  if (!includeWeekly) return { daily };

  const longest = sortBy(handledDurations(data, twoMonthStart), record => -record.durationMs).slice(0, 3);
  const offboardIds = longest.length
    ? await context.repos.users.getOffboardCandidateUserIds(longest.map(record => record.userId))
    : [];
  return {
    daily,
    weekly: {
      report: summarizeSupermodStatus(data, addPacificDays(windowEnd, -7)),
      lastTwoMonths: summarizeSupermodStatus(data, twoMonthStart, new Set(offboardIds)),
    },
  };
}
