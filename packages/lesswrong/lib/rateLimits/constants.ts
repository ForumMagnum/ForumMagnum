import { forumSelect, type ForumOptions } from "../forumTypeUtils";
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

const defaultRateLimitMessage = forumSelect({
  EAForum: `<a href="https://forum.effectivealtruism.org/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum">Click here</a> to read more about EA Forum norms.`,
  LessWrong: `You can <a href="https://www.lesswrong.com/posts/hHyYph9CcYfdnoC5j/auto-ratelimits">read here</a> for details, and for tips on how to write good content.`,
  default: ''
})

const ALL = {
  POSTS: {
    FIVE_PER_DAY: {
      ...timeframe('5 Posts per 1 days'),
      rateLimitType: "universal",
      rateLimitName: "fivePostsPerDay",
      isActive: () => true,
      rateLimitMessage: "Users cannot post more than 5 posts per day.",
    }
  },
  COMMENTS: {
    ONE_PER_EIGHT_SECONDS: {
      ...timeframe('1 Comments per 8 seconds'),
      rateLimitType: "universal",
      rateLimitName: "oneCommentPerEightSeconds",
      isActive: ()  => true,
      rateLimitMessage: "Users cannot submit more than 1 comment per 8 seconds to prevent double-posting.",
      appliesToOwnPosts: true
    }
  }
} as const

const LW: {POSTS: PostAutoRateLimit[], COMMENTS: CommentAutoRateLimit[]} = {
  POSTS: [
  // 2 posts per week rate limits
    {
      ...timeframe('2 Posts per 1 weeks'),
      rateLimitType: "newUserDefault",
      rateLimitName: "twoPostsPerWeekNewUsers",
      isActive: user => (user.karma < 5),
      rateLimitMessage: `Users with less than 5 karma can write up to 2 posts a week. ${defaultRateLimitMessage}`,
    }, 
  // 1 post per week rate limits
    {
      ...timeframe('1 Posts per 1 weeks'),
      rateLimitName: "onePostPerWeekLowKarma",
      isActive: user => (user.karma < -2),
      rateLimitMessage: `Users with less than -2 karma can post once per week. ${defaultRateLimitMessage}`
    }, 
    {
      ...timeframe('1 Posts per 1 weeks'),
      rateLimitName: "onePostPerWeekNegativePostKarma15",
      isActive: (user, features) => (
        features.last20PostKarma < -15 && 
        features.postDownvoterCount >= 4
      ),
      rateLimitMessage: `Users with less than -15 karma on their recent posts can post once per week. ${defaultRateLimitMessage}`
    }, 
    {
      ...timeframe('1 Posts per 1 weeks'),
      rateLimitName: "onePostPerWeekNegativePostKarma30",
      isActive: (user, features) => (
        features.last20PostKarma < -30 && 
        features.postDownvoterCount >= 10
      ),
      rateLimitMessage: `Users with less than -30 karma on their recent posts can post once per week. ${defaultRateLimitMessage}`
    }, 
    // 1 post per 2+ weeks rate limits
    {
      ...timeframe('1 Posts per 2 weeks'),
      rateLimitName: "onePostPerTwoWeeksNegativeKarma30",
      isActive: (user, features) => ( 
        user.karma < 0 && 
        features.last20Karma < -30 && 
        features.postDownvoterCount >= 5
      ),
      rateLimitMessage: `Users with less than -30 karma on their recent posts/comments can post once every 2 weeks. ${defaultRateLimitMessage}`
    }, 
    {
      ...timeframe('1 Posts per 3 weeks'),
      rateLimitName: "onePostPerThreeWeeksNegativePostKarma45",
      isActive: (user, features) => (
        user.karma < 0 && 
        features.last20PostKarma < -45 && 
        features.postDownvoterCount >= 5
      ),
      rateLimitMessage: `Users with less than -45 karma on recent posts can post once every 3 weeks. ${defaultRateLimitMessage}`
    }, 
    {
      ...timeframe('1 Posts per 4 weeks'),
      rateLimitName: "onePostPerFourWeeksNegativeKarma60",
      isActive: (user, features) => (
        user.karma < 0 && 
        features.last20Karma < -60 && 
        features.postDownvoterCount >= 5
      ), // uses last20Karma so it's not too hard to dig your way out 
      rateLimitMessage: `Users with less than -60 karma on recent comments/posts can post once every 4 weeks. ${defaultRateLimitMessage}`
    }
  ],
  COMMENTS: [ 
    {
      ...timeframe('1 Comments per 1 hours'),
      appliesToOwnPosts: false,
      rateLimitName: "oneCommentPerHourNegativeKarma",
      isActive: (user, features) => (
        features.last20Karma < 0 && 
        features.downvoterCount >= 3
      ),
      rateLimitMessage: `Users with less than 0 karma on recent posts/comments can comment once per hour. ${defaultRateLimitMessage}`
    }, 
  // 3 comments per day rate limits
    {
      ...timeframe('3 Comments per 1 days'),
      appliesToOwnPosts: false,
      rateLimitType: "newUserDefault",
      rateLimitName: "threeCommentsPerDayNewUsers",
      isActive: user => (user.karma < 5),
      rateLimitMessage: `Users with less than 5 karma can write up to 3 comments per day. ${defaultRateLimitMessage}`,
    }, 
    {
      ...timeframe('3 Comments per 1 days'), // semi-established users can make up to 20 posts/comments without getting upvoted, before hitting a 3/day comment rate limit
      appliesToOwnPosts: false,
      rateLimitName: "threeCommentsPerDayNoUpvotes",
      isActive: (user, features) => (
        user.karma < 2000 && 
        features.last20Karma < 1
      ),  // requires 1 weak upvote from a 1000+ karma user, or two new user upvotes, but at 2000+ karma I trust you more to go on long conversations
      rateLimitMessage: `You've recently posted a lot without getting upvoted. Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 2+ net-karma. ${defaultRateLimitMessage}`,
    }, 
  // 1 comment per day rate limits
    {
      ...timeframe('1 Comments per 1 days'),
      appliesToOwnPosts: false,
      rateLimitName: "oneCommentPerDayLowKarma",
      isActive: user => (user.karma < -2),
      rateLimitMessage: `Users with less than -2 karma can write up to 1 comment per day. ${defaultRateLimitMessage}`
    }, 
    {
      ...timeframe('1 Comments per 1 days'),

      appliesToOwnPosts: false,
      rateLimitName: "oneCommentPerDayNegativeKarma5",
      isActive: (user, features) => (
        features.last20Karma < -5 && 
        features.downvoterCount >= (user.karma < 2000 ? 4 : 7)
      ), // at 2000+ karma, I think your downvotes are more likely to be from people who disagree with you, rather than from people who think you're a troll
      rateLimitMessage: `Users with less than -5 karma on recent posts/comments can write up to 1 comment per day. ${defaultRateLimitMessage}`
    }, 
  // 1 comment per 3 days rate limits
    {
      ...timeframe('1 Comments per 3 days'),
      appliesToOwnPosts: false,
      rateLimitName: "oneCommentPerThreeDaysNegativeKarma15",
      isActive: (user, features) => (
        user.karma < 500 &&
        features.last20Karma < -15 && 
        features.downvoterCount >= 5
      ),
      rateLimitMessage: `Users with less than -15 karma on recent posts/comments can write up to 1 comment every 3 days. ${defaultRateLimitMessage}`
    }, 
  // 1 comment per week rate limits
    {
      ...timeframe('1 Comments per 1 weeks'),
      appliesToOwnPosts: false,
      rateLimitName: "oneCommentPerWeekNegativeMonthlyKarma30",
      isActive: (user, features) => (
        user.karma < 0 && 
        features.last20Karma < -1 && 
        features.lastMonthDownvoterCount >= 5 &&
        features.lastMonthKarma <= -30
      ),
      // Added as a hedge against someone with positive karma coming back after some period of inactivity and immediately getting into an argument
      rateLimitMessage: `Users with -30 or less karma on recent posts/comments can write up to one comment per week. ${defaultRateLimitMessage}`
    },
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS
  ]
}
const EA = {
  POSTS: [
    ...LW.POSTS,
    ALL.POSTS.FIVE_PER_DAY
  ],
  COMMENTS: [
    ...LW.COMMENTS
  ]
}

export const autoPostRateLimits: ForumOptions<PostAutoRateLimit[]> = {
  EAForum: [
    ...EA.POSTS
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
    ...EA.COMMENTS
  ],
  LessWrong: [
    ...LW.COMMENTS
  ],
  default: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS
  ]
};
