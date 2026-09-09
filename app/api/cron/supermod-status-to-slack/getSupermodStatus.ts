import { reviewTriggerModeratorActions } from '@/lib/collections/moderatorActions/constants';
import { isActionActive } from '@/lib/collections/moderatorActions/helpers';
import { PostsViews } from '@/lib/collections/posts/views';
import { spamRiskScoreThreshold, userGetDisplayName } from '@/lib/collections/users/helpers';
import { getReviewGroupFromActions, REVIEW_GROUP_TO_PRIORITY } from '@/lib/collections/users/reviewGroups';
import { UsersViews } from '@/lib/collections/users/views';
import { adminAccountSetting } from '@/lib/instanceSettings';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';
import {
  daysLateFromAge,
  groupDaysLate,
  type LongestHandledUser,
  type ModeratorCount,
  type OldestUserInfo,
  type SupermodStatusReport,
} from './supermodStatusFormat';

const REVIEW_GROUP_LABEL: Record<keyof typeof REVIEW_GROUP_TO_PRIORITY, string> = {
  newContent: 'New Content',
  offboard: 'Offboard?',
  highContext: 'High Context',
  maybeSpam: 'Maybe Spam',
  automod: 'Automod',
  snoozeExpired: 'Snooze Expired',
  unknown: 'Unknown',
};

const NEEDS_REVIEW_FALSE = [false, 'false'];
const NEEDS_REVIEW_TRUE = [true, 'true'];

function isTruthyJsonValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== false && value !== 'false' && value !== '';
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function asId(value: string | null | undefined): string | null {
  return value ?? null;
}

function uniqueDocumentIds(changes: Array<{ documentId: string | null }>): string[] {
  return [...new Set(changes.map(change => change.documentId).filter((id): id is string => !!id))];
}

function countByModerator(
  actorIds: Array<string | null | undefined>,
  namesById: Map<string, string>,
  skipActorIds: Set<string>,
): ModeratorCount[] {
  const counts = new Map<string, number>();
  for (const actorId of actorIds) {
    if (!actorId || skipActorIds.has(actorId)) continue;
    counts.set(actorId, (counts.get(actorId) ?? 0) + 1);
  }
  return [...counts.entries()].map(([userId, count]) => ({
    userId,
    displayName: namesById.get(userId) || 'Unknown',
    count,
  }));
}

async function loadDisplayNames(context: ResolverContext, userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const names = new Map<string, string>();
  if (uniqueIds.length === 0) return names;

  const users = await context.Users.find(
    { _id: { $in: uniqueIds } },
    { projection: { _id: 1, displayName: 1, username: 1, fullName: 1 } },
  ).fetch();

  for (const user of users) {
    names.set(user._id, userGetDisplayName(user) || user.username || 'Unknown');
  }
  return names;
}

function matchesSunshineNewUsersView(user: DbUser): boolean {
  if (!user.needsReview || user.reviewedByUserId || user.banned || user.deleted) {
    return false;
  }
  return appearsInSupermodUserInbox(user);
}

function appearsInSupermodUserInbox(user: Pick<DbUser, 'banned' | 'deleted' | 'signUpReCaptchaRating'>): boolean {
  if (user.deleted || user.banned) {
    return false;
  }
  const rating = user.signUpReCaptchaRating;
  return rating == null || rating > spamRiskScoreThreshold * 1.25;
}

function looksLikeSupermodPost(post: DbPost): boolean {
  return !post.draft
    && !post.unlisted
    && !post.isFuture
    && !post.shortform
    && !post.authorIsUnreviewed
    && post.rejected !== true;
}

function isSupermodPostReview(change: DbFieldChange, post: DbPost, adminTeamAccountId: string | null): boolean {
  if (!looksLikeSupermodPost(post)) {
    return false;
  }
  if (!isTruthyJsonValue(change.oldValue)) {
    return true;
  }
  return !!adminTeamAccountId && String(change.oldValue) === adminTeamAccountId;
}

const SUPERMOD_USER_INBOX_LIMIT = 100;

function compareSunshineNewUsers(a: DbUser, b: DbUser): number {
  if (Number(!!b.sunshineFlagged) !== Number(!!a.sunshineFlagged)) {
    return Number(!!b.sunshineFlagged) - Number(!!a.sunshineFlagged);
  }
  const postDiff = (b.postCount ?? 0) - (a.postCount ?? 0);
  if (postDiff !== 0) return postDiff;
  const commentDiff = (b.commentCount ?? 0) - (a.commentCount ?? 0);
  if (commentDiff !== 0) return commentDiff;
  const recaptchaDiff = (b.signUpReCaptchaRating ?? -1) - (a.signUpReCaptchaRating ?? -1);
  if (recaptchaDiff !== 0) return recaptchaDiff;
  return (asDate(b.createdAt)?.getTime() ?? 0) - (asDate(a.createdAt)?.getTime() ?? 0);
}

async function fetchQueueUsers(context: ResolverContext): Promise<DbUser[]> {
  const parameters = await viewTermsToQuery(
    UsersViews,
    { view: 'sunshineNewUsers', limit: SUPERMOD_USER_INBOX_LIMIT } as UsersViewTerms,
    undefined,
    context,
  );
  const users = await context.Users.find(parameters.selector, {
    sort: parameters.options?.sort,
    limit: SUPERMOD_USER_INBOX_LIMIT,
  }).fetch();
  return users
    .filter(user => user.needsReview && matchesSunshineNewUsersView(user))
    .sort(compareSunshineNewUsers)
    .slice(0, SUPERMOD_USER_INBOX_LIMIT);
}

async function fetchQueuePosts(context: ResolverContext): Promise<DbPost[]> {
  const parameters = await viewTermsToQuery(
    PostsViews,
    { view: 'sunshineNewPosts', limit: 10000 } as PostsViewTerms,
    undefined,
    context,
  );
  return await context.Posts.find(parameters.selector).fetch();
}

async function fetchFieldChangesInWindow(
  context: ResolverContext,
  fieldName: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<DbFieldChange[]> {
  return await context.FieldChanges.find({
    fieldName,
    createdAt: { $gte: windowStart, $lt: windowEnd },
  }).fetch();
}

function lastEnteredFromActions(
  actions: Array<Pick<DbModeratorAction, 'type' | 'endedAt' | 'createdAt'>>,
  lastRemovedFromReviewQueueAt: Date | null,
  options?: { requireActive?: boolean },
): Date | null {
  const requireActive = options?.requireActive ?? true;
  const afterTs = lastRemovedFromReviewQueueAt?.getTime() ?? 0;
  const timestamps = actions
    .filter(action => reviewTriggerModeratorActions.has(action.type))
    .filter(action => !requireActive || isActionActive(action))
    .map(action => asDate(action.createdAt))
    .filter((created): created is Date => !!created && created.getTime() > afterTs)
    .map(created => created.getTime());
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps));
}

function lastEnteredAt(
  actions: Array<Pick<DbModeratorAction, 'type' | 'endedAt' | 'createdAt'>>,
  lastRemovedFromReviewQueueAt: Date | null,
  enteredViaFieldChanges: Date[],
  before?: Date | null,
  options?: { requireActive?: boolean },
): Date | null {
  const beforeTs = before?.getTime() ?? Number.POSITIVE_INFINITY;
  const afterTs = lastRemovedFromReviewQueueAt?.getTime() ?? 0;
  const fromActions = lastEnteredFromActions(actions, lastRemovedFromReviewQueueAt, options);
  const candidates = [
    fromActions,
    ...enteredViaFieldChanges.filter(date => {
      const ts = date.getTime();
      return ts > afterTs && ts <= beforeTs;
    }),
  ].filter((date): date is Date => !!date && date.getTime() <= beforeTs);
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, date) => date.getTime() > latest.getTime() ? date : latest);
}

function reviewGroupLabelForUser(
  actions: Array<Pick<DbModeratorAction, 'type' | 'endedAt' | 'createdAt'>>,
  lastRemovedFromReviewQueueAt: Date | null,
): string {
  const withActive = actions.map(action => ({
    type: action.type,
    active: isActionActive(action),
    createdAt: action.createdAt,
  }));
  return REVIEW_GROUP_LABEL[getReviewGroupFromActions(withActive, lastRemovedFromReviewQueueAt)];
}

function previousClearBefore(
  clearsByUser: Map<string, Date[]>,
  userId: string,
  handledAt: Date,
): Date | null {
  const clears = clearsByUser.get(userId) ?? [];
  const earlier = clears.filter(clearAt => clearAt.getTime() < handledAt.getTime());
  if (earlier.length === 0) return null;
  return earlier.reduce((latest, clearAt) => clearAt.getTime() > latest.getTime() ? clearAt : latest);
}

function queuedAtForHandledUser(
  actions: DbModeratorAction[],
  previousClear: Date | null,
  handledAt: Date,
  enteredViaFieldChanges: Date[],
): Date | null {
  return lastEnteredAt(actions, previousClear, enteredViaFieldChanges, handledAt, { requireActive: false });
}

function reviewGroupAtHandle(
  actions: DbModeratorAction[],
  previousClear: Date | null,
  handledAt: Date,
  user: DbUser | undefined,
  offboardIds: Set<string>,
): string {
  const asOfHandle = actions
    .filter(action => reviewTriggerModeratorActions.has(action.type))
    .filter(action => (asDate(action.createdAt)?.getTime() ?? 0) <= handledAt.getTime())
    .map(action => {
      const endedAt = asDate(action.endedAt)?.getTime() ?? null;
      return {
        type: action.type,
        createdAt: action.createdAt,
        active: endedAt === null || endedAt >= handledAt.getTime(),
      };
    });
  let group = getReviewGroupFromActions(asOfHandle, previousClear);
  if (user && group === 'newContent' && (user.karma < 0 || offboardIds.has(user._id))) {
    group = 'offboard';
  }
  return REVIEW_GROUP_LABEL[group];
}

export async function getSupermodStatus(
  context: ResolverContext,
  windowStart: Date,
  windowEnd: Date,
): Promise<SupermodStatusReport> {
  const adminTeamAccountId = adminAccountSetting.get()?._id ?? null;
  const skipActorIds = new Set(adminTeamAccountId ? [adminTeamAccountId] : []);

  const [queueUsers, queuePosts, needsReviewChanges, reviewedByChanges, clearsAfterWindow, postReviewsAfterWindow] = await Promise.all([
    fetchQueueUsers(context),
    fetchQueuePosts(context),
    fetchFieldChangesInWindow(context, 'needsReview', windowStart, windowEnd),
    fetchFieldChangesInWindow(context, 'reviewedByUserId', windowStart, windowEnd),
    context.FieldChanges.find({
      fieldName: 'needsReview',
      createdAt: { $gte: windowEnd },
    }).fetch(),
    context.FieldChanges.find({
      fieldName: 'reviewedByUserId',
      createdAt: { $gte: windowEnd },
    }).fetch(),
  ]);

  const usersClearedAfterWindowIds = uniqueDocumentIds(
    clearsAfterWindow.filter(change => NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)),
  );
  const postsReviewedAfterWindowIds = uniqueDocumentIds(
    postReviewsAfterWindow.filter(change => isTruthyJsonValue(change.newValue) && !isTruthyJsonValue(change.oldValue)),
  );
  const alreadyQueuedUserIds = new Set(queueUsers.map(user => user._id));
  const alreadyQueuedPostIds = new Set(queuePosts.map(post => post._id));
  const extraUserIds = usersClearedAfterWindowIds.filter(id => !alreadyQueuedUserIds.has(id));
  const extraPostIds = postsReviewedAfterWindowIds.filter(id => !alreadyQueuedPostIds.has(id));

  const [extraUsers, extraPosts] = await Promise.all([
    extraUserIds.length
      ? context.Users.find({ _id: { $in: extraUserIds }, deleted: { $ne: true } }).fetch()
      : Promise.resolve([] as DbUser[]),
    extraPostIds.length
      ? context.Posts.find({ _id: { $in: extraPostIds } }).fetch()
      : Promise.resolve([] as DbPost[]),
  ]);

  const snapshotUsers = [
    ...queueUsers,
    ...extraUsers.filter(user => matchesSunshineNewUsersView({ ...user, needsReview: true, reviewedByUserId: null })),
  ].sort(compareSunshineNewUsers).slice(0, SUPERMOD_USER_INBOX_LIMIT);
  const snapshotPosts = [
    ...queuePosts,
    ...extraPosts.filter(looksLikeSupermodPost),
  ];

  const rawUserClears = needsReviewChanges.filter(change =>
    NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)
  );
  const rawPostReviews = reviewedByChanges.filter(change => isTruthyJsonValue(change.newValue));
  const handledUserIds = uniqueDocumentIds(rawUserClears);
  const reviewedPostIds = uniqueDocumentIds(rawPostReviews);

  const [handledUsers, reviewedPosts] = await Promise.all([
    handledUserIds.length
      ? context.Users.find({ _id: { $in: handledUserIds } }).fetch()
      : Promise.resolve([] as DbUser[]),
    reviewedPostIds.length
      ? context.Posts.find({ _id: { $in: reviewedPostIds } }).fetch()
      : Promise.resolve([] as DbPost[]),
  ]);
  const handledUsersById = new Map(handledUsers.map(user => [user._id, user]));
  const reviewedPostsById = new Map(reviewedPosts.map(post => [post._id, post]));

  const userClears = rawUserClears.filter(change => {
    const documentId = asId(change.documentId);
    if (!documentId) return false;
    const user = handledUsersById.get(documentId);
    return !!user && appearsInSupermodUserInbox(user);
  });
  const postReviews = rawPostReviews.filter(change => {
    const documentId = asId(change.documentId);
    if (!documentId) return false;
    const post = reviewedPostsById.get(documentId);
    return !!post && isSupermodPostReview(change, post, adminTeamAccountId);
  });
  const queueUserIds = snapshotUsers.map(user => user._id);
  const userIdsForActions = [...new Set([...handledUserIds, ...queueUserIds])];

  const [moderatorActions, historicalClears] = await Promise.all([
    userIdsForActions.length > 0
      ? context.ModeratorActions.find({
          userId: { $in: userIdsForActions },
          type: { $in: [...reviewTriggerModeratorActions] },
        }).fetch()
      : Promise.resolve([] as DbModeratorAction[]),
    handledUserIds.length > 0
      ? context.FieldChanges.find({
          documentId: { $in: handledUserIds },
          fieldName: 'needsReview',
        }).fetch()
      : Promise.resolve([] as DbFieldChange[]),
  ]);

  const actionsByUser = new Map<string, DbModeratorAction[]>();
  for (const action of moderatorActions) {
    const list = actionsByUser.get(action.userId) ?? [];
    list.push(action);
    actionsByUser.set(action.userId, list);
  }

  const lastClearedByUser = new Map<string, Date>();
  const clearsByUser = new Map<string, Date[]>();
  const enteredByUser = new Map<string, Date[]>();
  for (const change of historicalClears) {
    const changedAt = asDate(change.createdAt);
    const documentId = asId(change.documentId);
    if (!changedAt || !documentId) continue;
    if (NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)) {
      const list = clearsByUser.get(documentId) ?? [];
      list.push(changedAt);
      clearsByUser.set(documentId, list);
    }
    if (NEEDS_REVIEW_TRUE.includes(change.newValue as boolean | string)) {
      const list = enteredByUser.get(documentId) ?? [];
      list.push(changedAt);
      enteredByUser.set(documentId, list);
    }
  }
  for (const [userId, clears] of clearsByUser) {
    const latest = clears.reduce((max, date) => date.getTime() > max.getTime() ? date : max);
    lastClearedByUser.set(userId, latest);
  }

  const lastClearedForQueueUsers = queueUserIds.length > 0
    ? await context.FieldChanges.find({
        documentId: { $in: queueUserIds },
        fieldName: 'needsReview',
      }).fetch()
    : [];
  for (const change of lastClearedForQueueUsers) {
    const changedAt = asDate(change.createdAt);
    const documentId = asId(change.documentId);
    if (!changedAt || !documentId || changedAt.getTime() >= windowEnd.getTime()) continue;
    if (NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)) {
      const existing = lastClearedByUser.get(documentId);
      if (!existing || changedAt.getTime() > existing.getTime()) {
        lastClearedByUser.set(documentId, changedAt);
      }
    }
    if (NEEDS_REVIEW_TRUE.includes(change.newValue as boolean | string)) {
      const list = enteredByUser.get(documentId) ?? [];
      list.push(changedAt);
      enteredByUser.set(documentId, list);
    }
  }

  const now = windowEnd;
  type QueuedUser = {
    user: DbUser;
    queuedAt: Date;
    reviewGroupLabel: string;
  };
  const queuedUsers: QueuedUser[] = [];
  let leftoverWithoutKnownEntry = 0;
  for (const user of snapshotUsers) {
    const lastRemoved = lastClearedByUser.get(user._id) ?? null;
    const queuedAt = lastEnteredAt(
      actionsByUser.get(user._id) ?? [],
      lastRemoved,
      enteredByUser.get(user._id) ?? [],
      now,
    );
    if (!queuedAt) {
      leftoverWithoutKnownEntry += 1;
      continue;
    }
    if (queuedAt.getTime() >= windowEnd.getTime()) continue;
    queuedUsers.push({
      user,
      queuedAt,
      reviewGroupLabel: reviewGroupLabelForUser(actionsByUser.get(user._id) ?? [], lastRemoved),
    });
  }

  const leftoverUsers = queuedUsers.filter(item => item.queuedAt.getTime() < windowStart.getTime());
  const remainingYesterdayUsers = leftoverUsers.length + leftoverWithoutKnownEntry;
  const remainingYesterdayUsersLate = leftoverUsers.filter(item =>
    daysLateFromAge(now.getTime() - item.queuedAt.getTime()) >= 2
  ).length;
  const newWaitingUsers = queuedUsers.filter(item => item.queuedAt.getTime() >= windowStart.getTime()).length;

  const snapshotPostsInWindow = snapshotPosts.filter(post => {
    const queuedAt = asDate(post.postedAt) ?? asDate(post.createdAt);
    return queuedAt !== null && queuedAt.getTime() < windowEnd.getTime();
  });
  const leftoverPosts = snapshotPostsInWindow.filter(post => {
    const queuedAt = asDate(post.postedAt) ?? asDate(post.createdAt);
    return queuedAt !== null && queuedAt.getTime() < windowStart.getTime();
  });
  const remainingYesterdayPosts = leftoverPosts.length;
  const remainingYesterdayPostsLate = leftoverPosts.filter(post => {
    const queuedAt = asDate(post.postedAt) ?? asDate(post.createdAt);
    return queuedAt !== null && daysLateFromAge(now.getTime() - queuedAt.getTime()) >= 2;
  }).length;
  const newWaitingPosts = snapshotPostsInWindow.filter(post => {
    const queuedAt = asDate(post.postedAt) ?? asDate(post.createdAt);
    return queuedAt === null || queuedAt.getTime() >= windowStart.getTime();
  }).length;

  let oldestUser: OldestUserInfo | null = null;
  for (const item of queuedUsers) {
    const ageMs = now.getTime() - item.queuedAt.getTime();
    if (!oldestUser || ageMs > oldestUser.ageMs) {
      oldestUser = {
        displayName: userGetDisplayName(item.user) || item.user.username || 'Unknown',
        userId: item.user._id,
        reviewGroupLabel: item.reviewGroupLabel,
        ageMs,
      };
    }
  }

  const processRecords: Array<{
    user: DbUser;
    previousClear: Date | null;
    handledAt: Date;
    durationMs: number;
    actions: DbModeratorAction[];
  }> = [];
  for (const change of userClears) {
    const handledAt = asDate(change.createdAt);
    const documentId = asId(change.documentId);
    if (!handledAt || !documentId) continue;
    const previousClear = previousClearBefore(clearsByUser, documentId, handledAt);
    const queuedAt = queuedAtForHandledUser(
      actionsByUser.get(documentId) ?? [],
      previousClear,
      handledAt,
      enteredByUser.get(documentId) ?? [],
    );
    if (!queuedAt) continue;
    const user = handledUsersById.get(documentId);
    if (!user) continue;
    processRecords.push({
      user,
      previousClear,
      handledAt,
      durationMs: handledAt.getTime() - queuedAt.getTime(),
      actions: actionsByUser.get(documentId) ?? [],
    });
  }
  const processDurations = processRecords.map(record => record.durationMs);
  const averageProcessTimeMs = processDurations.length > 0
    ? processDurations.reduce((sum, value) => sum + value, 0) / processDurations.length
    : null;
  const maxProcessTimeMs = processDurations.length > 0
    ? Math.max(...processDurations)
    : null;
  const topHandled = [...processRecords].sort((a, b) => b.durationMs - a.durationMs).slice(0, 3);
  const offboardIds = new Set(
    topHandled.length > 0
      ? await context.repos.users.getOffboardCandidateUserIds(topHandled.map(record => record.user._id))
      : [],
  );
  const longestHandled: LongestHandledUser[] = topHandled.map(record => ({
    displayName: userGetDisplayName(record.user) || record.user.username || 'Unknown',
    userId: record.user._id,
    durationMs: record.durationMs,
    reviewGroupLabel: reviewGroupAtHandle(
      record.actions,
      record.previousClear,
      record.handledAt,
      record.user,
      offboardIds,
    ),
  }));

  const actorIds = [
    ...userClears.map(change => change.userId),
    ...postReviews.map(change => change.userId),
  ].filter((id): id is string => !!id);
  const namesById = await loadDisplayNames(context, actorIds);

  const daysLate = groupDaysLate(queuedUsers.map(item => now.getTime() - item.queuedAt.getTime()));

  return {
    windowStart,
    windowEnd,
    usersHandled: countByModerator(userClears.map(change => change.userId), namesById, skipActorIds),
    postsReviewed: countByModerator(postReviews.map(change => change.userId), namesById, skipActorIds),
    remainingYesterdayUsers,
    remainingYesterdayUsersLate,
    remainingYesterdayPosts,
    remainingYesterdayPostsLate,
    newWaitingUsers,
    newWaitingPosts,
    oldestUser,
    averageProcessTimeMs,
    maxProcessTimeMs,
    longestHandled,
    daysLate,
    siteUrl: getSiteUrl(),
  };
}

export async function getLongestHandledUsers(
  context: ResolverContext,
  windowStart: Date,
  windowEnd: Date,
  limit: number,
): Promise<Array<{
  userId: string;
  displayName: string;
  username: string | null;
  queuedAt: Date;
  handledAt: Date;
  durationMs: number;
  handledByUserId: string | null;
}>> {
  const needsReviewChanges = await fetchFieldChangesInWindow(context, 'needsReview', windowStart, windowEnd);
  const rawUserClears = needsReviewChanges.filter(change =>
    NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)
  );
  const handledUserIds = uniqueDocumentIds(rawUserClears);
  if (handledUserIds.length === 0) return [];

  const [handledUsers, moderatorActions, historicalClears] = await Promise.all([
    context.Users.find({ _id: { $in: handledUserIds } }).fetch(),
    context.ModeratorActions.find({
      userId: { $in: handledUserIds },
      type: { $in: [...reviewTriggerModeratorActions] },
    }).fetch(),
    context.FieldChanges.find({
      documentId: { $in: handledUserIds },
      fieldName: 'needsReview',
    }).fetch(),
  ]);
  const handledUsersById = new Map(handledUsers.map(user => [user._id, user]));
  const userClears = rawUserClears.filter(change => {
    const documentId = asId(change.documentId);
    if (!documentId) return false;
    const user = handledUsersById.get(documentId);
    return !!user && appearsInSupermodUserInbox(user);
  });

  const actionsByUser = new Map<string, DbModeratorAction[]>();
  for (const action of moderatorActions) {
    const list = actionsByUser.get(action.userId) ?? [];
    list.push(action);
    actionsByUser.set(action.userId, list);
  }

  const clearsByUser = new Map<string, Date[]>();
  const enteredByUser = new Map<string, Date[]>();
  for (const change of historicalClears) {
    const changedAt = asDate(change.createdAt);
    const documentId = asId(change.documentId);
    if (!changedAt || !documentId) continue;
    if (NEEDS_REVIEW_FALSE.includes(change.newValue as boolean | string)) {
      const list = clearsByUser.get(documentId) ?? [];
      list.push(changedAt);
      clearsByUser.set(documentId, list);
    }
    if (NEEDS_REVIEW_TRUE.includes(change.newValue as boolean | string)) {
      const list = enteredByUser.get(documentId) ?? [];
      list.push(changedAt);
      enteredByUser.set(documentId, list);
    }
  }

  const rows: Array<{
    userId: string;
    displayName: string;
    username: string | null;
    queuedAt: Date;
    handledAt: Date;
    durationMs: number;
    handledByUserId: string | null;
  }> = [];
  for (const change of userClears) {
    const handledAt = asDate(change.createdAt);
    const documentId = asId(change.documentId);
    if (!handledAt || !documentId) continue;
    const previousClear = previousClearBefore(clearsByUser, documentId, handledAt);
    const queuedAt = queuedAtForHandledUser(
      actionsByUser.get(documentId) ?? [],
      previousClear,
      handledAt,
      enteredByUser.get(documentId) ?? [],
    );
    if (!queuedAt) continue;
    const user = handledUsersById.get(documentId);
    if (!user) continue;
    rows.push({
      userId: user._id,
      displayName: userGetDisplayName(user) || user.username || 'Unknown',
      username: user.username ?? null,
      queuedAt,
      handledAt,
      durationMs: handledAt.getTime() - queuedAt.getTime(),
      handledByUserId: change.userId ?? null,
    });
  }

  rows.sort((a, b) => b.durationMs - a.durationMs);
  return rows.slice(0, limit);
}
