import moment from "moment";
import { CommentModeratorActions } from "../../lib/collections/commentModeratorActions/collection";
import { DOWNVOTED_COMMENT_ALERT } from "../../lib/collections/commentModeratorActions/schema";
import { Comments } from "../../lib/collections/comments";
import { ModeratorActions } from "../../lib/collections/moderatorActions";
import { getReasonForReview, isLowAverageKarmaContent } from "../../lib/collections/moderatorActions/helpers";
import { isActionActive, LOW_AVERAGE_KARMA_COMMENT_ALERT, LOW_AVERAGE_KARMA_POST_ALERT, NEGATIVE_KARMA_USER_ALERT, RECENTLY_DOWNVOTED_CONTENT_ALERT } from "../../lib/collections/moderatorActions/schema";
import { Posts } from "../../lib/collections/posts";
import Users from "../../lib/collections/users/collection";
import { createAdminContext, createMutator, updateMutator } from "../vulcan-lib";

/** 
 * This function contains all logic for determining whether a given user needs review in the moderation sidebar.
 * It's important this this only be be added to async callbacks on posts and comments, so that postCount and commentCount have time to update first
 */
export async function triggerReviewIfNeeded(userId: string, override?: true) {
  const user = await Users.findOne({ _id: userId });
  if (!user)
    throw new Error("user is null");

  const reviewReason = getReasonForReview(user, override);

  // TODO: we probably don't want to actually be updating needsReview in these two cases?  That'd clobber automod updates
  const needsReview = reviewReason !== 'noReview' && reviewReason !== 'alreadyApproved';

  void Users.rawUpdateOne({ _id: user._id }, { $set: { needsReview: needsReview } });
}

function isNetDownvoted(comment: DbComment) {
  return comment.baseScore <= 0 && comment.voteCount > 0;
}

export function isRecentlyDownvotedContent(voteableItems: (DbComment | DbPost)[]) {
  // Not enough engagement to make a judgment
  if (voteableItems.length < 5) return false;

  const oneWeekAgo = moment().subtract(7, 'days').toDate();

  // If the user hasn't posted in a while, we don't care if someone's been voting on their old content
  if (voteableItems.every(item => item.postedAt < oneWeekAgo)) return false;

  const lastFiveVoteableItems = voteableItems.slice(0, 5);
  const downvotedItemCountThreshold = 2;
  const downvotedItemCount = lastFiveVoteableItems.filter(isNetDownvoted).length;

  return downvotedItemCount >= downvotedItemCountThreshold;
}

async function triggerModerationAction(userId: string, warningType: DbModeratorAction['type']) {
  const context = createAdminContext();
  const lastModeratorAction = await ModeratorActions.findOne({ userId, type: warningType }, { sort: { createdAt: -1 } });
  // No previous commentQualityWarning on record for this user
  if (!lastModeratorAction) {
    void createMutator({
      collection: ModeratorActions,
      document: {
        type: warningType,
        userId
      },
      currentUser: context.currentUser,
      context
    });

    // User already has an active commentQualityWarning, escalate?
  } else if (isActionActive(lastModeratorAction)) {
    // TODO

    // User has an inactive commentQualityWarning, re-apply?
  } else {
    void createMutator({
      collection: ModeratorActions,
      document: {
        type: warningType,
        userId  
      },
      currentUser: context.currentUser,
      context
    });
  }
}

async function disableModerationAction(userId: string, warningType: DbModeratorAction['type']) {
  const context = createAdminContext();
  const lastModeratorAction = await ModeratorActions.findOne({ userId, type: warningType }, { sort: { createdAt: -1 } });
  if (lastModeratorAction && isActionActive(lastModeratorAction)) {
    void updateMutator({
      collection: ModeratorActions,
      documentId: lastModeratorAction._id,
      data: {
        endedAt: new Date()
      },
      currentUser: context.currentUser,
      context
    });
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

export async function triggerAutomodIfNeededForUser(user: DbUser) {
  const userId = user._id;

  const lowUserKarma = user.karma < -5;
  handleAutomodAction(lowUserKarma, userId, NEGATIVE_KARMA_USER_ALERT);

  const [latestComments, latestPosts] = await Promise.all([
    Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch(),
    Posts.find({ userId, isEvent: false, draft: false }, { sort: { postedAt: -1 }, limit: 20 }).fetch()
  ]);

  const voteableContent = [...latestComments, ...latestPosts].sort((a, b) => b.postedAt.valueOf() - a.postedAt.valueOf());
  
  // TODO: vary threshold based on other user info (i.e. age/karma/etc)?
  const lowQualityContent = isRecentlyDownvotedContent(voteableContent);
  const { lowAverage: mediocreQualityComments } = isLowAverageKarmaContent(latestComments, 'comment');
  const { lowAverage: mediocreQualityPosts } = isLowAverageKarmaContent(latestPosts, 'post');

  handleAutomodAction(lowQualityContent, userId, RECENTLY_DOWNVOTED_CONTENT_ALERT);
  handleAutomodAction(mediocreQualityComments, userId, LOW_AVERAGE_KARMA_COMMENT_ALERT);
  handleAutomodAction(mediocreQualityPosts, userId, LOW_AVERAGE_KARMA_POST_ALERT);
}

export async function triggerAutomodIfNeeded(userId: string) {
  const user = await Users.findOne(userId);
  if (!user) return;

  await triggerAutomodIfNeededForUser(user);
}

export async function triggerCommentAutomodIfNeeded(commentId: string, vote: DbVote) {
  const context = createAdminContext();

  const previousCommentModeratorActions = await CommentModeratorActions.find({ commentId }, { sort: { createdAt: -1 } }).fetch();
  const existingDownvotedCommentAction = previousCommentModeratorActions.find(action => action.type === DOWNVOTED_COMMENT_ALERT);
  const isDownvote = vote.voteType === 'smallDownvote' || vote.voteType === 'bigDownvote';

  if (!existingDownvotedCommentAction && isDownvote) {
    void createMutator({
      collection: CommentModeratorActions,
      document: {
        type: DOWNVOTED_COMMENT_ALERT,
        commentId
      },
      currentUser: context.currentUser,
      context
    });
  }
}
