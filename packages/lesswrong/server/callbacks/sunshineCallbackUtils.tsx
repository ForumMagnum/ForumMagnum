import moment from "moment";
import { DOWNVOTED_COMMENT_ALERT } from "@/lib/collections/commentModeratorActions/constants";
import { isLowAverageKarmaContent } from "../../lib/collections/moderatorActions/helpers";
import { isActionActive } from "../../lib/collections/moderatorActions/newSchema";
import { LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, NEGATIVE_KARMA_USER_ALERT, postAndCommentRateLimits, rateLimitSet, RECENTLY_DOWNVOTED_CONTENT_ALERT } from "@/lib/collections/moderatorActions/constants";
import { getWithLoader } from "../../lib/loaders";
import { forumSelect } from "../../lib/forumTypeUtils";
import { createModeratorAction, updateModeratorAction } from "../collections/moderatorActions/mutations";
import { triggerReview } from "./helpers";
import { createCommentModeratorAction } from "../collections/commentModeratorActions/mutations";
import { getReasonForReview } from "../collections/users/serverHelpers";
import { useRejectContent } from "@/components/hooks/useRejectContent";
import { Comments } from "../collections/comments/collection";
import { Posts } from "../collections/posts/collection";
import ModerationTemplates from "../collections/moderationTemplates/collection";

type RejectableContent = {
  content: DbPost,
  collectionName: "Posts"
} | {
  content: DbComment,
  collectionName: "Comments"
}

const NO_LLM_AUTOREJECT_TEMPLATE = "No LLM (autoreject)";

async function rejectContent(rejectableContent: RejectableContent, reason: string) {
  if (rejectableContent.collectionName === "Posts") {
    const moderationTemplate = await ModerationTemplates.findOne({ name: NO_LLM_AUTOREJECT_TEMPLATE });
    if (!moderationTemplate) {
      throw new Error("Moderation template not found");
    }
    await Posts.rawUpdateOne(
      { _id: rejectableContent.content._id },
      { 
        $set: { 
          rejected: true, 
          rejectedReason: moderationTemplate.contents?.html ?? "" 
        } 
      }
    );
  } else {
    await Comments.rawUpdateOne(
      { _id: rejectableContent.content._id },
      { 
        $set: { 
          rejected: true, 
          rejectedReason: reason 
        } 
      }
    );
  }
}

/** 
 * This function contains all logic for determining whether a given user needs review in the moderation sidebar.
 * It's important this this only be be added to async callbacks on posts and comments, so that postCount and commentCount have time to update first
 */
export async function triggerReviewIfNeeded({userId, context, rejectableContent}: {userId: string, context: ResolverContext, rejectableContent?: RejectableContent}) {
  const { Users } = context;
  const user = await Users.findOne({ _id: userId });
  if (!user)
    throw new Error("user is null");
  
  const {needsReview, reason} = await getReasonForReview(user, rejectableContent?.content);
  if (reason === 'llmRejected' && rejectableContent) {
    await rejectContent(rejectableContent, reason);
  }
  if (needsReview) {
    await triggerReview(user._id, context, reason);
  }
}

interface VoteableAutomodRuleProps<T extends DbVoteableType>{
  voteableItem: T;
  votes: DbVote[];
}

type VoteableAutomodRule<T extends DbVoteableType = DbVoteableType> = (props: VoteableAutomodRuleProps<T>) => boolean;

function hasMultipleDownvotes<T extends DbVoteableType>({ votes }: VoteableAutomodRuleProps<T>) {
  const downvotes = votes.filter(vote => vote.voteType === 'smallDownvote' || vote.voteType === 'bigDownvote');
  return downvotes.length > 1;
}

/**
 * Doesn't use `VoteableAutomodRuleProps` because we also use it in places where we don't have (or care) about the votes themselves
 */
function isDownvotedBelowBar<T extends DbVoteableType>(bar: number) {
  return ({ voteableItem }: { voteableItem: T }) => {
    return (voteableItem.baseScore ?? 0) <= bar && voteableItem.voteCount > 0;
  }
}

export function isRecentlyDownvotedContent(voteableItems: (DbComment | DbPost)[]) {
  // Not enough engagement to make a judgment
  if (voteableItems.length < 5) return false;

  const oneWeekAgo = moment().subtract(7, 'days').toDate();

  // If the user hasn't posted in a while, we don't care if someone's been voting on their old content
  if (voteableItems.every(item => item.postedAt < oneWeekAgo)) return false;

  const lastFiveVoteableItems = voteableItems.slice(0, 5);
  const downvotedItemCountThreshold = 2;
  const downvotedItemCount = lastFiveVoteableItems.filter(item => isDownvotedBelowBar(0)({ voteableItem: item })).length;

  return downvotedItemCount >= downvotedItemCountThreshold;
}

function isActiveNegativeKarmaUser(user: DbUser, voteableItems: (DbComment | DbPost)[]) {
    // Not enough engagement to make a judgment
    if (voteableItems.length < 5) return false;

    const oneMonthAgo = moment().subtract(1, 'month').toDate();
  
    // If the user hasn't posted in a while, we don't care if someone's been voting on their old content
    if (voteableItems.every(item => item.postedAt < oneMonthAgo)) return false;

    return (user.karma) < -5;
}

async function triggerModerationAction(userId: string, warningType: DbModeratorAction['type']) {
  const { createAdminContext }: typeof import("../vulcan-lib/createContexts") = require("../vulcan-lib/createContexts");
  const context = createAdminContext();
  const { ModeratorActions } = context;

  const lastModeratorAction = await ModeratorActions.findOne({ userId, type: warningType }, { sort: { createdAt: -1 } });
  // No previous commentQualityWarning on record for this user
  if (!lastModeratorAction) {
    void createModeratorAction({
      data: {
        userId,
        type: warningType,
      },
    }, context);

    // User already has an active commentQualityWarning, escalate?
  } else if (isActionActive(lastModeratorAction)) {
    // TODO

    // User has an inactive commentQualityWarning, re-apply?
  } else {
    void createModeratorAction({
      data: {
        type: warningType,
        userId  
      },
    }, context);
  }
}

async function disableModerationAction(userId: string, warningType: DbModeratorAction['type']) {
  const { createAdminContext }: typeof import("../vulcan-lib/createContexts") = require("../vulcan-lib/createContexts");
  const context = createAdminContext();
  const { ModeratorActions } = context;

  const lastModeratorAction = await ModeratorActions.findOne({ userId, type: warningType }, { sort: { createdAt: -1 } });
  if (lastModeratorAction && isActionActive(lastModeratorAction)) {
    void updateModeratorAction({
      data: { endedAt: new Date() },
      selector: { _id: lastModeratorAction._id }
    }, context);
  }
}

/**
 * Enables or disables a moderator action on a specific user, based on a conditional
 */
function handleAutomodAction(triggerAction: boolean, userId: string, actionType: DbModeratorAction['type']) {
  if (triggerAction) {
    void triggerModerationAction(userId, actionType);
  } else {
    void disableModerationAction(userId, actionType);
  }
}

/**
 * WARNING: assumes that the input actions are already sorted by createdAt descending
 */
function getLastActionEndedAt(actions: DbModeratorAction[], actionType: DbModeratorAction['type']) {
  return actions.find(action => action.type === actionType)?.endedAt;
}

function getUnmoderatedContent(content: (DbPost | DbComment)[], lastActionEndedAt?: Date | null) {
  return lastActionEndedAt
    ? content.filter(item => item.postedAt > lastActionEndedAt)
    : content;
}

/**
 * recently downvoted content:
 * - if active, disable if no longer meets condition
 * - if inactive, condition should only check content (both posts & comments) from after the last endedAt
 * 
 * low average karma:
 * - if active, disable if no longer meets condition
 * - if inactive, condition should only check content (whichever one matches the action type) from after the last endedAt
 */
export async function triggerAutomodIfNeededForUser(user: DbUser, context: ResolverContext) {
  const { ModeratorActions, Comments, Posts } = context;
  const userId = user._id;

  const [userModeratorActions, latestComments, latestPosts] = await Promise.all([
    // Sort by createdAt descending so that `.find` returns the most recent one matching the condition
    ModeratorActions.find({ userId }, { sort: { createdAt: -1 } }).fetch(),
    Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch(),
    Posts.find({ userId, isEvent: false, draft: false }, { sort: { postedAt: -1 }, limit: 20, projection: { postedAt: 1, baseScore: 1 } }).fetch()
  ]);

  const voteableContent = [...latestComments, ...latestPosts].sort((a, b) => b.postedAt.valueOf() - a.postedAt.valueOf());

  if (userModeratorActions.filter(isActionActive).some(action => rateLimitSet.has(action.type) )) {
    // if a mod has already given them a rate limit, they don't need to have any new actions applied to them
    // TODO: if we build any more complicated mod action rules, this will need to be updated
    // eaforum-look-here
    return
  }
  const activeNegativeKarmaUser = isActiveNegativeKarmaUser(user, voteableContent);
  handleAutomodAction(activeNegativeKarmaUser, userId, NEGATIVE_KARMA_USER_ALERT);

  // Remove the most recent content item for each rule
  // Since posts & comments start by default without much karma, they artificially down-weight averages
  latestComments.shift();
  latestPosts.shift();

  // Get the `endedAt` of the most recently-created action of each type
  // We don't care about the distinction between an active action with no `endedAt` and the user not having that type of action at all
  // We'll check that distinction later in `triggerModerationAction`, if necessary
  // Also, we want to be able to disable active actions on the basis of recent content getting upvoted
  // That would be impossible if we filtered it out
  const downvotedContentActionEndedAt = getLastActionEndedAt(userModeratorActions, RECENTLY_DOWNVOTED_CONTENT_ALERT);
  const lowAvgKarmaCommentEndedAt = getLastActionEndedAt(userModeratorActions, LOW_AVERAGE_KARMA_COMMENT_ALERT);
  const lowAvgKarmaPostEndedAt = getLastActionEndedAt(userModeratorActions, LOW_AVERAGE_KARMA_POST_ALERT);

  const unmoderatedVoteableContent = getUnmoderatedContent(voteableContent, downvotedContentActionEndedAt);
  const unmoderatedLatestComments = getUnmoderatedContent(latestComments, lowAvgKarmaCommentEndedAt);
  const unmoderatedLatestPosts = getUnmoderatedContent(latestPosts, lowAvgKarmaPostEndedAt);
  
  const lowQualityContent = isRecentlyDownvotedContent(unmoderatedVoteableContent);
  const { lowAverage: mediocreQualityComments } = isLowAverageKarmaContent(unmoderatedLatestComments, 'comment');
  const { lowAverage: mediocreQualityPosts } = isLowAverageKarmaContent(unmoderatedLatestPosts, 'post');

  handleAutomodAction(lowQualityContent, userId, RECENTLY_DOWNVOTED_CONTENT_ALERT);
  handleAutomodAction(mediocreQualityComments, userId, LOW_AVERAGE_KARMA_COMMENT_ALERT);
  handleAutomodAction(mediocreQualityPosts, userId, LOW_AVERAGE_KARMA_POST_ALERT);
}

export async function triggerAutomodIfNeeded(userId: string, context: ResolverContext) {
  const { Users } = context;
  const user = await Users.findOne(userId);
  if (!user) return;

  await triggerAutomodIfNeededForUser(user, context);
}

export async function triggerCommentAutomodIfNeeded(comment: DbVoteableType, vote: DbVote) {
  const { createAdminContext }: typeof import("../vulcan-lib/createContexts") = require("../vulcan-lib/createContexts");

  const context = createAdminContext();
  const { Votes, CommentModeratorActions } = context;
  const commentId = comment._id;

  const [allVotes, previousCommentModeratorActions] = await Promise.all([
    getWithLoader(context, Votes, "votesByDocument", { cancelled: false }, "documentId", commentId),
    CommentModeratorActions.find({ commentId }, { sort: { createdAt: -1 } }).fetch()
  ]);

  const existingDownvotedCommentAction = previousCommentModeratorActions.find(action => action.type === DOWNVOTED_COMMENT_ALERT);

  const automodRule = forumSelect<VoteableAutomodRule>({
    LessWrong: hasMultipleDownvotes,
    EAForum: isDownvotedBelowBar(-10),
    default: () => false
  });
  
  const needsModeration = automodRule({ voteableItem: comment, votes: allVotes });

  if (!existingDownvotedCommentAction && needsModeration) {
    void createCommentModeratorAction({
      data: {
        type: DOWNVOTED_COMMENT_ALERT,
        commentId
      },
    }, context);
  }
}
