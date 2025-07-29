import { MAX_ALLOWED_CONTACTS_BEFORE_FLAG } from "@/lib/collections/moderatorActions/constants";
import AutomatedContentEvaluations from "../automatedContentEvaluations/collection";
import { DatabasePublicSetting } from "@/lib/publicSettings";
import { getCurrentContentCount } from "@/lib/collections/moderatorActions/helpers";

type ReasonNoReviewNeeded = "alreadyApproved"|"noReview"|"llmRejected"
type ReasonReviewIsNeeded = "mapLocation"|"firstPost"|"firstComment"|"contactedTooManyUsers"|"bio"|"profileImage"|"newContent";
type GetReasonForReviewResult =
    { needsReview: false, reason: ReasonNoReviewNeeded }
  | { needsReview: true, reason: ReasonReviewIsNeeded }
type ReasonForInitialReview = Exclude<ReasonReviewIsNeeded, 'newContent'> 
const reviewReasonsSetting = 
  new DatabasePublicSetting<Array<ReasonForInitialReview>>(
    'moderation.reasonsForInitialReview', 
    ['firstPost', 'firstComment', 'contactedTooManyUsers', 'bio', 'profileImage']
  )

export async function getReasonForReview(user: DbUser|SunshineUsersList, newDocument?: DbPost|DbComment): Promise<GetReasonForReviewResult>
{
  /*
   * This covers several cases
   * 1) never reviewed users
   * 2) users who were removed from the review queue and weren't previously reviewed
   * 3) users who were removed from the review queue and *were* previously reviewed
   * 1 & 2 look indistinguishable, 3 will have a non-null reviewedAt date
   */

  const fullyReviewed = user.reviewedByUserId && !user.snoozedUntilContentCount;
  if (fullyReviewed) {
    return {needsReview: false, reason: 'alreadyApproved'};
  }
  
  const unreviewed = !user.reviewedByUserId;
  const snoozed = user.reviewedByUserId && user.snoozedUntilContentCount;
  
  const reviewReasonMap: Record<ReasonForInitialReview, () => boolean> = {
    mapLocation: () => !!user.mapLocation,
    firstPost: () => !!user.postCount,
    firstComment: () => !!user.commentCount,
    contactedTooManyUsers: () => (user.usersContactedBeforeReview?.length ?? 0) > MAX_ALLOWED_CONTACTS_BEFORE_FLAG,
    // Depends on whether this is DbUser or SunshineUsersList
    bio: () => !!('htmlBio' in user ? user.htmlBio : user.biography?.html),
    profileImage: () => !!user.profileImageId,
  }

  if (unreviewed) {
    const reasonsForInitialReview = reviewReasonsSetting.get()
    for (const reason of reasonsForInitialReview) {
      if (!reviewReasonMap[reason]) throw new Error(`Invalid reason for initial review: ${reason}`)
      if (reviewReasonMap[reason]()) {
        return {needsReview: true, reason}
      }
    }
  } else if (snoozed) {
    const contentCount = getCurrentContentCount(user);
    if (contentCount >= (user.snoozedUntilContentCount ?? 0)) {
      return {needsReview: true, reason: 'newContent'};
    }
  }

  return {needsReview: false, reason: 'noReview'};
}
