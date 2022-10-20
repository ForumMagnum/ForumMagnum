import Users from "../../lib/collections/users/collection";
import { getCurrentContentCount } from '../../components/sunshineDashboard/SunshineNewUsersInfo';
import { Comments } from "../../lib/collections/comments";
import { ModeratorActions } from "../../lib/collections/moderatorActions";
import { createMutator } from "../vulcan-lib";
import { COMMENT_LOW_QUALITY_WARNING, COMMENT_MEDIOCRE_QUALITY_WARNING, isActionActive } from "../../lib/collections/moderatorActions/schema";
import { forumTypeSetting } from "../../lib/instanceSettings";

/** This function contains all logic for determining whether a given user needs review in the moderation sidebar.
 * 
 * It's important this this only be be added to async callbacks on posts and comments, so that postCount and commentCount have time to update first
 */

export function getReasonForReview(user: DbUser, override?: true) {
  if (override && forumTypeSetting.get() === 'LessWrong') return 'override';

  const fullyReviewed = user.reviewedByUserId && !user.snoozedUntilContentCount;
  const neverReviewed = !user.reviewedByUserId;
  const snoozed = user.reviewedByUserId && user.snoozedUntilContentCount;

  if (fullyReviewed) return 'alreadyApproved';

  if (neverReviewed) {
    if (user.voteCount > 20) return 'voteCount';
    if (user.mapLocation) return 'mapLocation';
    if (user.postCount) return 'firstPost';
    if (user.commentCount) return 'firstComment';
    if (user.biography?.html) return 'bio';
    if (user.profileImageId) return 'profileImage';  
  } else if (snoozed) {
    const contentCount = getCurrentContentCount(user);
    if (contentCount >= user.snoozedUntilContentCount) return 'newContent';
  }

  return 'noReview';
}

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

function areLowQualityComments(comments: DbComment[]) {
  if (comments.length < 5) return false;

  const lastFiveComments = comments.slice(0, 5);
  const badCommentCountThreshold = 2;
  const downvotedCommentCount = lastFiveComments.filter(isNetDownvoted).length;

  return downvotedCommentCount >= badCommentCountThreshold;
}

function areMediocreQualityComments(comments: DbComment[]) {
  if (comments.length < 20) return false;

  const mediocreAverageKarmaThreshold = 1.5;
  const runningCommentKarma = comments.reduce((prev, curr) => prev + curr.baseScore, 0);
  const averageCommentKarma = runningCommentKarma / comments.length;

  return averageCommentKarma < mediocreAverageKarmaThreshold;
}

async function triggerCommentQualityWarning(userId: string, warningType: DbModeratorAction['type']) {
  const lastModeratorAction = await ModeratorActions.findOne({ userId, type: warningType }, { sort: { createdAt: -1 } });
  // No previous commentQualityWarning on record for this user
  if (!lastModeratorAction) {
    void createMutator({
      collection: ModeratorActions,
      document: {
        type: warningType,
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
        type: warningType,
        userId  
      },
    });
  }
}

export async function triggerAutomodIfNeeded(userId: string) {
  const latestComments = await Comments.find({ userId }, { sort: { postedAt: -1 }, limit: 20 }).fetch();
  // TODO: vary threshold based on other user info (i.e. age/karma/etc)?
  if (areLowQualityComments(latestComments)) {
    void triggerCommentQualityWarning(userId, COMMENT_LOW_QUALITY_WARNING);
  }

  if (areMediocreQualityComments(latestComments)) {
    void triggerCommentQualityWarning(userId, COMMENT_MEDIOCRE_QUALITY_WARNING);
  }
}
