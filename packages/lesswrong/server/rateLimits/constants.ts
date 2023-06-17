import type { ForumOptions } from "../../lib/forumTypeUtils";
import { RECENT_CONTENT_COUNT } from "../repos/VotesRepo";
import type { AutoRateLimit, CommentAutoRateLimit, PostAutoRateLimit, TimeframeUnitType } from "./types";

/**
 * Post rate limits
 */

 type TimeframeStrType<A extends AutoRateLimit['actionType']> = `${number} ${A} per ${number} ${TimeframeUnitType}` 

 const timeframe = <A extends AutoRateLimit['actionType']>(timeframeString: TimeframeStrType<A>) => {
   const [itemsPerTimeframe, actionType, _, timeframeLength, timeframeUnit] = timeframeString.split(' ');
   return {
     itemsPerTimeframe: parseInt(itemsPerTimeframe),
     actionType: actionType as A,
     timeframeLength: parseInt(timeframeLength),
     timeframeUnit: timeframeUnit as TimeframeUnitType
   }
 };

const EA = {
  POSTS: {
  },
  COMMENTS: [
    {
      ...timeframe('4 Comments per 30 minutes'),
      karmaThreshold: 30,
      rateLimitType: "lowKarma",
      rateLimitMessage: "You'll be able to post more comments as your karma increases.",
      appliesToOwnPosts: true
    }, {
      ...timeframe('4 Comments per 30 minutes'),
      downvoteRatio: .3,
      rateLimitType: "downvoteRatio",
      rateLimitMessage: "",
      appliesToOwnPosts: true
    },
  ]
} as const

const LW = {
  POSTS: [
    {
      ...timeframe('2 Posts per 1 weeks'),
      karmaThreshold: 5,
      rateLimitMessage: "As you gain more karma you'll be able to post more frequently.",
    }, {
      ...timeframe('1 Posts per 1 weeks'),
      karmaThreshold: -1,
      rateLimitMessage: "Negative karma users are limited to 1 post per week.",
    }, {
      ...timeframe('1 Posts per 1 weeks'),
      recentKarmaThreshold: -15,
      rateLimitMessage: "Users with -15 karma can only post once every two weeks.",
    }, {
      ...timeframe('1 Posts per 2 weeks'),
      recentKarmaThreshold: -30,
      rateLimitMessage: "Users with -30 karma on their recent content can only post once every two weeks.",
    }, {
      ...timeframe('1 Posts per 3 weeks'),
      recentKarmaThreshold: -45,
      rateLimitMessage: "Users with -45 karma on their recent content can only post once every three weeks.",
    }, {
      ...timeframe('1 Posts per 4 weeks'),
      recentKarmaThreshold: -60, // uses recentKarma so it's not too hard to dig your way out 
      rateLimitMessage: `Users with -60 karma on their recent content can only post once every four weeks.`,
    }
  ],
  COMMENTS: [ 
    {
      ...timeframe('3 Comments per 1 days'),
      karmaThreshold: 5,
      appliesToOwnPosts: true,
      rateLimitMessage: "New users can write up to 3 comments a day. Gain more karma to comment more frequently.",
    }, {
      ...timeframe('1 Comments per 1 days'),
      karmaThreshold: -1,
      appliesToOwnPosts: false,
      rateLimitMessage: "Negative karma users are limited to 1 comment per day.",
    }, {
      ...timeframe('1 Comments per 3 days'),
      karmaThreshold: -15,
      appliesToOwnPosts: false,
      rateLimitMessage: "Users with -15 or less karma users can only comment once per 3 days.",
    }, 
    {
      ...timeframe('3 Comments per 1 days'),
      // semi-established users can make up to 20 posts/comments without getting upvoted, before hitting a 3/day comment rate limit
      karmaThreshold: 1999, // at 2000+ karma I trust you more to go on long conversations
      recentKarmaThreshold: 1, // requires 1 weak upvote from a 1000+ karma user, or two new user upvotes
      appliesToOwnPosts: false,
      rateLimitMessage: `Hey, you've been posting a lot without getting upvoted. Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 2 net-karma.`,
    }, {
      ...timeframe('1 Comments per 1 hours'),
      recentKarmaThreshold: -1,
      downvoterCountThreshold: 3,
      appliesToOwnPosts: true,
      rateLimitMessage: `Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 1 net-karma.`
    }, {
      ...timeframe('1 Comments per 1 days'),
      recentKarmaThreshold: -5,
      downvoterCountThreshold: 3,
      appliesToOwnPosts: true,
      rateLimitMessage: `Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 1 net-karma.`
    }, {
      ...timeframe('1 Comments per 3 days'),
      recentKarmaThreshold: -15,
      downvoterCountThreshold: 2,
      appliesToOwnPosts: false,
      rateLimitMessage: `Your recent posts/comments have been net-downvoted. Users with -60 or less karma on their recent ${RECENT_CONTENT_COUNT} posts/comments can only comment once per two weeks on other's posts.`,
    }, {
      ...timeframe('1 Comments per 1 weeks'),
      karmaThreshold: 1999, // at 2000+ karma I trust you more to go on long conversations
      lastMonthKarma: -30,
      downvoterCountThreshold: 2,
      appliesToOwnPosts: false,
      rateLimitMessage: `Your recent posts/comments have been net-downvoted. Users with -60 or less karma on their recent ${RECENT_CONTENT_COUNT} posts/comments can only comment once per two weeks on other's posts.`
    }
  ]
} as const

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
