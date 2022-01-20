import moment from "moment"
import { forumTypeSetting } from "./instanceSettings"
import { annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart } from "./publicSettings"

const isEAForum = forumTypeSetting.get() === "EAForum"
const isLWForum = forumTypeSetting.get() === "LessWrong"

export type ReviewYear = 2018 | 2019 | 2020

/** Review year is the year under review, not the year in which the review takes place. */
export const REVIEW_YEAR: ReviewYear = 2020

// Probably only used while the EA Forum is doing something sufficiently different
export const REVIEW_NAME_TITLE = isEAForum ? 'Effective Altruism: The First Decade' : `The ${REVIEW_YEAR} Review`
export const REVIEW_NAME_IN_SITU = isEAForum ? 'Decade Review' : `${REVIEW_YEAR} Review`

export type ReviewPhase = "NOMINATIONS" | "REVIEWS" | "VOTING"

export function getReviewPhase(): ReviewPhase | void {
  const currentDate = moment.utc()
  const reviewStart = moment.utc(annualReviewStart.get())
  // Add 1 day because the end dates are inclusive
  const nominationsPhaseEnd = moment.utc(annualReviewNominationPhaseEnd.get()).add(1, "day")
  const reviewPhaseEnd = moment.utc(annualReviewReviewPhaseEnd.get()).add(1, "day")
  const reviewEnd = moment.utc(annualReviewEnd.get()).add(1, "day")
  
  if (currentDate < reviewStart) return
  if (currentDate < nominationsPhaseEnd) return "NOMINATIONS"
  if (currentDate < reviewPhaseEnd) return "REVIEWS"
  if (currentDate < reviewEnd) return "VOTING"
  return
}

/** Is there an active review taking place? */
export function reviewIsActive(): boolean {
  return !!getReviewPhase()
}

export function eligibleToNominate (currentUser: UsersCurrent|null) {
  if (!currentUser) return false;
  if (isLWForum && new Date(currentUser.createdAt) > new Date(`${REVIEW_YEAR}-01-01`)) return false
  if (isEAForum && new Date(currentUser.createdAt) > new Date(annualReviewStart.get())) return false
  return true
}

export function postEligibleForReview (post: PostsBase) {
  if (new Date(post.postedAt) > new Date(`${REVIEW_YEAR+1}-01-01`)) return false
  if (isLWForum && new Date(post.postedAt) < new Date(`${REVIEW_YEAR}-01-01`)) return false
  return true
}

export function postIsVoteable (post: PostsBase) {
  return getReviewPhase() === "NOMINATIONS" || post.positiveReviewVoteCount > 0
}


export function canNominate (currentUser: UsersCurrent|null, post: PostsBase) {
  if (!eligibleToNominate(currentUser)) return false
  if (post.userId === currentUser!._id) return false
  if (!postIsVoteable(post)) return false
  return (postEligibleForReview(post))
}

export const currentUserCanVote = (currentUser: UsersCurrent|null) => {
  if (!currentUser) return false
  if (isLWForum && new Date(currentUser.createdAt) > new Date(`${REVIEW_YEAR+1}-01-01`)) return false
  if (isEAForum && new Date(currentUser.createdAt) > new Date(annualReviewStart.get())) return false
  return true
}
