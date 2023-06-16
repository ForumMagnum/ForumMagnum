import type { ForumOptions } from "../../lib/forumTypeUtils";
import { RECENT_CONTENT_COUNT } from "../repos/VotesRepo";
import type { CommentAutoRateLimit, PostAutoRateLimit } from "./types";

/**
 * Post rate limits
 */

const EA = {
  POSTS: {
  },
  COMMENTS: {
    FOUR_PER_THIRTY_MINUTES_UNDER_30_KARMA: {
      actionType: "Comments",
      karmaThreshold: 30,
      timeframeUnit: 'minutes',
      timeframeLength: 30,
      itemsPerTimeframe: 4,
      rateLimitType: "lowKarma",
      rateLimitMessage: "You'll be able to post more comments as your karma increases.",
      appliesToOwnPosts: true
    },
    FOUR_PER_THIRTY_MINUTES_DOWNVOTE_RATIO_30_PERCENT: {
      actionType: "Comments",
      downvoteRatio: .3,
      timeframeUnit: 'minutes',
      timeframeLength: 30,
      itemsPerTimeframe: 4,
      rateLimitType: "downvoteRatio",
      rateLimitMessage: "",
      appliesToOwnPosts: true
    },
  }
} as const

const LW = {
  POSTS: {
    TWO_PER_WEEK_UNDER_5_KARMA: {
      actionType: "Posts",
      karmaThreshold: 5,
      timeframeUnit: 'weeks',
      timeframeLength: 1,
      itemsPerTimeframe: 2,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "As you gain more karma you'll be able to post more frequently.",
    },
    ONE_PER_WEEK_NEGATIVE_KARMA: {
      actionType: "Posts",
      karmaThreshold: -1,
      timeframeUnit: 'weeks',
      timeframeLength: 1,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "Negative karma users are limited to 1 post per week.",
    },
    ONE_PER_TWO_WEEKS_NEGATIVE_30_KARMA: {
      actionType: "Posts",
      karmaThreshold: -30,
      timeframeUnit: 'weeks',
      timeframeLength: 2,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "Users with -30 karma can only post once every two weeks.",
    },
    ONE_PER_FOUR_WEEKS_NEGATIVE_60_RECENT_KARMA: {
      actionType: "Posts",
      karmaThreshold: -60,
      timeframeUnit: 'weeks',
      timeframeLength: 4,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma', 
      // TODO: make this message friendlier
      rateLimitMessage: `Users with -60 karma on their recent content can only post once every four weeks.`,
    }
  },
  COMMENTS: {
    THREE_PER_DAY_UNDER_5_KARMA: {
      actionType: "Comments",
      karmaThreshold: 5,
      timeframeUnit: 'days',
      timeframeLength: 1,
      itemsPerTimeframe: 3,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "New users can write up to 3 comments a day. Gain more karma to comment more frequently.",
      appliesToOwnPosts: true
    },
    ONE_PER_DAY_NEGATIVE_KARMA: {
      actionType: "Comments",
      karmaThreshold: -1,
      timeframeUnit: 'days',
      timeframeLength: 1,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "Negative karma users are limited to 1 comment per day.",
      appliesToOwnPosts: false
    },
    ONE_PER_THREE_DAYS_NEGATIVE_15_KARMA: {
      actionType: "Comments",
      karmaThreshold: -15,
      timeframeUnit: 'days',
      timeframeLength: 3,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma',
      rateLimitMessage: "Users with -15 or less karma users can only comment once per 3 days.",
      appliesToOwnPosts: false
    },
    THREE_PER_DAY_UNDER_1_RECENT_KARMA: {
      actionType: "Comments",
      recentKarmaThreshold: 1,
      timeframeUnit: 'days',
      timeframeLength: 1,
      itemsPerTimeframe: 3,
      rateLimitType: 'lowKarma',
      rateLimitMessage: `Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 1 net-karma.`,
      appliesToOwnPosts: true
    },
    ONE_PER_DAY_NEGATIVE_RECENT_KARMA: {
      actionType: "Comments",
      recentKarmaThreshold: 0,
      downvoterCountThreshold: 3,
      timeframeUnit: 'days',
      timeframeLength: 1,
      itemsPerTimeframe: 3,
      rateLimitType: 'lowKarma',
      rateLimitMessage: `Users are limited to 3 comments/day unless their last ${RECENT_CONTENT_COUNT} posts/comments have at least 1 net-karma.`,
      appliesToOwnPosts: true
    },
    NEGATIVE_15_RECENT_KARMA: {
      actionType: "Comments",
      recentKarmaThreshold: -15,
      downvoterCountThreshold: 2,
      itemsPerTimeframe: 1,
      timeframeLength: 3,
      timeframeUnit: 'days',
      rateLimitType: 'lowKarma',
      rateLimitMessage: `Your recent posts/comments have been net-downvoted. Users with -60 or less karma on their recent ${RECENT_CONTENT_COUNT} posts/comments can only comment once per two weeks on other's posts.`,
      appliesToOwnPosts: false
    },
    NEGATIVE_30_RECENT_KARMA: {
      actionType: "Comments",
      recentKarmaThreshold: -30,
      recentContentCutoffDays: 60,
      downvoterCountThreshold: 2,
      timeframeUnit: 'weeks',
      timeframeLength: 2,
      itemsPerTimeframe: 1,
      rateLimitType: 'lowKarma',
      // rateLimitMessage: `Your recent posts/comments have been net-downvoted. Users with -60 or less karma on their recent ${RECENT_CONTENT_COUNT} posts/comments can only comment once per two weeks on other's posts.`,
      appliesToOwnPosts: false
    }
  }
} as const

const ALL = {
  POSTS: {
    FIVE_PER_DAY: {
      actionType: "Posts",
      timeframeUnit: 'days',
      timeframeLength: 1,
      itemsPerTimeframe: 5,
      rateLimitType: "universal",
      rateLimitMessage: "Users cannot post more than 5 posts a day.",
    }
  },
  COMMENTS: {
    ONE_PER_EIGHT_SECONDS: {
      actionType: "Comments",
      timeframeUnit: 'seconds',
      timeframeLength: 8,
      itemsPerTimeframe: 1,
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
    LW.POSTS.TWO_PER_WEEK_UNDER_5_KARMA, 
    LW.POSTS.ONE_PER_WEEK_NEGATIVE_KARMA,
    LW.POSTS.ONE_PER_TWO_WEEKS_NEGATIVE_30_KARMA,
    LW.POSTS.ONE_PER_WEEK_NEGATIVE_KARMA,
    LW.POSTS.ONE_PER_FOUR_WEEKS_NEGATIVE_60_RECENT_KARMA
  ],
  default: [
    ALL.POSTS.FIVE_PER_DAY
  ]
};

export const autoCommentRateLimits: ForumOptions<CommentAutoRateLimit[]> = {
  EAForum: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS, 
    EA.COMMENTS.FOUR_PER_THIRTY_MINUTES_UNDER_30_KARMA, 
    EA.COMMENTS.FOUR_PER_THIRTY_MINUTES_DOWNVOTE_RATIO_30_PERCENT],
  LessWrong: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS, 
    LW.COMMENTS.THREE_PER_DAY_UNDER_5_KARMA, 
    LW.COMMENTS.ONE_PER_DAY_NEGATIVE_KARMA, 
    LW.COMMENTS.ONE_PER_THREE_DAYS_NEGATIVE_15_KARMA,
    LW.COMMENTS.THREE_PER_DAY_UNDER_1_RECENT_KARMA,
  ],
  default: [
    ALL.COMMENTS.ONE_PER_EIGHT_SECONDS
  ]
};
