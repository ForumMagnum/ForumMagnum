import { spamRiskScoreThreshold } from '@/lib/collections/users/helpers';

interface QueueUser extends Pick<SunshineUsersList, '_id' | 'reviewGroup' | 'needsReview' | 'banned' | 'signUpReCaptchaRating'> {}

// Match the normalized sunshineNewUsers view, including direct links.
// reviewedByUserId: null in the view allows any value; it does not filter reviewed users.
function isQueuedUser(user: QueueUser): boolean {
  return !!user.needsReview && user.banned == null
    && (user.signUpReCaptchaRating == null || user.signUpReCaptchaRating > spamRiskScoreThreshold * 1.25);
}

/** Apply local removals, undo, and group changes to the full server snapshot. */
export function getAdjustedReviewGroupCounts(
  initialCounts: Record<ReviewGroup, number>,
  initialUsers: QueueUser[],
  currentUsers: QueueUser[],
): Record<ReviewGroup, number> {
  const { newContent, offboard, highContext, maybeSpam, automod, snoozeExpired, unknown } = initialCounts;
  const counts = { newContent, offboard, highContext, maybeSpam, automod, snoozeExpired, unknown };
  for (const user of initialUsers) {
    if (isQueuedUser(user)) counts[user.reviewGroup ?? 'unknown']--;
  }
  for (const user of currentUsers) {
    if (isQueuedUser(user)) counts[user.reviewGroup ?? 'unknown']++;
  }
  return counts;
}

export interface UserQueueTabCount {
  fetched: number;
  remaining: number;
}

export function getUserQueueTabCount(
  totalCount: number,
  users: QueueUser[],
  group: ReviewGroup | 'all',
): UserQueueTabCount {
  const fetched = users.filter(user => isQueuedUser(user) && (group === 'all' || (user.reviewGroup ?? 'unknown') === group)).length;
  return { fetched, remaining: totalCount - fetched };
}
