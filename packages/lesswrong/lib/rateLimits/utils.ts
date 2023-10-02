import groupBy from "lodash/groupBy"
import uniq from "lodash/uniq"
import moment from "moment"
import { getDownvoteRatio } from "../../components/sunshineDashboard/UsersReviewInfoCard"
import { forumSelect } from "../forumTypeUtils"
import { userIsAdmin, userIsMemberOf } from "../vulcan-users"
import { autoCommentRateLimits, autoPostRateLimits } from "./constants"
import { AutoRateLimit, RateLimitComparison, RateLimitInfo, rateLimitThresholds, RecentKarmaInfo, RecentVoteInfo, TimeframeUnitType, UserRateLimitGroupFields, UserKarmaInfo, UserKarmaInfoWindow, UserRateLimitFields } from "./types"

export function getModRateLimitInfo(documents: Array<DbPost|DbComment>, modRateLimitHours: number, itemsPerTimeframe: number): RateLimitInfo|null {
  if (modRateLimitHours <= 0) return null
  const nextEligible = getNextAbleToSubmitDate(documents, "hours", modRateLimitHours, itemsPerTimeframe)
  if (!nextEligible) return null
  return {
    nextEligible,
    rateLimitMessage: "A moderator has rate limited you.",
    rateLimitType: "moderator"
  }
}

export function getUserRateLimitIntervalHours(userRateLimit: DbUserRateLimit | null): number {
  if (!userRateLimit) return 0;
  return moment.duration(userRateLimit.intervalLength, userRateLimit.intervalUnit).asHours();
}

export function getMaxAutoLimitHours(rateLimits?: Array<AutoRateLimit>) {
  if (!rateLimits) return 0
  return Math.max(...rateLimits.map(({timeframeLength, timeframeUnit}) => {
    return moment.duration(timeframeLength, timeframeUnit).asHours()
  }))
}

export function shouldIgnorePostRateLimit(user: UserRateLimitGroupFields) {
  return userIsAdmin(user) || userIsMemberOf(user, "sunshineRegiment") || userIsMemberOf(user, "canBypassPostRateLimit")
}

export function getStrictestRateLimitInfo(rateLimits: Array<RateLimitInfo|null>): RateLimitInfo | null {
  const nonNullRateLimits = rateLimits.filter((rateLimit): rateLimit is RateLimitInfo => rateLimit !== null)
  const sortedRateLimits = nonNullRateLimits.sort((a, b) => b.nextEligible.getTime() - a.nextEligible.getTime());
  return sortedRateLimits[0] ?? null;
}

export function getUserRateLimitInfo(userRateLimit: DbUserRateLimit|null, documents: Array<DbPost|DbComment>): RateLimitInfo|null {
  if (!userRateLimit) return null
  const nextEligible = getNextAbleToSubmitDate(documents, userRateLimit.intervalUnit, userRateLimit.intervalLength, userRateLimit.actionsPerInterval)
  if (!nextEligible) return null
  return {
    nextEligible,
    rateLimitType: "moderator",
    rateLimitMessage: "A moderator has rate limited you."
  }
}

export function shouldRateLimitApply(user: UserKarmaInfo, rateLimit: AutoRateLimit, recentKarmaInfo: RecentKarmaInfo): boolean {
  // rate limit conditions
  const { karmaThreshold, downvoteRatioThreshold, 
          last20KarmaThreshold, last20PostKarmaThreshold: recentPostKarmaThreshold, last20CommentKarmaThreshold: recentCommentKarmaThreshold,
          downvoterCountThreshold, postDownvoterCountThreshold, commentDownvoterCountThreshold, 
          lastMonthKarmaThreshold, lastMonthDownvoterCountThreshold } = rateLimit

  // user's recent karma info
  const { last20Karma, lastMonthKarma, last20PostKarma, last20CommentKarma, 
          downvoterCount, postDownvoterCount, commentDownvoterCount, lastMonthDownvoterCount } = recentKarmaInfo
  
  // Karma is actually sometimes null, and numeric comparisons with null always return false (sometimes incorrectly)
  if ((karmaThreshold !== undefined) && (user.karma ?? 0) > karmaThreshold) return false 
  if ((downvoteRatioThreshold !== undefined) && getDownvoteRatio(user) < downvoteRatioThreshold) return false

  if ((last20KarmaThreshold !== undefined) && (last20Karma > last20KarmaThreshold)) return false
  if ((recentPostKarmaThreshold !== undefined) && (last20PostKarma > recentPostKarmaThreshold)) return false
  if ((recentCommentKarmaThreshold !== undefined) && (last20CommentKarma > recentCommentKarmaThreshold)) return false

  if ((lastMonthKarmaThreshold !== undefined && (lastMonthKarma > lastMonthKarmaThreshold))) return false
  if ((lastMonthDownvoterCountThreshold !== undefined && (lastMonthDownvoterCount > lastMonthDownvoterCountThreshold))) return false

  if ((downvoterCountThreshold !== undefined) && (downvoterCount < downvoterCountThreshold)) return false
  if ((postDownvoterCountThreshold !== undefined) && (postDownvoterCount < postDownvoterCountThreshold)) return false
  if ((commentDownvoterCountThreshold !== undefined) && (commentDownvoterCount < commentDownvoterCountThreshold)) return false

  return true
}

export function getNextAbleToSubmitDate(documents: Array<DbPost|DbComment>, timeframeUnit: TimeframeUnitType, timeframeLength: number, itemsPerTimeframe: number): Date|null {
  // make sure documents are sorted by descending date
  const sortedDocs = documents.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  const docsInTimeframe = sortedDocs.filter(doc => doc.postedAt > moment().subtract(timeframeLength, timeframeUnit).toDate())
  const doc = docsInTimeframe[itemsPerTimeframe - 1]
  if (!doc) return null 
  return moment(doc.postedAt).add(timeframeLength, timeframeUnit).toDate()
}

export function getAutoRateLimitInfo(user: UserRateLimitFields, rateLimit: AutoRateLimit,  documents: Array<DbPost|DbComment>, recentKarmaInfo: RecentKarmaInfo): RateLimitInfo|null {
  // rate limit effects
  const { timeframeUnit, timeframeLength, itemsPerTimeframe, rateLimitMessage, rateLimitType } = rateLimit 

  if (!shouldRateLimitApply(user, rateLimit, recentKarmaInfo)) return null

  const nextEligible = getNextAbleToSubmitDate(documents, timeframeUnit, timeframeLength, itemsPerTimeframe)
  if (!nextEligible) return null 
  return { nextEligible, rateLimitType, rateLimitMessage }
}

function getVotesOnLatestDocuments (votes: RecentVoteInfo[], numItems=20): RecentVoteInfo[] {
  // sort the votes via the date of the *postedAt* (joined from )
  const sortedVotes = votes.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime())
  
  const uniqueDocumentIds = uniq(sortedVotes.map((vote) => vote.documentId))
  const latestDocumentIds = new Set(uniqueDocumentIds.slice(0, numItems))

  // get all votes whose documentId is in the top 20 most recent documents
  return sortedVotes.filter((vote) => latestDocumentIds.has(vote.documentId))
}

function getDownvoterCount (votes: RecentVoteInfo[]) {
  const downvoters = votes.filter((vote: RecentVoteInfo) => vote.power < 0 && vote.totalDocumentKarma <= 0).map((vote: RecentVoteInfo) => vote.userId)
  return uniq(downvoters).length
}

export function calculateRecentKarmaInfo(userId: string, allVotes: RecentVoteInfo[]): RecentKarmaInfo  {
  const top20DocumentVotes = getVotesOnLatestDocuments(allVotes)
  
  // We filter out the user's self-upvotes here, rather than in the query, because
  // otherwise the getLatest20contentItems won't know about all the relevant posts and comments. 
  // i.e. if a user comments 20 times, and nobody upvotes them, we wouldn't know to include them in the sorted list
  // (the alternative here would be making an additional query for all posts/comments, regardless of who voted on them,
  // which seemed at least as expensive as filtering out the self-votes here)
  const nonuserIDallVotes = allVotes.filter((vote: RecentVoteInfo) => vote.userId !== userId)
  const nonUserIdTop20DocVotes = top20DocumentVotes.filter((vote: RecentVoteInfo) => vote.userId !== userId)
  const postVotes = nonuserIDallVotes.filter(vote => vote.collectionName === "Posts")
  const commentVotes = nonuserIDallVotes.filter(vote => vote.collectionName === "Comments")

  const oneMonthAgo = moment().subtract(30, 'days').toDate();
  const lastMonthVotes = nonUserIdTop20DocVotes.filter(vote => vote.postedAt > oneMonthAgo)
  const lastMonthKarma = lastMonthVotes.reduce((sum: number, vote: RecentVoteInfo) => sum + vote.power, 0)

  const last20Karma = nonUserIdTop20DocVotes.reduce((sum: number, vote: RecentVoteInfo) => sum + vote.power, 0)
  const last20PostKarma = postVotes.reduce((sum: number, vote: RecentVoteInfo) => sum + vote.power, 0)
  const last20CommentKarma = commentVotes.reduce((sum: number, vote: RecentVoteInfo) => sum + vote.power, 0)

  const downvoterCount = getDownvoterCount(nonUserIdTop20DocVotes)
  const commentDownvoterCount = getDownvoterCount(commentVotes)
  const postDownvoterCount = getDownvoterCount(postVotes)
  const lastMonthDownvoterCount = getDownvoterCount(lastMonthVotes)
  
  return { 
    last20Karma: last20Karma ?? 0, 
    lastMonthKarma: lastMonthKarma ?? 0,
    last20PostKarma: last20PostKarma ?? 0,
    last20CommentKarma: last20CommentKarma ?? 0,
    downvoterCount: downvoterCount ?? 0, 
    postDownvoterCount: postDownvoterCount ?? 0,
    commentDownvoterCount: commentDownvoterCount ?? 0,
    lastMonthDownvoterCount: lastMonthDownvoterCount ?? 0
  }
}

function getRateLimitName (rateLimit: AutoRateLimit) {
  let rateLimitName = `${rateLimit.itemsPerTimeframe} ${rateLimit.actionType} per ${rateLimit.timeframeLength} ${rateLimit.timeframeUnit}`
  const thresholdInfo = rateLimitThresholds.map(threshold => rateLimit[threshold] ? `${rateLimit[threshold]} ${threshold.replace("Threshold", "")}` : undefined).filter(threshold => threshold)
  return rateLimitName += ` (${thresholdInfo.join(", ")})`
}

function getActiveRateLimits<T extends AutoRateLimit>(user: UserKarmaInfo & { recentKarmaInfo: RecentKarmaInfo }, autoRateLimits: T[]) {
  const nonUniversalLimits = autoRateLimits.filter(rateLimit => rateLimit.rateLimitType !== "universal")
  return nonUniversalLimits.filter(rateLimit => shouldRateLimitApply(user, rateLimit, user.recentKarmaInfo))
}

export function getActiveRateLimitNames(user: SunshineUsersList, autoRateLimits: AutoRateLimit[]) {
  return getActiveRateLimits(user, autoRateLimits).map(rateLimit => getRateLimitName(rateLimit))
}

export function getStrictestActiveRateLimitNames (user: UserKarmaInfo & { recentKarmaInfo: RecentKarmaInfo }, autoRateLimits: AutoRateLimit[]) {
  const activeRateLimits = getActiveRateLimits(user, autoRateLimits)
  const rateLimitsByType = Object.values(
    groupBy(activeRateLimits, rateLimit => `${rateLimit.timeframeUnit}${rateLimit.actionType}`)
  )
  const strictestRateLimits = Object.values(rateLimitsByType).map(rateLimit => {
    return rateLimit.sort((a, b) => {
      const rateLimitASeverity = a.itemsPerTimeframe/a.timeframeLength
      const rateLimitBSeverity = b.itemsPerTimeframe/b.timeframeLength
      return rateLimitASeverity - rateLimitBSeverity
    })[0]
  })
  return strictestRateLimits.map(rateLimit => getRateLimitName(rateLimit))
}

function sortRateLimitsByTimeframe<T extends AutoRateLimit>(rateLimits: T[]) {
  const now = Date.now();

  return [...rateLimits].sort((a, b) => (
    moment(now)
      .add(b.timeframeLength / b.itemsPerTimeframe, b.timeframeUnit)
      .diff(
        moment(now).add(a.timeframeLength / a.itemsPerTimeframe, a.timeframeUnit)
      )
  ));
}

function areNewRateLimitsStricter<T extends AutoRateLimit>(newRateLimits: T[], oldRateLimits: T[]): RateLimitComparison<T> {
  if (newRateLimits.length === 0) {
    return { isStricter: false };
  }

  const now = Date.now();

  // Cast because we check that it's non-zero length above
  const strictestNewRateLimit = sortRateLimitsByTimeframe(newRateLimits).shift() as T;
  const strictestOldRateLimit = sortRateLimitsByTimeframe(oldRateLimits).shift();

  if (!strictestOldRateLimit) {
    return { isStricter: true, strictestNewRateLimit };
  }

  const { timeframeLength: newLength, timeframeUnit: newUnit, itemsPerTimeframe: newItemsPerTimeframe } = strictestNewRateLimit;
  const { timeframeLength: oldLength, timeframeUnit: oldUnit, itemsPerTimeframe: oldItemsPerTimeframe } = strictestOldRateLimit;

  const newRateLimitMoment = moment(now).add(newLength / newItemsPerTimeframe, newUnit);
  const oldRateLimitMoment = moment(now).add(oldLength / oldItemsPerTimeframe, oldUnit);

  const isStricter = newRateLimitMoment.isAfter(oldRateLimitMoment);
  if (isStricter) {
    return { isStricter, strictestNewRateLimit };
  } else {
    return { isStricter };
  }
}

export function getCurrentAndPreviousUserKarmaInfo(user: DbUser, currentVotes: RecentVoteInfo[], previousVotes: RecentVoteInfo[]): UserKarmaInfoWindow {
  const currentKarmaInfo = calculateRecentKarmaInfo(user._id, currentVotes);
  const previousKarmaInfo = calculateRecentKarmaInfo(user._id, previousVotes);

  // Adjust the user's karma back to what it was before the most recent vote
  // This doesn't always handle the case where the voter is modifying an existing vote's strength correctly, but we don't really care about those
  const mostRecentVotePower = currentVotes[0].power;
  const previousUserKarma = user.karma - mostRecentVotePower;

  const currentUserKarmaInfo = { ...user, recentKarmaInfo: currentKarmaInfo };
  const previousUserKarmaInfo = { ...user, recentKarmaInfo: previousKarmaInfo, karma: previousUserKarma };

  return { currentUserKarmaInfo, previousUserKarmaInfo };
}

export function getRateLimitStrictnessComparisons(userKarmaInfoWindow: UserKarmaInfoWindow) {
  const { currentUserKarmaInfo, previousUserKarmaInfo } = userKarmaInfoWindow;

  const commentRateLimits = forumSelect(autoCommentRateLimits);
  const postRateLimits = forumSelect(autoPostRateLimits);

  const activeCommentRateLimits = getActiveRateLimits(currentUserKarmaInfo, commentRateLimits);
  const previousCommentRateLimits = getActiveRateLimits(previousUserKarmaInfo, commentRateLimits);

  const activePostRateLimits = getActiveRateLimits(currentUserKarmaInfo, postRateLimits);
  const previousPostRateLimits = getActiveRateLimits(previousUserKarmaInfo, postRateLimits);

  const commentRateLimitComparison = areNewRateLimitsStricter(activeCommentRateLimits, previousCommentRateLimits);
  const postRateLimitComparison = areNewRateLimitsStricter(activePostRateLimits, previousPostRateLimits);

  return { commentRateLimitComparison, postRateLimitComparison };
}

export function documentOnlyHasSelfVote(userId: string, mostRecentVoteInfo: RecentVoteInfo, allVoteInfo: RecentVoteInfo[]) {
  return (
    mostRecentVoteInfo.userId === userId &&
    allVoteInfo.filter(v => v.userId === userId && v.documentId === mostRecentVoteInfo.documentId).length === 1
  );
}
