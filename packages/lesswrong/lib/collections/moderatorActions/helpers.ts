import moment from "moment";
import { MAX_ALLOWED_CONTACTS_BEFORE_FLAG, RATE_LIMIT_ONE_PER_DAY, RATE_LIMIT_ONE_PER_FORTNIGHT, RATE_LIMIT_ONE_PER_MONTH, RATE_LIMIT_ONE_PER_THREE_DAYS, RATE_LIMIT_ONE_PER_WEEK, AllRateLimitTypes, RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK } from "./constants";
import { GetReasonForReviewResult, ReasonForInitialReview, reviewReasonsSetting } from '@/lib/instanceSettings.ts';

/**
 * For a given RateLimitType, returns the number of hours a user has to wait before posting again.
 */
export function getTimeframeForRateLimit(type: AllRateLimitTypes): number {
  switch(type) {
    case RATE_LIMIT_ONE_PER_DAY:
      return 24; 
    case RATE_LIMIT_ONE_PER_THREE_DAYS:
      return 24 * 3; 
    case RATE_LIMIT_ONE_PER_WEEK:
      return 24 * 7; 
    case RATE_LIMIT_ONE_PER_FORTNIGHT:
      return 24 * 14; 
    case RATE_LIMIT_ONE_PER_MONTH:
      return 24 * 30;
    case RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK:
      return 24 * 7;
  }
}

export function getAverageContentKarma(content: VoteableType[]) {
  const runningContentKarma = content.reduce((prev, curr) => prev + (curr.baseScore ?? 0), 0);
  return runningContentKarma / content.length;
}

interface ModeratableContent extends VoteableType {
  postedAt: Date;
}

type KarmaContentJudgment = {
  lowAverage: false;
  averageContentKarma?: undefined;
} | {
  lowAverage: boolean;
  averageContentKarma: number;
};

export function isLowAverageKarmaContent(content: ModeratableContent[], contentType: 'post' | 'comment'): KarmaContentJudgment {
  if (!content.length) return { lowAverage: false };

  const oneWeekAgo = moment().subtract(7, 'days').toDate();

  // If the user hasn't posted in a while, we don't care if someone's been voting on their old content
  // Also, using postedAt rather than createdAt to avoid posts that have remained as drafts for a while not getting evaluated
  if (content.every(item => item.postedAt < oneWeekAgo)) return { lowAverage: false };
  
  const lastNContent = contentType === 'comment' ? 10 : 5;
  const karmaThreshold = contentType === 'comment' ? 1.5 : 5;

  if (content.length < lastNContent) return { lowAverage: false };

  const lastNContentItems = content.slice(0, lastNContent);
  const averageContentKarma = getAverageContentKarma(lastNContentItems);

  const lowAverage = averageContentKarma < karmaThreshold;
  return { lowAverage, averageContentKarma };
}

export interface UserContentCountPartial {
  postCount?: number,
  commentCount?: number
}

export function getCurrentContentCount(user: UserContentCountPartial) {
  // Note: there's a bug somewhere that sometimes makes postCount or commentCount negative, which breaks things. Math.max ensures minimum of 0.
  const postCount = Math.max(user.postCount ?? 0, 0)
  const commentCount = Math.max(user.commentCount ?? 0, 0)
  return postCount + commentCount
}

export function getReasonForReview(user: DbUser|SunshineUsersList): GetReasonForReviewResult
{
  /**
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
