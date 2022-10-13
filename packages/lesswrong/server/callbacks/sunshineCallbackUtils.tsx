import Users from "../../lib/collections/users/collection";
import { getCurrentContentCount } from '../../components/sunshineDashboard/SunshineNewUsersInfo';
import { Comments } from "../../lib/collections/comments";
import { ModeratorActions } from "../../lib/collections/moderatorActions";
import { createMutator } from "../vulcan-lib";
import { isActionActive } from "../../lib/collections/moderatorActions/schema";
import { forumTypeSetting } from "../../lib/instanceSettings";

/** This function contains all logic for determining whether a given user needs review in the moderation sidebar.
 * 
 * It's important this this only be be added to async callbacks on posts and comments, so that postCount and commentCount have time to update first
 */
export async function triggerReviewIfNeeded(userId: string, newModeAction?: true) {
  const user = await Users.findOne({ _id: userId });
  if (!user)
    throw new Error("user is null");

  let needsReview = false;

  const fullyReviewed = user.reviewedByUserId && !user.snoozedUntilContentCount;
  const neverReviewed = !user.reviewedByUserId;
  const snoozed = user.reviewedByUserId && user.snoozedUntilContentCount;

  if (fullyReviewed) {
    needsReview = false;
  } else if (neverReviewed) {
    needsReview = Boolean((user.voteCount > 20) || user.mapLocation || user.postCount || user.commentCount || user.biography?.html || user.profileImageId);
  } else if (snoozed) {
    const contentCount = getCurrentContentCount(user);
    needsReview = contentCount >= user.snoozedUntilContentCount;
  } else if (newModeAction && forumTypeSetting.get() === 'LessWrong') {
    needsReview = true;
  }

  void Users.rawUpdateOne({ _id: user._id }, { $set: { needsReview: needsReview } });
}

function isNetDownvoted(comment: DbComment) {
  return comment.baseScore <= 0 && comment.voteCount > 0;
}

function recentDownvotedComments(comments: DbComment[]) {
  const threshold = 2;
  const downvotedCommentCount = comments.filter(isNetDownvoted).length;

  return downvotedCommentCount >= threshold;
}

export async function triggerAutomodIfNeeded(userId: string) {
  const latestComments = await Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch();
  // TODO: vary threshold based on other user info (i.e. age/karma/etc)?
  if (recentDownvotedComments(latestComments)) {
    const lastModeratorAction = await ModeratorActions.findOne({ userId, type: 'commentQualityWarning' }, { sort: { createdAt: -1 } });
    // No previous commentQualityWarning on record for this user
    if (!lastModeratorAction) {
      void createMutator({
        collection: ModeratorActions,
        document: {
          type: 'commentQualityWarning',
          userId
        },
      });

      // User already has an active commentQualityWarning, escalate?
    } else if (isActionActive(lastModeratorAction)) {
      // TODO

      // User has an inactive commentQualityWarning, re-apply?
    } else {
      void createMutator({
        collection: ModeratorActions,
        document: {
          type: 'commentQualityWarning',
          userId  
        },
      });
    }
  }
}
