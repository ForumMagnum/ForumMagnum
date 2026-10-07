import keyBy from "lodash/keyBy";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { appendToSunshineNotes, getSignatureWithNote } from "@/lib/collections/users/helpers";
import { AUTO_PURGED_LLM_REJECTED_SPAM, AUTO_REMOVED_LLM_REJECTED_USER } from "@/lib/collections/moderatorActions/constants";
import { isActionActive } from "@/lib/collections/moderatorActions/helpers";
import { getFreshReviewTriggerActions, getModeratorActionGroup } from "@/lib/collections/users/reviewGroups";
import { llmRejectionTriageSetting } from "@/server/databaseSettings";
import { updateUser } from "@/server/collections/users/mutations";
import { createModeratorAction } from "@/server/collections/moderatorActions/mutations";
import { purgeSpamUser } from "@/server/profileSpamClassifier/autoPurge";
import { adminAccountSetting } from "@/lib/instanceSettings";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import {
  classifyLlmRejectedUser,
  type LlmRejectionTriageInput,
  type LlmRejectionTriageItem,
  type LlmRejectionTriageItemStatus,
  type LlmRejectionTriageVerdict,
} from "./classifier";

// The "No LLM (autoreject)" moderation template's text, which `rejectContentForLLM` copies into rejectedReason.
const AUTOMATED_REJECTION_MARKER = "This is an automated rejection";

// Far more than the prompt shows; new users rarely get close.
const MAX_ITEMS_PER_COLLECTION = 200;

function isAutoRejected(doc: { rejected: boolean, rejectedReason: string | null }): boolean {
  return doc.rejected && !!doc.rejectedReason?.includes(AUTOMATED_REJECTION_MARKER);
}

function getItemStatus(doc: { rejected: boolean, rejectedReason: string | null, deleted?: boolean }): LlmRejectionTriageItemStatus {
  if (doc.rejected) {
    return isAutoRejected(doc) ? "auto-rejected" : "rejected by moderator";
  }
  return doc.deleted ? "deleted" : "live";
}

interface RevisionContent {
  html: string;
  pangramScore: number | null;
}

async function getRevisionContentsById(revisionIds: string[], context: ResolverContext): Promise<Map<string, RevisionContent>> {
  const [revisions, evaluations] = await Promise.all([
    context.Revisions.find({ _id: { $in: revisionIds } }, {}, { _id: 1, html: 1 }).fetch(),
    context.AutomatedContentEvaluations.find(
      { revisionId: { $in: revisionIds } },
      { sort: { createdAt: -1 } },
      { revisionId: 1, pangramScore: 1 },
    ).fetch(),
  ]);
  const latestPangramScores = new Map<string, number | null>();
  for (const evaluation of evaluations) {
    if (!latestPangramScores.has(evaluation.revisionId)) {
      latestPangramScores.set(evaluation.revisionId, evaluation.pangramScore);
    }
  }
  return new Map(revisions.map(revision => [revision._id, {
    html: revision.html ?? "",
    pangramScore: latestPangramScores.get(revision._id) ?? null,
  }]));
}

function getRevisionContent(doc: DbPost | DbComment, revisionContentsById: Map<string, RevisionContent>): RevisionContent {
  const revisionContent = doc.contents_latest ? revisionContentsById.get(doc.contents_latest) : undefined;
  return revisionContent ?? { html: "", pangramScore: null };
}

/** Unpublished drafts are left out; everything else the user posted is included, labeled with its status. */
export async function getLlmRejectionTriageInput(user: DbUser, context: ResolverContext): Promise<LlmRejectionTriageInput> {
  const [posts, comments] = await Promise.all([
    context.Posts.find(
      { userId: user._id, shortform: { $ne: true }, $or: [{ draft: { $ne: true } }, { rejected: true }] },
      { sort: { postedAt: -1 }, limit: MAX_ITEMS_PER_COLLECTION },
    ).fetch(),
    context.Comments.find(
      { userId: user._id, draft: { $ne: true } },
      { sort: { postedAt: -1 }, limit: MAX_ITEMS_PER_COLLECTION },
    ).fetch(),
  ]);

  const repliedToPostIds = [...new Set(comments.flatMap(comment => comment.postId ? [comment.postId] : []))];
  const revisionIds = [...posts, ...comments].flatMap(doc => doc.contents_latest ? [doc.contents_latest] : []);
  const [repliedToPosts, revisionContentsById] = await Promise.all([
    context.Posts.find({ _id: { $in: repliedToPostIds } }, {}, { _id: 1, title: 1 }).fetch(),
    getRevisionContentsById(revisionIds, context),
  ]);
  const repliedToPostsById = keyBy(repliedToPosts, post => post._id);

  const postItems = posts.map((post): LlmRejectionTriageItem => ({
    kind: "Post",
    postedAt: post.postedAt,
    status: getItemStatus(post),
    title: post.title,
    replyingTo: null,
    ...getRevisionContent(post, revisionContentsById),
  }));
  const commentItems = comments.map((comment): LlmRejectionTriageItem => ({
    kind: "Comment",
    postedAt: comment.postedAt,
    status: getItemStatus(comment),
    title: null,
    replyingTo: comment.postId ? repliedToPostsById[comment.postId]?.title ?? null : null,
    ...getRevisionContent(comment, revisionContentsById),
  }));

  return {
    displayName: user.displayName,
    createdAt: user.createdAt,
    bioHtml: user.biography?.html ?? null,
    items: [...postItems, ...commentItems],
  };
}

async function getLastRemovedFromReviewQueueAt(userId: string, context: ResolverContext): Promise<Date | null> {
  const lastRemoval = await context.FieldChanges.findOne(
    { documentId: userId, fieldName: "needsReview", newValue: "false" },
    { sort: { createdAt: -1 } },
  );
  return lastRemoval?.createdAt ?? null;
}

/** True if the user is in the review queue only because of posts or comments, not e.g. a bio edit or a flag. */
async function isInReviewQueueOnlyForContent(userId: string, context: ResolverContext): Promise<boolean> {
  const [moderatorActions, lastRemovedFromReviewQueueAt] = await Promise.all([
    context.ModeratorActions.find({ userId }).fetch(),
    getLastRemovedFromReviewQueueAt(userId, context),
  ]);
  const actionsWithActiveStatus = moderatorActions.map(action => ({
    type: action.type,
    active: isActionActive(action),
    createdAt: action.createdAt,
  }));
  const freshActions = getFreshReviewTriggerActions(actionsWithActiveStatus, lastRemovedFromReviewQueueAt);
  return freshActions.length > 0 && freshActions.every(action => getModeratorActionGroup(action.type) === "newContent");
}

/**
 * Users in the review queue only for content, with nothing still awaiting approval,
 * and at least one auto-rejected item.
 */
export async function isEligibleForLlmRejectionTriage(user: DbUser, context: ResolverContext): Promise<boolean> {
  if (!user.needsReview || user.deleted || userIsAdminOrMod(user)) return false;
  if (user.banned && new Date(user.banned) > new Date()) return false;

  const [[pendingContentStats], rejectedPosts, rejectedComments] = await Promise.all([
    context.repos.users.getPendingContentStats([user._id]),
    context.Posts.find({ userId: user._id, rejected: true }, {}, { rejected: 1, rejectedReason: 1 }).fetch(),
    context.Comments.find({ userId: user._id, rejected: true }, {}, { rejected: 1, rejectedReason: 1 }).fetch(),
  ]);
  if (pendingContentStats.pendingPostCount || pendingContentStats.pendingCommentCount) return false;
  if (![...rejectedPosts, ...rejectedComments].some(isAutoRejected)) return false;

  return await isInReviewQueueOnlyForContent(user._id, context);
}

export type LlmRejectionTriageAction = "removeFromQueue" | "keepInQueue" | "keepSpamWithApprovedContentInQueue" | "purge";

/** Live posts or comments a moderator already approved, i.e. no longer marked authorIsUnreviewed. */
async function hasApprovedLiveContent(userId: string, context: ResolverContext): Promise<boolean> {
  const [approvedPost, approvedComment] = await Promise.all([
    context.Posts.findOne(
      { userId, authorIsUnreviewed: { $ne: true }, rejected: { $ne: true }, draft: { $ne: true }, shortform: { $ne: true } },
      {},
      { _id: 1 },
    ),
    context.Comments.findOne(
      { userId, authorIsUnreviewed: { $ne: true }, rejected: { $ne: true }, deleted: { $ne: true }, draft: { $ne: true } },
      {},
      { _id: 1 },
    ),
  ]);
  return !!approvedPost || !!approvedComment;
}

async function getLlmRejectionTriageAction(userId: string, verdict: LlmRejectionTriageVerdict, context: ResolverContext): Promise<LlmRejectionTriageAction> {
  switch (verdict.verdict) {
    case "remove":
      return "removeFromQueue";
    case "keep_for_review":
      return "keepInQueue";
    case "spam":
      // A purge deletes everything, so an account with approved content gets a human decision instead.
      return (await hasApprovedLiveContent(userId, context)) ? "keepSpamWithApprovedContentInQueue" : "purge";
  }
}

async function applyLlmRejectionTriageAction(user: DbUser, action: LlmRejectionTriageAction, reason: string, context: ResolverContext) {
  // Looked up directly rather than via getAdminTeamAccount, whose next/cache wrapper doesn't work in scripts.
  const adminTeamAccountId = adminAccountSetting.get(context)?._id;
  const adminTeamAccount = adminTeamAccountId ? await context.Users.findOne({ _id: adminTeamAccountId }) : null;
  if (!adminTeamAccount) return;

  switch (action) {
    case "removeFromQueue": {
      const adminContext = computeContextFromUser({ user: adminTeamAccount, isSSR: false, forumType: context.forumType });
      const note = getSignatureWithNote(adminTeamAccount.displayName, `Removed from review queue (LLM-rejection triage): ${reason}`);
      // Not an approval: reviewedByUserId is untouched, so any new content puts them back in the queue.
      await updateUser({
        selector: { _id: user._id },
        data: {
          needsReview: false,
          sunshineNotes: note + (user.sunshineNotes ?? ""),
        },
      }, adminContext);
      // Must come after the update, which would otherwise overwrite this action's sunshine note.
      await createModeratorAction({ data: { userId: user._id, type: AUTO_REMOVED_LLM_REJECTED_USER } }, adminContext);
      return;
    }
    case "keepInQueue":
      await appendToSunshineNotes({
        moderatedUserId: user._id,
        adminName: adminTeamAccount.displayName,
        text: `Kept in review queue (LLM-rejection triage): ${reason}`,
        context,
      });
      return;
    case "keepSpamWithApprovedContentInQueue":
      await appendToSunshineNotes({
        moderatedUserId: user._id,
        adminName: adminTeamAccount.displayName,
        text: `Kept in review queue: LLM-rejection triage says spam, but the user has approved content: ${reason}`,
        context,
      });
      return;
    case "purge":
      await purgeSpamUser(user, `Auto-purged as spam (LLM-rejection triage): ${reason}`, AUTO_PURGED_LLM_REJECTED_SPAM, context);
      return;
  }
}

interface LlmRejectionTriageResult {
  verdict: LlmRejectionTriageVerdict;
  action: LlmRejectionTriageAction;
}

/**
 * Classifies a user and acts on the verdict, unless `dryRun` is set. Doesn't
 * check the setting, so the backfill script can run it before the setting is
 * turned on.
 */
export async function runLlmRejectionTriage(
  userId: string,
  context: ResolverContext,
  { dryRun = false }: { dryRun?: boolean } = {},
): Promise<LlmRejectionTriageResult | null> {
  const user = await context.Users.findOne({ _id: userId });
  if (!user || !(await isEligibleForLlmRejectionTriage(user, context))) return null;

  const verdict = await classifyLlmRejectedUser(await getLlmRejectionTriageInput(user, context));
  if (!verdict) return null;

  // The user may have posted, been reviewed, or been moderated while we were classifying.
  const latestUser = await context.Users.findOne({ _id: userId });
  if (!latestUser || !(await isEligibleForLlmRejectionTriage(latestUser, context))) return null;

  const action = await getLlmRejectionTriageAction(userId, verdict, context);
  if (!dryRun) {
    await applyLlmRejectionTriageAction(latestUser, action, verdict.reason, context);
  }
  return { verdict, action };
}

export async function maybeRunLlmRejectionTriage(userId: string, context: ResolverContext) {
  if (!llmRejectionTriageSetting.get(context)) return;
  await runLlmRejectionTriage(userId, context);
}
