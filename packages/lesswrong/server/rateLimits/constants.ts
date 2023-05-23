import type { ForumOptions } from "../../lib/forumTypeUtils";
import type { AutoRateLimit } from "./types";

/**
 * Post rate limits
 */

const POSTS = {
  FIVE_PER_DAY: {
    actionType: "Posts",
    timeframeUnit: 'days',
    timeframeLength: 1,
    itemsPerTimeframe: 5,
    rateLimitType: "universal",
    rateLimitMessage: "Users cannot post more than 5 posts a day"
  },
  
  FIVE_PER_DAY_UNDER_500_KARMA: {
    actionType: "Posts",
    timeframeUnit: 'days',
    timeframeLength: 1,
    itemsPerTimeframe: 5,
    rateLimitType: "universal",
    rateLimitMessage: "Users cannot post more than 5 posts a day",
    karmaThreshold: 500
  },
  
  TWO_PER_WEEK_UNDER_10_KARMA: {
    actionType: "Posts",
    karmaThreshold: 10,
    timeframeUnit: 'weeks',
    timeframeLength: 1,
    itemsPerTimeframe: 2,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "As you gain more karma you'll be able to post more frequently."
  },
  
  ONE_PER_WEEK_NEGATIVE_KARMA: {
    actionType: "Posts",
    karmaThreshold: -1,
    timeframeUnit: 'weeks',
    timeframeLength: 1,
    itemsPerTimeframe: 1,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "Negative karma users are limited to 1 post per week."
  },
  
  ONE_PER_TWO_WEEKS_NEGATIVE_30_KARMA: {
    actionType: "Posts",
    karmaThreshold: -30,
    timeframeUnit: 'weeks',
    timeframeLength: 2,
    itemsPerTimeframe: 1,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "Users with less than -30 karma users can only post once every two weeks."
  },
} as const;

/**
 * Comment rate limits
 */

const COMMENTS = {
  // short rate limit on commenting to prevent accidental double-commenting
  ONE_PER_EIGHT_SECONDS: {
    actionType: "Comments",
    timeframeUnit: 'seconds',
    timeframeLength: 8,
    itemsPerTimeframe: 1,
    rateLimitType: "universal",
    rateLimitMessage: "Users cannot submit more than 1 comment every 8 seconds to prevent double-posting.",
  },

  FOUR_PER_THIRTY_MINUTES_UNDER_30_KARMA: {
    actionType: "Comments",
    karmaThreshold: 30,
    timeframeUnit: 'minutes',
    timeframeLength: 30,
    itemsPerTimeframe: 4,
    rateLimitType: "lowKarma",
    rateLimitMessage: "You'll be able to post more comments as your karma increases"
  },

  FOUR_PER_THIRTY_MINUTES_DOWNVOTE_RATIO_30_PERCENT: {
    actionType: "Comments",
    downvoteRatio: .3,
    timeframeUnit: 'minutes',
    timeframeLength: 30,
    itemsPerTimeframe: 4,
    rateLimitType: "downvoteRatio",
    rateLimitMessage: "You'll be able to post more comments as your karma increases"
  },

  THREE_PER_DAY_LOW_KARMA: {
    actionType: "Comments",
    karmaThreshold: 5,
    timeframeUnit: 'days',
    timeframeLength: 1,
    itemsPerTimeframe: 3,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "New users can write up to 3 comments a day. Gain more karma to comment more frequently."
  },

  ONE_PER_DAY_NEGATIVE_KARMA: {
    actionType: "Comments",
    karmaThreshold: -1,
    timeframeUnit: 'days',
    timeframeLength: 1,
    itemsPerTimeframe: 1,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "Negative karma users are limited to 1 comment per day."
  },

  ONE_PER_THREE_DAYS_NEGATIVE_15_KARMA: {
    actionType: "Comments",
    karmaThreshold: -15,
    timeframeUnit: 'days',
    timeframeLength: 3,
    itemsPerTimeframe: 1,
    rateLimitType: 'lowKarma',
    rateLimitMessage: "Users with -15 or less karma users can only comment once per 3 days."
  }
} as const;


export const autoPostRateLimits: ForumOptions<AutoRateLimit<'Posts'>[]> = {
  EAForum: [
    POSTS.FIVE_PER_DAY
  ],
  LessWrong: [
    POSTS.FIVE_PER_DAY_UNDER_500_KARMA, 
    POSTS.TWO_PER_WEEK_UNDER_10_KARMA, 
    POSTS.ONE_PER_WEEK_NEGATIVE_KARMA,
    POSTS.ONE_PER_TWO_WEEKS_NEGATIVE_30_KARMA
  ],
  default: [
    POSTS.FIVE_PER_DAY
  ]
};

export const autoCommentRateLimits: ForumOptions<AutoRateLimit<'Comments'>[]> = {
  EAForum: [
    COMMENTS.ONE_PER_EIGHT_SECONDS, 
    COMMENTS.FOUR_PER_THIRTY_MINUTES_UNDER_30_KARMA, 
    COMMENTS.FOUR_PER_THIRTY_MINUTES_DOWNVOTE_RATIO_30_PERCENT],
  LessWrong: [
    COMMENTS.ONE_PER_EIGHT_SECONDS, 
    COMMENTS.THREE_PER_DAY_LOW_KARMA, 
    COMMENTS.ONE_PER_DAY_NEGATIVE_KARMA, 
    COMMENTS.ONE_PER_THREE_DAYS_NEGATIVE_15_KARMA
  ],
  default: [
    COMMENTS.ONE_PER_EIGHT_SECONDS
  ]
};
