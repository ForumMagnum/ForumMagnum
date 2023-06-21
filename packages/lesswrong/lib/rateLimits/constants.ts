import type { ForumOptions } from "../forumTypeUtils";
import type { AutoRateLimit, CommentAutoRateLimit, PostAutoRateLimit, TimeframeUnitType } from "./types";

/**
 * Post rate limits
 */

export const RECENT_CONTENT_COUNT = 20

type TimeframeStrType<A extends AutoRateLimit['actionType']> = `${number} ${A} per ${number} ${TimeframeUnitType}` 

// It felt pretty important to Ray to easily skim all the rate limits, so Robert worked out this 
// parser to make the basic settings more human-readable
const timeframe = <A extends AutoRateLimit['actionType']>(timeframeString: TimeframeStrType<A>) => {
  const [itemsPerTimeframe, actionType, _, timeframeLength, timeframeUnit] = timeframeString.split(' ');
  return {
    itemsPerTimeframe: parseInt(itemsPerTimeframe),
    actionType: actionType as A,
    timeframeLength: parseInt(timeframeLength),
    timeframeUnit: timeframeUnit as TimeframeUnitType
  }
};

const EA: {POSTS: PostAutoRateLimit[], COMMENTS: CommentAutoRateLimit[]} = {
  POSTS: [
  ],
  COMMENTS: [
    {
      ...timeframe('4 Comments per 30 minutes'),
      karmaThreshold: 30,
      rateLimitType: "lowKarma",
      rateLimitMessage: "You'll be able to post more comments as your karma increases.",
      appliesToOwnPosts: true
    }, {
      ...timeframe('4 Comments per 30 minutes'),
      downvoteRatioThreshold: .3,
      rateLimitType: "downvoteRatio",
      rateLimitMessage: "",
      appliesToOwnPosts: true
    },
  ]
}

const lwDefaultMessage = `<p>LessWrong automatically rate limits users whose recent content has been net-downvoted. <br/>Read <a href="https://www.lesswrong.com/posts/hHyYph9CcYfdnoC5j/auto-ratelimits">here</a> to learn more details, and get tips on how to write good content.</p>`

const LW: {POSTS: PostAutoRateLimit[], COMMENTS: CommentAutoRateLimit[]} = {
  POSTS: [
  // 2 posts per week rate limits
    {
      ...timeframe('2 Posts per 1 weeks'),
      karmaThreshold: 4,
      downvoterCountThreshold: 2,
      rateLimitType: "newUserDefault",
      rateLimitMessage: "Users with 5+ karma can post without restriction, till then the max is 2 posts per week.",
    }, 
  // 1 post per week rate limits
    {
      ...timeframe('1 Posts per 1 weeks'),
      karmaThreshold: -3,
      downvoterCountThreshold: 2,
      rateLimitMessage: "Negative karma users are limited to 1 post per week.",
    }, 
    {
      ...timeframe('1 Posts per 1 weeks'),
      last20KarmaThreshold: -15,
      downvoterCountThreshold: 3,
      rateLimitMessage: `Users with -15 karma on their their last ${RECENT_CONTENT_COUNT} posts/comments can only post once per week.`,
    }, 
  // 1 post per 2+ weeks rate limits
    {
      ...timeframe('1 Posts per 2 weeks'),
      last20KarmaThreshold: -30,
      downvoterCountThreshold: 5,
      rateLimitMessage: `Users with -30 karma on their their last ${RECENT_CONTENT_COUNT} posts/comments can only post once per two weeks.`,
    }, 
    {
      ...timeframe('1 Posts per 3 weeks'),
      last20KarmaThreshold: -45,
      downvoterCountThreshold: 5,
      rateLimitMessage: `Users with -45 karma on their their last ${RECENT_CONTENT_COUNT} posts/comments can only post once per three weeks.`,
    }, 
    {
      last20KarmaThreshold: -60, // uses last20Karma so it's not too hard to dig your way out 
      downvoterCountThreshold: 5,
      ...timeframe('1 Posts per 4 weeks'),
      rateLimitMessage: `Users with -60 karma on their their last ${RECENT_CONTENT_COUNT} posts/comments can only post once per four weeks.`,
    }
  ],
  COMMENTS: [ 
    {
      ...timeframe('1 Comments per 1 hours'),
      last20KarmaThreshold: -1,
      downvoterCountThreshold: 3,
      appliesToOwnPosts: true,
      rateLimitMessage: lwDefaultMessage
    }, 
  // 3 comments per day rate limits
    {
      ...timeframe('3 Comments per 1 days'),
      karmaThreshold: 5,
      appliesToOwnPosts: true,
      rateLimitType: "newUserDefault",
      rateLimitMessage: "Users with 5 karma or less can write up to 3 comments a day. Gain more karma to comment more frequently.",
    }, 
    {
      ...timeframe('3 Comments per 1 days'), // semi-established users can make up to 20 posts/comments without getting upvoted, before hitting a 3/day comment rate limit
      last20KarmaThreshold: 1, // requires 1 weak upvote from a 1000+ karma user, or two new user upvotes
      karmaThreshold: 1999, // at 2000+ karma I trust you more to go on long conversations
      appliesToOwnPosts: false,
      rateLimitMessage: `You've recently posted a lot without getting upvoted. Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 2+ net-karma.`,
    }, 
  // 1 comment per day rate limits
    {
      ...timeframe('1 Comments per 1 days'),
      karmaThreshold: -3,
      downvoterCountThreshold: 2,
      appliesToOwnPosts: false,
      rateLimitMessage: lwDefaultMessage
    }, 
    {
      ...timeframe('1 Comments per 1 days'),
      last20KarmaThreshold: -5,
      downvoterCountThreshold: 3,
      appliesToOwnPosts: true,
      rateLimitMessage: lwDefaultMessage
    }, 
  // 1 comment per 3 days rate limits
    {
      ...timeframe('1 Comments per 3 days'),
      karmaThreshold: -15,
      appliesToOwnPosts: false,
      rateLimitMessage: lwDefaultMessage
    }, 
    {
      ...timeframe('1 Comments per 3 days'),
      last20KarmaThreshold: -15,
      downvoterCountThreshold: 2,
      appliesToOwnPosts: false,
      rateLimitMessage: lwDefaultMessage
    }, 
  // 1 comment per week rate limits
    {
      ...timeframe('1 Comments per 1 weeks'),
      lastMonthKarmaThreshold: -30,
      downvoterCountThreshold: 2,
      karmaThreshold: 1999, // at 2000+ karma I trust you more to go on long conversations even if temporarily downvoted
      appliesToOwnPosts: false,
      rateLimitMessage: lwDefaultMessage
    }
  ]
}

const ALL = {
  POSTS: {
    FIVE_PER_DAY: {
      ...timeframe('5 Posts per 1 days'),
      rateLimitType: "universal",
      rateLimitMessage: "Users cannot post more than 5 posts a day.",
    }
  },
  COMMENTS: {
    ONE_PER_EIGHT_SECONDS: {
      ...timeframe('1 Comments per 8 seconds'),
      rateLimitType: "universal",
      rateLimitMessage: "Users cannot submit more than 1 comment per 8 seconds to prevent double-posting.",
      appliesToOwnPosts: true
    }
  }
} as const

export const autoPostRateLimits: ForumOptions<PostAutoRateLimit[]> = {
  EAForum: [
    ALL.POSTS.FIVE_PER_DAY
  ],
  LessWrong: [ 
    ...LW.POSTS,
  ],
  default: [
    ALL.POSTS.FIVE_PER_DAY
  ]
};

export const autoCommentRateLimits: ForumOptions<CommentAutoRateLimit[]> = {
  EAForum: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS, 
    ...EA.COMMENTS
  ],
  LessWrong: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS, 
    ...LW.COMMENTS,
  ],
  default: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS
  ]
};
