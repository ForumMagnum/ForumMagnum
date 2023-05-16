import moment from "moment";
import { isEAForum } from "../../instanceSettings";
import ModeratorActions from "./collection";
import { MAX_ALLOWED_CONTACTS_BEFORE_FLAG, postAndCommentRateLimits, RateLimitModActionType, RATE_LIMIT_ONE_PER_DAY, RATE_LIMIT_ONE_PER_FORTNIGHT, RATE_LIMIT_ONE_PER_MONTH, RATE_LIMIT_ONE_PER_THREE_DAYS, RATE_LIMIT_ONE_PER_WEEK, MODERATOR_ACTION_TYPES } from "./schema";

/**
 * For a given RateLimitType, returns the number of hours a user has to wait before posting again.
 */
export function getTimeframeForRateLimit(type: RateLimitModActionType) {
  let hours 
  switch(type) {
    case RATE_LIMIT_ONE_PER_DAY:
      hours = 24; 
      break;
    case RATE_LIMIT_ONE_PER_THREE_DAYS:
      hours = 24 * 3; 
      break;
    case RATE_LIMIT_ONE_PER_WEEK:
      hours = 24 * 7; 
      break;
    case RATE_LIMIT_ONE_PER_FORTNIGHT:
      hours = 24 * 14; 
      break;
    case RATE_LIMIT_ONE_PER_MONTH:
      hours = 24 * 30;
      break;
  }
  return hours
}

/**
 * Fetches the most recent, active rate limit affecting a user.
 */
export function getModeratorRateLimit(user: DbUser) {
  return ModeratorActions.findOne({
    userId: user._id,
    type: {$in: postAndCommentRateLimits},
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  }, {
    sort: {
      createdAt: -1
    }
  }) as Promise<DbModeratorAction & {type:RateLimitModActionType} | null>
}

export function getAverageContentKarma(content: VoteableType[]) {
  const runningContentKarma = content.reduce((prev, curr) => prev + curr.baseScore, 0);
  return runningContentKarma / content.length;
}

export async function userHasActiveModeratorActionOfType(user: DbUser, moderatorActionType: keyof typeof MODERATOR_ACTION_TYPES): Promise<boolean> {
  const action = await ModeratorActions.findOne({
    userId: user._id,
    type: moderatorActionType,
    $or: [{endedAt: null}, {endedAt: {$gt: new Date()}}]
  });
  return !!action;
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

export function getReasonForReview(user: DbUser | SunshineUsersList, override?: true) {
  if (override) return 'override';

  const fullyReviewed = user.reviewedByUserId && !user.snoozedUntilContentCount;
  /**
   * This covers several cases
   * 1) never reviewed users
   * 2) users who were removed from the review queue and weren't previously reviewed
   * 3) users who were removed from the review queue and *were* previously reviewed
   * 1 & 2 look indistinguishable, 3 will have a non-null reviewedAt date
   */ 
  const unreviewed = !user.reviewedByUserId;
  const snoozed = user.reviewedByUserId && user.snoozedUntilContentCount;

  if (fullyReviewed) return 'alreadyApproved';

  if (unreviewed) {
    if (user.mapLocation && isEAForum) return 'mapLocation';
    if (user.postCount) return 'firstPost';
    if (user.commentCount) return 'firstComment';
    if (user.usersContactedBeforeReview?.length > MAX_ALLOWED_CONTACTS_BEFORE_FLAG) return 'contactedTooManyUsers';
    // Depends on whether this is DbUser or SunshineUsersList
    const htmlBio = 'htmlBio' in user ? user.htmlBio : user.biography?.html;
    if (htmlBio) return 'bio';
    if (user.profileImageId) return 'profileImage';  
  } else if (snoozed) {
    const contentCount = getCurrentContentCount(user);
    if (contentCount >= user.snoozedUntilContentCount) return 'newContent';
  }

  return 'noReview';
}
