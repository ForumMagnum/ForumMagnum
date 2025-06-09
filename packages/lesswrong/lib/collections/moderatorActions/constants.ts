import { forumSelect } from "@/lib/forumTypeUtils";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";


export const RATE_LIMIT_ONE_PER_DAY = "rateLimitOnePerDay";
export const RATE_LIMIT_ONE_PER_THREE_DAYS = "rateLimitOnePerThreeDays";
export const RATE_LIMIT_ONE_PER_WEEK = "rateLimitOnePerWeek";
export const RATE_LIMIT_ONE_PER_FORTNIGHT = "rateLimitOnePerFortnight";
export const RATE_LIMIT_ONE_PER_MONTH = "rateLimitOnePerMonth";
export const RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK = "rateLimitThreeCommentsPerPost";
export const RECENTLY_DOWNVOTED_CONTENT_ALERT = "recentlyDownvotedContentAlert";
export const LOW_AVERAGE_KARMA_COMMENT_ALERT = "lowAverageKarmaCommentAlert";
export const LOW_AVERAGE_KARMA_POST_ALERT = "lowAverageKarmaPostAlert";
export const NEGATIVE_KARMA_USER_ALERT = "negativeUserKarmaAlert";
export const MOVED_POST_TO_DRAFT = "movedPostToDraft";
export const SENT_MODERATOR_MESSAGE = "sentModeratorMessage";
export const MANUAL_FLAG_ALERT = "manualFlag";
export const RECEIVED_VOTING_PATTERN_WARNING = "votingPatternWarningDelivered";
export const FLAGGED_FOR_N_DMS = "flaggedForNDMs";
export const AUTO_BLOCKED_FROM_SENDING_DMS = "autoBlockedFromSendingDMs";
export const REJECTED_POST = "rejectedPost";
export const REJECTED_COMMENT = "rejectedComment";
export const POTENTIAL_TARGETED_DOWNVOTING = "potentialTargetedDownvoting";
export const EXEMPT_FROM_RATE_LIMITS = "exemptFromRateLimits";
export const RECEIVED_SENIOR_DOWNVOTES_ALERT = "receivedSeniorDownvotesAlert";

export const postRateLimits = [] as const;

export const commentRateLimits = [RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK] as const;

export const postAndCommentRateLimits = [
  RATE_LIMIT_ONE_PER_DAY,
  RATE_LIMIT_ONE_PER_THREE_DAYS,
  RATE_LIMIT_ONE_PER_WEEK,
  RATE_LIMIT_ONE_PER_FORTNIGHT,
  RATE_LIMIT_ONE_PER_MONTH,
] as const;

export const allRateLimits = [...postAndCommentRateLimits, ...commentRateLimits] as const;

export const rateLimitSet = new TupleSet(postAndCommentRateLimits);
export type RateLimitSet = UnionOf<typeof rateLimitSet>;

export type PostAndCommentRateLimitTypes = (typeof postAndCommentRateLimits)[number];
export type AllRateLimitTypes = (typeof allRateLimits)[number];

// moderation actions that restrict the user's permissions in some way
export const restrictionModeratorActions = [...allRateLimits] as const;

export const MODERATOR_ACTION_TYPES = {
  [RATE_LIMIT_ONE_PER_DAY]: "Rate Limit (1 per day)",
  [RATE_LIMIT_ONE_PER_THREE_DAYS]: "Rate Limit (1 per 3 days)",
  [RATE_LIMIT_ONE_PER_WEEK]: "Rate Limit (1 per week)",
  [RATE_LIMIT_ONE_PER_FORTNIGHT]: "Rate Limit (1 per fortnight)",
  [RATE_LIMIT_ONE_PER_MONTH]: "Rate Limit (1 per month)",
  [RATE_LIMIT_THREE_COMMENTS_PER_POST_PER_WEEK]: "Rate Limit (3 comments per post per week)",
  [RECENTLY_DOWNVOTED_CONTENT_ALERT]: "Recently Downvoted Content",
  [LOW_AVERAGE_KARMA_COMMENT_ALERT]: "Low Average Karma Comments",
  [LOW_AVERAGE_KARMA_POST_ALERT]: "Low Average Karma Posts",
  [NEGATIVE_KARMA_USER_ALERT]: "Negative Karma User",
  [MOVED_POST_TO_DRAFT]: "Moved Post to Draft",
  [SENT_MODERATOR_MESSAGE]: "Sent Moderator Message",
  [MANUAL_FLAG_ALERT]: "Manually Flagged",
  [RECEIVED_VOTING_PATTERN_WARNING]: "Received automatic warning for voting too fast",
  [FLAGGED_FOR_N_DMS]: "Auto-flagged for sending suspiciously many DMs",
  [AUTO_BLOCKED_FROM_SENDING_DMS]: "Auto-blocked from sending DMs for trying to send suspiciously many DMs",
  [REJECTED_POST]: "Rejected Post",
  [REJECTED_COMMENT]: "Rejected Comment",
  [POTENTIAL_TARGETED_DOWNVOTING]: "Suspected targeted downvoting of a specific user",
  [EXEMPT_FROM_RATE_LIMITS]: "Exempt from rate limits",
  [RECEIVED_SENIOR_DOWNVOTES_ALERT]: "Received too many downvotes on net-negative comments from senior users; if justified, default to 1 comment per 2 day rate limit for a month",
} satisfies Record<ModeratorActionType, string>;

/** The max # of users an unapproved account is allowed to DM before being flagged */
export const MAX_ALLOWED_CONTACTS_BEFORE_FLAG = 2;

/** The max # of users an unapproved account is allowed to DM */
export const MAX_ALLOWED_CONTACTS_BEFORE_BLOCK = forumSelect({ EAForum: 4, default: 9 });
