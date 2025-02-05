import React from 'react';
import round from "lodash/round"
import moment from "moment"
import { isEAForum, isLW, isLWorAF } from "./instanceSettings"
import { TupleSet, UnionOf } from './utils/typeGuardUtils';
import { memoizeWithExpiration } from './utils/memoizeWithExpiration';
import { isDevelopment } from './executionEnvironment';

export const reviewYears = [2018, 2019, 2020, 2021, 2022, 2023] as const
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
export const REVIEW_YEAR: ReviewYear = 2023

// Deprecated in favor of getReviewTitle and getReviewShortTitle 
export const REVIEW_NAME_TITLE = isEAForum ? 'Effective Altruism: The First Decade' : `The ${REVIEW_YEAR} Review`
export const REVIEW_NAME_IN_SITU = isEAForum ? 'Decade Review' : `${REVIEW_YEAR} Review`

export const reviewElectionName = `reviewVoting${REVIEW_YEAR}`

// This is broken out partly to allow EA Forum or other fora to do reviews with different names
// (previously EA Forum did a "decade review" rather than a single year review)
export function getReviewTitle(reviewYear: ReviewYear): string {
 return `The ${reviewYear} Review`
}

export function getReviewShortTitle(reviewYear: ReviewYear): string {
  return `${reviewYear} Review`
}
export const reviewPostPath = "/posts/pudQtkre7f9GLmb2b/the-2023-lesswrong-review-the-basic-ask"
export const longformReviewTagId = "aRnXghESsn4HDm872"

const reviewPhases = new TupleSet(['UNSTARTED', 'NOMINATIONS', 'REVIEWS', 'VOTING', 'RESULTS', 'COMPLETE'] as const);
export type ReviewPhase = UnionOf<typeof reviewPhases>;

const reviewPhaseCache = memoizeWithExpiration<ReviewPhase>(() => recomputeReviewPhase(), 1000);

export function getReviewPhase(reviewYear?: ReviewYear): ReviewPhase {
  if (reviewYear) {
    return recomputeReviewPhase(reviewYear);
  } else {
    return reviewPhaseCache.get();
  }
}

const TIMEZONE_OFFSET = isDevelopment 
  ? -24*2 // we start testing each phase a few days before it starts
  : 8 // Pacific Time

export function getReviewPeriodStart(reviewYear: ReviewYear = REVIEW_YEAR) {
  return moment.utc(`${reviewYear}-01-01`).add(TIMEZONE_OFFSET, 'hours')
}
export function getReviewPeriodEnd(reviewYear: ReviewYear = REVIEW_YEAR) {
  return moment.utc(`${reviewYear+1}-01-01`).add(TIMEZONE_OFFSET, 'hours')
}

const reviewStart = (reviewYear: ReviewYear) => `${reviewYear+1}-12-02`
const nominationPhaseEnd = (reviewYear: ReviewYear) => `${reviewYear+1}-12-16`
const reviewPhaseEnd = (reviewYear: ReviewYear) => `${reviewYear+2}-01-16`
const votingPhaseEnd = (reviewYear: ReviewYear) => `${reviewYear+2}-02-06`
const resultsPhaseEnd = (reviewYear: ReviewYear) => `${reviewYear+2}-02-10`

export const getReviewStart = (reviewYear: ReviewYear) => moment.utc(reviewStart(reviewYear)).add(TIMEZONE_OFFSET, 'hours')
export const getNominationPhaseEnd = (reviewYear: ReviewYear) => moment.utc(nominationPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours')
export const getReviewPhaseEnd = (reviewYear: ReviewYear) => moment.utc(reviewPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours')
export const getVotingPhaseEnd = (reviewYear: ReviewYear) => moment.utc(votingPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours')
export const getResultsPhaseEnd = (reviewYear: ReviewYear) => moment.utc(resultsPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours')

// these displays are used to show the end of the phase in the review widget,
// because people often interpret the end of the phase as the end of the day
export const getNominationPhaseEndDisplay = (reviewYear: ReviewYear) => moment.utc(nominationPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours').subtract(1, 'days')
export const getReviewPhaseEndDisplay = (reviewYear: ReviewYear) => moment.utc(reviewPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours').subtract(1, 'days')
export const getVotingPhaseEndDisplay = (reviewYear: ReviewYear) => moment.utc(votingPhaseEnd(reviewYear)).add(TIMEZONE_OFFSET, 'hours').subtract(1, 'days')


function recomputeReviewPhase(reviewYear?: ReviewYear): ReviewPhase {
  if (reviewYear !== REVIEW_YEAR) {
    return "COMPLETE"
  }
  const currentDate = moment.utc()
  const reviewStart = getReviewStart(REVIEW_YEAR)
  if (currentDate < reviewStart) return "UNSTARTED"

  const nominationsPhaseEnd = getNominationPhaseEnd(REVIEW_YEAR)
  const reviewPhaseEnd = getReviewPhaseEnd(REVIEW_YEAR)
  const votingEnd = getVotingPhaseEnd(REVIEW_YEAR)
  const reviewEnd = getResultsPhaseEnd(REVIEW_YEAR)
  
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
  return isLWorAF && getReviewPhase() !== "COMPLETE" && getReviewPhase() !== "UNSTARTED"
}

export function eligibleToNominate (currentUser: UsersCurrent|DbUser|null) {
  if (!currentUser) return false;
  if (isLWorAF && moment.utc(currentUser.createdAt).isAfter(moment.utc(`${REVIEW_YEAR}-01-01`))) return false
  if (isEAForum && moment.utc(currentUser.createdAt).isAfter(getReviewStart(REVIEW_YEAR))) return false
  return true
}

export function postEligibleForReview (post: PostsBase) {
  if (moment.utc(post.postedAt) > moment.utc(`${REVIEW_YEAR+1}-01-01`)) return false
  if (isLWorAF && moment.utc(post.postedAt) < moment.utc(`${REVIEW_YEAR}-01-01`)) return false
  if (post.shortform) return false
  return true
}

export function postPassedNomination (post: PostsBase) {
  return getReviewPhase() === "NOMINATIONS" || post.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD
}

export function canNominate (currentUser: UsersCurrent|null, post: PostsListBase) {
  if (!eligibleToNominate(currentUser)) return false
  if (currentUser && (post.userId === currentUser._id || post.coauthors?.map(author => author?._id).includes(currentUser._id))) return false
  return (postEligibleForReview(post))
}

export const currentUserCanVote = (currentUser: UsersCurrent|null) => {
  if (!currentUser) return false
  if (isLWorAF && moment.utc(currentUser.createdAt).isAfter(moment.utc(`${REVIEW_YEAR+1}-01-01`))) return false
  if (isEAForum && moment.utc(currentUser.createdAt).isAfter(getReviewStart(REVIEW_YEAR))) return false
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

export const getCostData = ({costTotal=500}: {costTotal?: number}): Record<number, CostData> => {
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
          <div><em>Costs 45 points (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    2: { 
      value: -getLabelFromCost(10/divider), 
      cost: 10, 
      tooltip: 
        <div>
          <p>Very misleading, harmful, or unimportant.</p>
          <div><em>Costs 10 points (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    3: { 
      value: -getLabelFromCost(1/divider), 
      cost: 1, 
      tooltip: 
        <div>
          <p>Misleading, harmful or unimportant.</p>
          <div><em>Costs 1 point (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    4: { 
      value: 0, 
      cost: 0, 
      tooltip: 
        <div>
          <p>No strong opinion on this post,</p>
          <div><em>Costs 0 points (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    5: { 
      value: getLabelFromCost(1/divider), 
      cost: 1, 
      tooltip: 
        <div>
          <p>Good</p>
          <div><em>Costs 1 point (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    6: { 
      value: getLabelFromCost(10/divider), 
      cost: 10, 
      tooltip: 
        <div>
          <p>Quite important</p>
          <div><em>Costs 10 points (of 500)</em></div>
          {overSpentWarning}
        </div>
    },
    7: { 
      value: getLabelFromCost(45/divider), 
      cost: 45, 
      tooltip: 
        <div>
          <p>Extremely important</p>
          <div><em>Costs 45 points (of 500)</em></div>
          {overSpentWarning}
        </div>
      },
  })
}
