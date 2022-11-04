import { forumTypeSetting } from "../../instanceSettings";

export function getAverageContentKarma(content: VoteableType[]) {
  const runningContentKarma = content.reduce((prev, curr) => prev + curr.baseScore, 0);
  return runningContentKarma / content.length;
}

export function isLowAverageKarmaContent(content: VoteableType[], contentType: 'post' | 'comment') {
  if (!content.length) return { lowAverage: false };
  
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
  const postCount = user.postCount ?? 0
  const commentCount = user.commentCount ?? 0
  return postCount + commentCount
}

export function getReasonForReview(user: DbUser | SunshineUsersList, override?: true) {
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