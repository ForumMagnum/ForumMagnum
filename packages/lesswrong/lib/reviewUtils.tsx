import React from 'react';
import round from "lodash/round"
import moment from "moment"
import { forumTypeSetting } from "./instanceSettings"
import { annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart } from "./publicSettings"
import { TupleSet, UnionOf } from './utils/typeGuardUtils';

const isEAForum = forumTypeSetting.get() === "EAForum"
const isLWForum = forumTypeSetting.get() === "LessWrong"

const years = new TupleSet([2018, 2019, 2020, 2021] as const);
export type ReviewYear = UnionOf<typeof years>;

export function getReviewYearFromString(yearParam: string): ReviewYear {
  const year = parseInt(yearParam)
  if (years.has(year)) {
    return year
  }
  throw Error
}

/** Review year is the year under review, not the year in which the review takes place. */
export const REVIEW_YEAR: ReviewYear = 2021

// Deprecated in favor of getReviewTitle and getReviewShortTitle 
export const REVIEW_NAME_TITLE = isEAForum ? 'Effective Altruism: The First Decade' : `The ${REVIEW_YEAR} Review`
export const REVIEW_NAME_IN_SITU = isEAForum ? 'Decade Review' : `${REVIEW_YEAR} Review`

// This is broken out partly to allow EA Forum or other fora to do reviews with different names
// (previously EA Forum did a "decade review" rather than a single year review)
export function getReviewTitle(reviewYear): string {
 return `The ${reviewYear} Review`
}

export function getReviewShortTitle(reviewYear): string {
  return `${reviewYear} Review`
}

const reviewPhases = new TupleSet(['UNSTARTED', 'NOMINATIONS', 'REVIEWS', 'VOTING', 'COMPLETE'] as const);
export type ReviewPhase = UnionOf<typeof reviewPhases>;

export function getReviewPhase(reviewYear?: ReviewYear): ReviewPhase {
  if (reviewYear && reviewYear !== REVIEW_YEAR) {
    return "COMPLETE"
  }

  const currentDate = moment.utc()
  const reviewStart = moment.utc(annualReviewStart.get())

  const nominationsPhaseEnd = moment.utc(annualReviewNominationPhaseEnd.get())
  const reviewPhaseEnd = moment.utc(annualReviewReviewPhaseEnd.get())
  const reviewEnd = moment.utc(annualReviewEnd.get())
  
  if (currentDate < reviewStart) return "UNSTARTED"
  if (currentDate < nominationsPhaseEnd) return "NOMINATIONS"
  if (currentDate < reviewPhaseEnd) return "REVIEWS"
  if (currentDate < reviewEnd) return "VOTING"
  return "COMPLETE"
}

export function getPositiveVoteThreshold(): Number {
  // During the nomination phase, posts require 1 positive reviewVote
  // to appear in review post lists (so a single vote allows others to see it
  // and get prompted to cast additional votes.
  // 
  // Starting in the review phase, posts require at least 2 votes, 
  // ensuring the post is at least plausibly worth everyone's time to review
  return getReviewPhase() === "NOMINATIONS" ? 1 : 2
}

export function getReviewThreshold(): Number {
  // During the voting phase, only show posts with at least 1 review.
  // (it's known that users can still go write reviews in the middle of the 
  // voting phase to add them to lists, and I (Ray) think it's fine. Posts are 
  // still penalized for not having been visible during the full voting period,
  // and it seems fine for people who go out of their way to last-minute-review things
  // to get them at least visible during part of the voting period)
  return getReviewPhase() === "VOTING" ? 1 : 0
}

/** Is there an active review taking place? */
export function reviewIsActive(): boolean {
  if (!(isLWForum || isEAForum)) return false
  return getReviewPhase() !== "COMPLETE"
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
  return getReviewPhase() === "NOMINATIONS" || post.positiveReviewVoteCount >= getPositiveVoteThreshold()
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
    0: { value: null, cost: 0, tooltip: null},
    1: { 
      value: -getLabelFromCost(45/divider), 
      cost: 45, 
      tooltip: 
        <div>
          <p>Highly misleading, harmful, or unimportant.</p>
          <div><em>Costs 45 points</em></div>
          {overSpentWarning}
        </div>
    },
    2: { 
      value: -getLabelFromCost(10/divider), 
      cost: 10, 
      tooltip: 
        <div>
          <p>Very misleading, harmful, or unimportant.</p>
          <div><em>Costs 10 points</em></div>
          {overSpentWarning}
        </div>
    },
    3: { 
      value: -getLabelFromCost(1/divider), 
      cost: 1, 
      tooltip: 
        <div>
          <p>Misleading, harmful or unimportant.</p>
          <div><em>Costs 1 point</em></div>
          {overSpentWarning}
        </div>
    },
    4: { 
      value: 0, 
      cost: 0, 
      tooltip: 
        <div>
          <p>No strong opinion on this post,</p>
          <div><em>Costs 0 points</em></div>
          {overSpentWarning}
        </div>
    },
    5: { 
      value: getLabelFromCost(1/divider), 
      cost: 1, 
      tooltip: 
        <div>
          <p>Good</p>
          <div><em>Costs 1 point</em></div>
          {overSpentWarning}
        </div>
    },
    6: { 
      value: getLabelFromCost(10/divider), 
      cost: 10, 
      tooltip: 
        <div>
          <p>Quite important</p>
          <div><em>Costs 10 points</em></div>
          {overSpentWarning}
        </div>
    },
    7: { 
      value: getLabelFromCost(45/divider), 
      cost: 45, 
      tooltip: 
        <div>
          <p>Extremely important</p>
          <div><em>Costs 45 points</em></div>
          {overSpentWarning}
        </div>
      },
  })
}
