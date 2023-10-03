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
    {
      ...timeframe('1 Posts per 1 days'),
      karmaThreshold: 49,
      rateLimitType: "newUserDefault",
      rateLimitMessage: `Users with less than 50 karma can publish up to 1 post a day.`
    },
  ],
  COMMENTS: [
    {
      ...timeframe('4 Comments per 30 minutes'),
      karmaThreshold: 30,
      rateLimitType: "lowKarma",
      rateLimitMessage: "You've written more than 3 comments in the last 30 minutes. You'll be able to post more comments as your karma increases.",
      appliesToOwnPosts: true
    }, {
      ...timeframe('4 Comments per 30 minutes'),
      downvoteRatioThreshold: .3,
      rateLimitType: "downvoteRatio",
      rateLimitMessage: "You've written more than 3 comments in the last 30 minutes.",
      appliesToOwnPosts: true
    },
  ]
}

const lwDefaultMessage = `You can <a href="https://www.lesswrong.com/posts/hHyYph9CcYfdnoC5j/auto-ratelimits">read here</a> for details, and for tips on how to write good content.`

const LW: {POSTS: PostAutoRateLimit[], COMMENTS: CommentAutoRateLimit[]} = {
  POSTS: [
  // 2 posts per week rate limits
    {
      ...timeframe('2 Posts per 1 weeks'),
      karmaThreshold: 4,
      rateLimitType: "newUserDefault",
      rateLimitMessage: `Users with less than 5 karma can write up to 2 posts a week.<br/>${lwDefaultMessage}`,
    }, 
  // 1 post per week rate limits
    {
      ...timeframe('1 Posts per 1 weeks'),
      karmaThreshold: -1,
      rateLimitMessage: `Users with -3 or less karma can post once per week.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Posts per 1 weeks'),
      last20PostKarmaThreshold: -15,
      downvoterCountThreshold: 4,
      rateLimitMessage: `Users with -15 or less karma on their recent posts can post once per week.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Posts per 1 weeks'),
      last20KarmaThreshold: -30,
      downvoterCountThreshold: 10,
      rateLimitMessage: `Users with -30 or less karma on their recent posts/comments can post once per week.<br/>${lwDefaultMessage}`
    }, 
    // 1 post per 2+ weeks rate limits
    {
      ...timeframe('1 Posts per 2 weeks'),
      karmaThreshold: -1,
      last20PostKarmaThreshold: -30,
      downvoterCountThreshold: 5,
      rateLimitMessage: `Users with -30 or less karma on their recent posts/comments can post once every 2 weeks.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Posts per 3 weeks'),
      karmaThreshold: -1,
      last20PostKarmaThreshold: -45,
      downvoterCountThreshold: 5,
      rateLimitMessage: `Users with -45 or less karma on recent posts/comments can post once every 3 weeks.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Posts per 4 weeks'),
      last20PostKarmaThreshold: -60, // uses last20Karma so it's not too hard to dig your way out 
      downvoterCountThreshold: 5,
      karmaThreshold: -1,
      rateLimitMessage: `Users with -60 or less karma can post once every 4 weeks.<br/>${lwDefaultMessage}`
    }
  ],
  COMMENTS: [ 
    {
      ...timeframe('1 Comments per 1 hours'),
      last20KarmaThreshold: -1,
      downvoterCountThreshold: 3,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -1 or less karma on recent posts/comments can comment once per hour.<br/>${lwDefaultMessage}`
    }, 
  // 3 comments per day rate limits
    {
      ...timeframe('3 Comments per 1 days'),
      karmaThreshold: 4,
      appliesToOwnPosts: false,
      rateLimitType: "newUserDefault",
      rateLimitMessage: `Users with less than 5 karma can write up to 3 comments a day.<br/>${lwDefaultMessage}`,
    }, 
    {
      ...timeframe('3 Comments per 1 days'), // semi-established users can make up to 20 posts/comments without getting upvoted, before hitting a 3/day comment rate limit
      last20KarmaThreshold: 1, // requires 1 weak upvote from a 1000+ karma user, or two new user upvotes
      karmaThreshold: 1999, // at 2000+ karma I trust you more to go on long conversations
      appliesToOwnPosts: false,
      rateLimitMessage: `You've recently posted a lot without getting upvoted. Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 2+ net-karma.<br/>${lwDefaultMessage}`,
    }, 
  // 1 comment per day rate limits
    {
      ...timeframe('1 Comments per 1 days'),
      karmaThreshold: -1,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -3 or less karma can write up to 1 comment per day.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Comments per 1 days'),
      last20KarmaThreshold: -5,
      karmaThreshold: 1999, // at 2000+ karma, I think your downvotes are more likely to be from people who disagree with you, rather than from people who think you're a troll
      downvoterCountThreshold: 4,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -5 or less karma on recent posts/comments can write up to 1 comment per day.<br/>${lwDefaultMessage}`
    }, 
    {
      ...timeframe('1 Comments per 1 days'),
      last20KarmaThreshold: -5,
      downvoterCountThreshold: 7,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -5 or less karma on recent posts/comments can write up to 1 comment per day.<br/>${lwDefaultMessage}`
    }, 
  // 1 comment per 3 days rate limits
    {
      ...timeframe('1 Comments per 3 days'),
      last20KarmaThreshold: -15,
      downvoterCountThreshold: 5,
      karmaThreshold: 499,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -15 or less karma on recent posts/comments can write up to 1 comment every 3 days. ${lwDefaultMessage}`
    }, 
  // 1 comment per week rate limits
    {
      ...timeframe('1 Comments per 1 weeks'),
      lastMonthKarmaThreshold: -30,
      // Added as a hedge against someone with positive karma coming back after some period of inactivity and immediately getting into an argument
      last20KarmaThreshold: -1,
      karmaThreshold: -1,
      lastMonthDownvoterCountThreshold: 5,
      appliesToOwnPosts: false,
      rateLimitMessage: `Users with -30 or less karma on recent posts/comments can write up to one comment per week. ${lwDefaultMessage}`
    },
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
    ALL.POSTS.FIVE_PER_DAY,
    ...EA.POSTS,
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
