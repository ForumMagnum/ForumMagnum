import { getWithCustomLoader, getWithLoader } from "@/lib/loaders";
import { isActionActive } from "@/lib/collections/moderatorActions/helpers";
import { compareReviewQueueUsers, getReviewGroupFromActions, isReviewTriggeredOnlyByContent, type ReviewQueueSortUser } from "@/lib/collections/users/reviewGroups";
import type { PendingContentStats } from "@/server/repos/UsersRepo";

interface ReviewQueueUser extends Omit<ReviewQueueSortUser, keyof PendingContentStats>, PendingContentStats {}

export function getModeratorActionsForUser(context: ResolverContext, userId: string) {
  return getWithLoader(context, context.ModeratorActions, "moderatorActionsByUserId", {}, "userId", userId);
}

export function getPendingContentStats(context: ResolverContext, userId: string) {
  return getWithCustomLoader(context, "pendingContentStats", userId, (userIds: string[]) =>
    context.repos.users.getPendingContentStats(userIds)
  );
}

export function getLastRemovedFromReviewQueueAt(context: ResolverContext, userId: string) {
  return getWithCustomLoader(context, "lastRemovedFromReviewQueueAt", userId, (userIds: string[]) =>
    context.repos.users.getLastRemovedFromReviewQueueAt(userIds)
  );
}

export function getRejectedContentCount(context: ResolverContext, userId: string) {
  return getWithCustomLoader(context, "rejectedContentCount", userId, (userIds: string[]) =>
    context.repos.users.getRejectedContentCounts(userIds)
  );
}

async function getReviewTriggerInfo(context: ResolverContext, userId: string) {
  const [actions, lastRemovedAt] = await Promise.all([
    getModeratorActionsForUser(context, userId),
    getLastRemovedFromReviewQueueAt(context, userId),
  ]);
  return {
    actions: actions.map(action => ({ type: action.type, active: isActionActive(action), createdAt: action.createdAt })),
    lastRemovedAt,
  };
}

export async function getReviewGroupForUser(context: ResolverContext, userId: string) {
  const { actions, lastRemovedAt } = await getReviewTriggerInfo(context, userId);
  return getReviewGroupFromActions(actions, lastRemovedAt);
}

async function getQueueUser(
  context: ResolverContext,
  user: Pick<DbUser, '_id' | 'sunshineFlagged' | 'reviewedByUserId' | 'postCount' | 'commentCount' | 'createdAt'>,
): Promise<ReviewQueueUser | null> {
  const [content, rejectedCount, { actions, lastRemovedAt }] = await Promise.all([
    getPendingContentStats(context, user._id),
    getRejectedContentCount(context, user._id),
    getReviewTriggerInfo(context, user._id),
  ]);
  if (!rejectedCount && !content.pendingPostCount && !content.pendingCommentCount
    && isReviewTriggeredOnlyByContent(actions, lastRemovedAt)) return null;
  return { ...user, ...content, reviewGroup: getReviewGroupFromActions(actions, lastRemovedAt) };
}

/** Rank the complete queue's small metadata records before loading a page of full users. */
async function loadReviewQueueUsers(context: ResolverContext): Promise<ReviewQueueUser[]> {
  const users = await context.Users.find({ needsReview: true, banned: null }, {}, {
    _id: 1, sunshineFlagged: 1, reviewedByUserId: 1, postCount: 1, commentCount: 1, createdAt: 1,
  }).fetch();
  const queueUsers = await Promise.all(users.map(user => getQueueUser(context, user)));
  return queueUsers.filter(user => user !== null).sort(compareReviewQueueUsers);
}

export function getReviewQueueUsers(context: ResolverContext): Promise<ReviewQueueUser[]> {
  return getWithCustomLoader(context, "reviewQueueUsers", "queue", async () => [await loadReviewQueueUsers(context)]);
}
