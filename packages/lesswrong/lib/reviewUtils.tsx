import React from 'react';
import round from "lodash/round"
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
  if (!(isLWForum || isEAForum)) return false
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

const getPointsFromCost = (cost) => {
  // the formula to quadratic cost from a number of points is (n^2 + n)/2
  // this uses the inverse of that formula to take in a cost and output a number of points
  return (-1 + Math.sqrt((8 * cost)+1)) / 2
}

const getLabelFromCost = (cost) => {
  // rounds the points to 1 decimal for easier reading
  return round(getPointsFromCost(cost), 1)
}

export const getCostData = ({costTotal=500}:{costTotal?:number}) => {
  const divider = costTotal > 500 ? costTotal/500 : 1
  const overSpentWarning = (divider !== 1) ? <div><em>Your vote is downweighted because you spent 500+ points</em></div> : null
  return ({
    0: {label: null, cost: 0, tooltip: null},
    1: { label: `-${getLabelFromCost(45/divider)}`, cost: 45, tooltip: 
      <div>
        <p>Highly misleading, harmful, or unimportant.</p>
        <div><em>Costs 45 points</em></div>
        {overSpentWarning}
      </div>},
    2: { label: `-${getLabelFromCost(10/divider)}`, cost: 10, tooltip: 
    <div>
      <p>Very misleading, harmful, or unimportant.</p>
      <div><em>Costs 10 points</em></div>
      {overSpentWarning}
    </div>},
    3: { label: `-${getLabelFromCost(1/divider)}`, cost: 1, tooltip: 
    <div>
      <p>Misleading, harmful or unimportant.</p>
      <div><em>Costs 1 point</em></div>
      {overSpentWarning}
    </div>},
    4: { label: `0`, cost: 0, tooltip: 
    <div>
      <p>No strong opinion on this post,</p>
      <div><em>Costs 0 points</em></div>
      {overSpentWarning}
    </div>},
    5: { label: `${getLabelFromCost(1/divider)}`, cost: 1, tooltip: 
    <div>
      <p>Good</p>
      <div><em>Costs 1 point</em></div>
      {overSpentWarning}
    </div>},
    6: { label: `${getLabelFromCost(10/divider)}`, cost: 10, tooltip: 
    <div>
      <p>Quite important</p>
      <div><em>Costs 10 points</em></div>
      {overSpentWarning}
    </div>},
    7: { label: `${getLabelFromCost(45/divider)}`, cost: 45, tooltip: 
    <div>
      <p>Extremely important</p>
      <div><em>Costs 45 points</em></div>
      {overSpentWarning}
    </div>},
  })
}
