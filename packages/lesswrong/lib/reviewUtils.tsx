import React from 'react';
import round from "lodash/round"
import moment from "moment"
import { forumTypeSetting } from "./instanceSettings"
import { annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart, annualReviewVotingPhaseEnd } from "./publicSettings"
import { TupleSet, UnionOf } from './utils/typeGuardUtils';

const isEAForum = forumTypeSetting.get() === "EAForum"
const isLWForum = forumTypeSetting.get() === "LessWrong"

export const reviewYears = [2018, 2019, 2020, 2021] as const
const years = new TupleSet(reviewYears);
export type ReviewYear = UnionOf<typeof years>;

export function getReviewYearFromString(yearParam: string): ReviewYear {
  const year = parseInt(yearParam)
  if (years.has(year)) {
    return year
  }
  throw Error("Not a valid Review Year")
}

/** Review year is the year under review, not the year in which the review takes place. */
export const REVIEW_YEAR: ReviewYear = 2021

// Deprecated in favor of getReviewTitle and getReviewShortTitle 
export const REVIEW_NAME_TITLE = isEAForum ? 'Effective Altruism: The First Decade' : `The ${REVIEW_YEAR} Review`
export const REVIEW_NAME_IN_SITU = isEAForum ? 'Decade Review' : `${REVIEW_YEAR} Review`

// This is broken out partly to allow EA Forum or other fora to do reviews with different names
// (previously EA Forum did a "decade review" rather than a single year review)
export function getReviewTitle(reviewYear: ReviewYear): string {
 return `The ${reviewYear} Review`
}

export function getReviewShortTitle(reviewYear: ReviewYear): string {
  return `${reviewYear} Review`
}

const reviewPhases = new TupleSet(['UNSTARTED', 'NOMINATIONS', 'REVIEWS', 'VOTING', 'RESULTS', 'COMPLETE'] as const);
export type ReviewPhase = UnionOf<typeof reviewPhases>;

export function getReviewPhase(reviewYear?: ReviewYear): ReviewPhase {
  if (reviewYear && reviewYear !== REVIEW_YEAR) {
    return "COMPLETE"
  }

  const currentDate = moment.utc()
  const reviewStart = moment.utc(annualReviewStart.get())
  if (currentDate < reviewStart) return "UNSTARTED"

  const nominationsPhaseEnd = moment.utc(annualReviewNominationPhaseEnd.get())
  const reviewPhaseEnd = moment.utc(annualReviewReviewPhaseEnd.get())
  const votingEnd = moment.utc(annualReviewVotingPhaseEnd.get())
  const reviewEnd = moment.utc(annualReviewEnd.get())
  
  if (currentDate < nominationsPhaseEnd) return "NOMINATIONS"
  if (currentDate < reviewPhaseEnd) return "REVIEWS"
  if (currentDate < votingEnd) return "VOTING"
  if (currentDate < reviewEnd) return "RESULTS"
  return "COMPLETE"
}

// The number of positive review votes required for a post to appear in the ReviewVotingPage  
// during the nominations phase
export const INITIAL_VOTECOUNT_THRESHOLD = 1

// The number of positive review votes required for a post to enter the Review Phase
export const REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD = 2

// The Quick Review Page is optimized for prioritizing people's attention.
// Among other things, this means only loading posts that got at either at least one
// person thought was reasonably important, or at least 4 people thought were "maybe important?"
export const QUICK_REVIEW_SCORE_THRESHOLD = 4

export function getPositiveVoteThreshold(reviewPhase?: ReviewPhase): Number {
  // During the nomination phase, posts require 1 positive reviewVote
  // to appear in review post lists (so a single vote allows others to see it
  // and get prompted to cast additional votes.
  // 
  // Starting in the review phase, posts require at least 2 votes, 
  // ensuring the post is at least plausibly worth everyone's time to review
  const phase = reviewPhase ?? getReviewPhase()
  
  return phase === "NOMINATIONS" ? INITIAL_VOTECOUNT_THRESHOLD : REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD
}

export const INITIAL_REVIEW_THRESHOLD = 0
export const VOTING_PHASE_REVIEW_THRESHOLD = 1

/** Is there an active review taking place? */
export function reviewIsActive(): boolean {
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
  return getReviewPhase() === "NOMINATIONS" || post.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD

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

const getPointsFromCost = (cost: number) => {
  // the formula to quadratic cost from a number of points is (n^2 + n)/2
  // this uses the inverse of that formula to take in a cost and output a number of points
  return (-1 + Math.sqrt((8 * cost)+1)) / 2
}

const getLabelFromCost = (cost: number) => {
  // rounds the points to 1 decimal for easier reading
  return round(getPointsFromCost(cost), 1)
}

export type VoteIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CostData {
  value: number | null;
  cost: number;
  tooltip: JSX.Element | null;
}

export const getCostData = ({costTotal=500}:{costTotal?:number}): Record<number, CostData> => {
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
