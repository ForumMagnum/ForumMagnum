export type TimeframeUnitType = 'seconds'|'minutes'|'hours'|'days'|'weeks'|'months'
export type RateLimitType = "moderator"|"lowKarma"|"universal"|"downvoteRatio"
 
export type RateLimitInfo = {
  nextEligible: Date,
  rateLimitType: RateLimitType,
  rateLimitMessage: string,
}

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
export interface AutoRateLimit {
  actionType: "Posts"|"Comments", // which collection the rate limit applies to
  timeframeLength: number, // how long the time timeframe is (measured in the timeframeUnit, below)
  timeframeUnit: TimeframeUnitType, // measuring units for the timeframe (i.e. minutes, hours, days)
  itemsPerTimeframe: number, // number of items a user can post/comment/etc before triggering rate limit
  rateLimitType: RateLimitType // short name used in analytics db
  rateLimitMessage: string // A message displayed to users when they are rate limited.

  // The following parameters are optional, and if set, the rate limit will only apply to users who meet the criteria.
  karmaThreshold?: number, // if set, limit will only apply to users with karma less than the threshold
  downvoteRatio?: number, // if set, limit will only apply to users who's ratio of received downvotes / total votes is higher than the listed threshold
  recentKarmaThreshold?: number // if set, limit only applies to users whose past 20 posts and comments karma total is less than N
  recentPostKarmaThreshold?: number // if set, limit only applies to users whose past 20 post karma total is less than N
  recentCommentKarmaThreshold?: number // if set, limit only applies to users whose past 20 comment karma total is less than N
  downvoterCountThreshold?: number // if set, limit only applies to users whose past 20 posts and comments were downvoted by N or more people.
  postDownvoterCountThreshold?: number // if set, limit only applies to users whose past 20 posts were downvoted by N or more people.
  commentDownvoterCountThreshold?: number // if set, limit only applies to users whose past 20 comments were downvoted by N or more people.
}

export interface PostAutoRateLimit extends AutoRateLimit {
  actionType: "Posts",  
}

export interface CommentAutoRateLimit extends AutoRateLimit {
  actionType: "Comments",
  appliesToOwnPosts: boolean // if set, the rate limit will apply when replying to posts/comments/etc that the user has created
}


export type UserRateLimit<T extends DbUserRateLimit['type']> = DbUserRateLimit & { type: T };

export interface StrictestCommentRateLimitInfoParams {
  commentsInTimeframe: Array<DbComment>,
  user: DbUser,
  modRateLimitHours: number,
  modPostSpecificRateLimitHours: number,
  userCommentRateLimit: UserRateLimit<'allComments'> | null,
  postId: string | null
}
