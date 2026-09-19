import { getWithLoader, getWithCustomLoader } from "@/lib/loaders";
import { isActionActive } from "../moderatorActions/helpers";
import { getReviewGroupFromActions } from "./reviewGroups";

export const getModeratorActionsForUser = (context: ResolverContext, userId: string) => {
  return getWithLoader(
    context,
    context.ModeratorActions,
    "moderatorActionsByUserId",
    {},
    "userId",
    userId,
  );
};

// Karma is checked first, to skip the batched content query when it can.
const getIsOffboardCandidate = async (context: ResolverContext, user: Pick<DbUser, "_id" | "karma">): Promise<boolean> => {
  if (user.karma < 0) {
    return true;
  }
  return getWithCustomLoader(context, "offboardCandidates", user._id, async (userIds) => {
    const candidateIds = new Set(await context.repos.users.getOffboardCandidateUserIds(userIds));
    return userIds.map((id) => candidateIds.has(id));
  });
};

// Get last time user's `needsReview` flag was set to false (or null if never).
export const getLastRemovedFromReviewQueueAt = async (context: ResolverContext, userId: string): Promise<Date | null> => {
  const fieldChanges = await getWithLoader(
    context,
    context.FieldChanges,
    "needsReviewFieldChanges",
    { fieldName: "needsReview", newValue: 'false' },
    "documentId",
    userId,
    // A limit here would cap the entire batch, not each user.
    { sort: { createdAt: -1 } },
  );

  return fieldChanges[0]?.createdAt ?? null;
};

export async function getUserReviewGroup(context: ResolverContext, doc: Pick<DbUser, "_id" | "karma">): Promise<ReviewGroup> {
  const [moderatorActions, lastRemovedFromReviewQueueAt] = await Promise.all([
    getModeratorActionsForUser(context, doc._id),
    getLastRemovedFromReviewQueueAt(context, doc._id),
  ]);

  const actionsWithActiveStatus = moderatorActions.map(action => ({
    type: action.type,
    active: isActionActive(action),
    createdAt: action.createdAt,
  }));
  const baseGroup = getReviewGroupFromActions(actionsWithActiveStatus, lastRemovedFromReviewQueueAt);

  if (baseGroup === 'newContent' && await getIsOffboardCandidate(context, doc)) {
    return 'offboard';
  }

  return baseGroup;
}
