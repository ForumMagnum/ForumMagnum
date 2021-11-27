import moment from "moment"
import { annualReviewEnd, annualReviewNominationPhaseEnd, annualReviewReviewPhaseEnd, annualReviewStart } from "./publicSettings"

export type ReviewYear = 2018 | 2019 | 2020

// TODO: maybe database setting, or global constant, for use in routes
export const REVIEW_YEAR: ReviewYear = 2020

export type ReviewPhase = "NOMINATIONS" | "REVIEWS" | "VOTING"

export function getReviewPhase(): ReviewPhase | void {
  const currentDate = moment()
  const reviewStart = moment(annualReviewStart.get())
  const nominationsPhaseEnd = moment(annualReviewNominationPhaseEnd.get())
  const reviewPhaseEnd = moment(annualReviewReviewPhaseEnd.get())
  const reviewEnd = moment(annualReviewEnd.get())
  
  if (currentDate < reviewStart || reviewEnd < currentDate) return
  if (currentDate < nominationsPhaseEnd) return "NOMINATIONS"
  if (currentDate < reviewPhaseEnd) return "REVIEWS"
  if (currentDate < reviewEnd) return "VOTING"
  return
}
