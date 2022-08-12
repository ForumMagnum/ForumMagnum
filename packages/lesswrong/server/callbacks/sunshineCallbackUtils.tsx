import Users from "../../lib/collections/users/collection";
import { getCurrentContentCount } from '../../components/sunshineDashboard/SunshineNewUsersInfo';

/** This function contains all logic for determining whether a given user needs review in the moderation sidebar.
 * 
 * It's important this this only be be added to async callbacks on posts and comments, so that postCount and commentCount have time to update first
 */
export async function triggerReviewIfNeeded(userId: string) {
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
  }

  void Users.rawUpdateOne({ _id: user._id }, { $set: { needsReview: needsReview } });
}
