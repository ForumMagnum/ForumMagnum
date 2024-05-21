export type RateLimitUser = UserKarmaInfo|DbUser

export type TimeframeUnitType = 'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'
export type RateLimitType = "moderator"|"lowKarma"|"universal"|"downvoteRatio"|"newUserDefault"
 
export type RateLimitInfo = {
  nextEligible: Date,
  rateLimitType?: RateLimitType,
  rateLimitMessage: string,
}

export type UserKarmaInfo = Pick<DbUser, "karma"|"smallDownvoteReceivedCount"|"smallUpvoteReceivedCount"|"bigDownvoteReceivedCount"|"bigUpvoteReceivedCount"|"voteReceivedCount">

/* 
Each forum can set a list of automatically applied rate limits. 

Whenever a user submits a post or comment, the server checks if any of the listed AutoRateLimits 
apply to that user/post/comment.

AutoRateLimits check how documents the user has posted in a recent timeframe interval, and prevents them
from posting more if they've posted more than the alloted number of itemsPerTimeframe.

AutoRateLimits can take in an optional karmaThreshold or downvoteRatio parameter. If set, the AutoRateLimit
applies to users who meet that karmaThreshold and/or downvoteRatio criteria. If both params are set, the 
rate limit only applies if both conditions are met. If neither param is set, the rate limit applies to all users.
*/
export type IsActiveFunction = (user: RateLimitUser, features: RateLimitFeatures) => boolean;
export interface AutoRateLimit {
  actionType: "Posts"|"Comments", // which collection the rate limit applies to
  timeframeLength: number, // how long the time timeframe is (measured in the timeframeUnit, below)
  timeframeUnit: TimeframeUnitType, // measuring units for the timeframe (i.e. minutes, hours, days)
  itemsPerTimeframe: number, // number of items a user can post/comment/etc before triggering rate limit
  rateLimitType?: RateLimitType // short name used in analytics db
  rateLimitMessage: string // A message displayed to users when they are rate limited.
  isActive: IsActiveFunction, 
}

export interface PostAutoRateLimit extends AutoRateLimit {
  actionType: "Posts",  
}

export interface CommentAutoRateLimit extends AutoRateLimit {
  actionType: "Comments",
  appliesToOwnPosts: boolean // if set, the rate limit will apply when replying to posts/comments/etc that the user has created
}


export type UserRateLimit<T extends DbUserRateLimit['type']> = DbUserRateLimit & { type: T };

export type RecentKarmaInfo = {
  last20Karma: number, 
  lastMonthKarma: number,
  last20PostKarma: number,
  last20CommentKarma: number,
  downvoterCount: number, 
  postDownvoterCount: number,
  commentDownvoterCount: number,
  lastMonthDownvoterCount: number,
}

export interface UserKarmaInfoWindow {
  currentUserKarmaInfo: DbUser & { recentKarmaInfo: RecentKarmaInfo };
  previousUserKarmaInfo: DbUser & { recentKarmaInfo: RecentKarmaInfo };
}

export type RecentVoteInfo = Pick<DbVote, "_id"|"userId"|"power"|"documentId"|"collectionName"|"votedAt"> & {
  collectionName: 'Posts' | 'Comments',
  postedAt: Date,
  totalDocumentKarma: number
}

export type RateLimitComparison<T extends AutoRateLimit> = {
  isStricter: true;
  strictestNewRateLimit: T;
} | {
  isStricter: false;
  strictestNewRateLimit?: undefined;
};

export type RateLimitFeatures = RecentKarmaInfo & {
  downvoteRatio: number,
}
