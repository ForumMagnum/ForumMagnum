import { AI_DETECTED_OBVIOUS_SPAM, UNREVIEWED_BIO_UPDATE } from "@/lib/collections/moderatorActions/constants";
import { isActionActive } from "@/lib/collections/moderatorActions/helpers";
import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { createModeratorAction } from "../collections/moderatorActions/mutations";
import { getObviousSpamVerdict } from "../languageModels/obviousSpamCheck";

const MAX_CONCURRENT_CHECKS = 4;

/* eslint-disable no-console */

/**
 * When a user is taken out of the review queue we log a FieldChange setting
 * needsReview to false; the most recent one is when they last left the queue.
 * (Mirrors the resolver behind `Users.lastRemovedFromReviewQueueAt`.)
 */
async function getLastRemovedFromReviewQueueAt(context: ResolverContext, userIds: string[]) {
  const fieldChanges = await context.FieldChanges.find({
    documentId: { $in: userIds },
    fieldName: "needsReview",
    newValue: "false",
  }).fetch();

  const lastRemovedByUser = new Map<string, Date>();
  for (const fieldChange of fieldChanges) {
    if (!fieldChange.documentId) continue;
    const previous = lastRemovedByUser.get(fieldChange.documentId);
    if (!previous || fieldChange.createdAt > previous) {
      lastRemovedByUser.set(fieldChange.documentId, fieldChange.createdAt);
    }
  }
  return lastRemovedByUser;
}

/**
 * Users who are currently in the review queue because of an unreviewed bio
 * update. "Fresh" means the action was created after they were last removed
 * from the queue, matching how the supermod UI groups review triggers.
 */
async function getOutstandingBioReviewUsers(context: ResolverContext) {
  const { Users, ModeratorActions } = context;

  const bioActions = await ModeratorActions.find({ type: UNREVIEWED_BIO_UPDATE }).fetch();
  const activeBioActions = bioActions.filter(isActionActive);
  const candidateUserIds = [...new Set(activeBioActions.map(action => action.userId))];
  if (!candidateUserIds.length) return [];

  const users = await Users.find({ _id: { $in: candidateUserIds }, needsReview: true }).fetch();

  const latestBioActionByUser = new Map<string, Date>();
  for (const action of activeBioActions) {
    const previous = latestBioActionByUser.get(action.userId);
    if (!previous || action.createdAt > previous) {
      latestBioActionByUser.set(action.userId, action.createdAt);
    }
  }

  const lastRemovedByUser = await getLastRemovedFromReviewQueueAt(context, users.map(user => user._id));

  return users.filter(user => {
    const bioActionCreatedAt = latestBioActionByUser.get(user._id);
    if (!bioActionCreatedAt) return false;
    const removedAt = lastRemovedByUser.get(user._id);
    return !removedAt || bioActionCreatedAt > removedAt;
  });
}

export async function countOutstandingBioReviewUsers() {
  const context = createAdminContext();
  const users = await getOutstandingBioReviewUsers(context);
  const neverReviewed = users.filter(user => !user.reviewedByUserId && !user.reviewedAt);
  console.log(`Outstanding users with bio changes: ${users.length}`);
  console.log(`  ...of which never reviewed: ${neverReviewed.length}`);
  return { total: users.length, neverReviewed: neverReviewed.length };
}

/**
 * Reports which outstanding bio-change users do and don't currently carry an
 * AI_DETECTED_OBVIOUS_SPAM action. Useful for verifying a run after the fact.
 */
export async function reportObviousSpamCheckResults() {
  const context = createAdminContext();
  const { ModeratorActions } = context;

  const users = await getOutstandingBioReviewUsers(context);
  const actions = await ModeratorActions.find({
    userId: { $in: users.map(user => user._id) },
    type: AI_DETECTED_OBVIOUS_SPAM,
  }).fetch();
  const flaggedUserIds = new Set(actions.filter(isActionActive).map(action => action.userId));

  const notFlagged = users.filter(user => !flaggedUserIds.has(user._id));
  console.log(`Outstanding bio-change users: ${users.length}`);
  console.log(`Carrying an active "${AI_DETECTED_OBVIOUS_SPAM}" action: ${flaggedUserIds.size}`);
  console.log(`Not flagged (${notFlagged.length}):\n  ${notFlagged.map(user => `${user.username ?? "(no username)"} (${user._id})`).join("\n  ")}`);

  return { total: users.length, flagged: flaggedUserIds.size, notFlagged: notFlagged.length };
}

interface RunObviousSpamCheckOptions {
  /** If true, report verdicts but don't create any moderator actions. */
  dryRun?: boolean;
  /** Also check users who have been reviewed before (the production path skips these). */
  includeReviewed?: boolean;
  limit?: number;
}

export async function runObviousSpamCheckOnBioUsers(options: RunObviousSpamCheckOptions = {}) {
  const { dryRun = false, includeReviewed = false, limit } = options;
  const context = createAdminContext();
  const { ModeratorActions } = context;

  const allUsers = await getOutstandingBioReviewUsers(context);
  const eligibleUsers = includeReviewed
    ? allUsers
    : allUsers.filter(user => !user.reviewedByUserId && !user.reviewedAt);
  const users = limit ? eligibleUsers.slice(0, limit) : eligibleUsers;

  console.log(`Found ${allUsers.length} outstanding users with bio changes`);
  console.log(`Checking ${users.length}${dryRun ? " (dry run, no moderator actions will be created)" : ""}`);
  if (allUsers.length !== eligibleUsers.length) {
    console.log(`Skipping ${allUsers.length - eligibleUsers.length} previously-reviewed users (pass includeReviewed to include them)`);
  }

  const flagged: string[] = [];
  const failed: string[] = [];
  let checked = 0;

  await executePromiseQueue(users.map(user => async () => {
    const label = `${user.username ?? user._id} (${user._id})`;
    try {
      const verdict = await getObviousSpamVerdict(user, context);
      checked++;
      console.log(`[${verdict.isObviousSpam ? "SPAM" : "ok  "}] ${label}: ${verdict.reasoning}`);

      if (!verdict.isObviousSpam) return;
      flagged.push(label);
      if (dryRun) return;

      const existingAction = await ModeratorActions.findOne({ userId: user._id, type: AI_DETECTED_OBVIOUS_SPAM });
      if (existingAction) {
        console.log(`      (already had an ${AI_DETECTED_OBVIOUS_SPAM} action, not creating another)`);
        return;
      }
      await createModeratorAction({ data: { userId: user._id, type: AI_DETECTED_OBVIOUS_SPAM } }, context);
    } catch (error) {
      failed.push(label);
      console.error(`[FAIL] ${label}`, error);
    }
  }), MAX_CONCURRENT_CHECKS);

  console.log(`\nDone. Checked ${checked}, flagged ${flagged.length}, failed ${failed.length}`);
  if (flagged.length) console.log(`Flagged as obvious spam:\n  ${flagged.join("\n  ")}`);
  if (failed.length) console.log(`Failed:\n  ${failed.join("\n  ")}`);

  return { checked, flagged: flagged.length, failed: failed.length };
}
