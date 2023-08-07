import moment from "moment";
import { appendToSunshineNotes } from "../lib/collections/users/helpers";
import { loadByIds } from "../lib/loaders";
import type { RateLimitInfo } from "../lib/rateLimits/types";
import { triggerReview } from "./callbacks/sunshineCallbackUtils";
import { rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from "./rateLimitUtils";

interface UserAutoRateLimitCacheRecord {
  activePostRateLimitInfo: RateLimitInfo | null,
  activeCommentRateLimitInfo: RateLimitInfo | null,
  cachedAt: number
}

/**
 * We have a situation with auto-rate-limits where we want to see when users have stricter rate limits applied to them.
 * Those depend on the votes the user received on their last 20 posts & last 20 comments.
 * Trying to do a "lookback" is pretty annoying, since users can have older stuff voted on.
 * 
 * So we just cache the derived rate limit states during the `createBefore` callback for votes,
 * and then compare those to the derived rate limit states during the `castVoteAsync` callback.
 * 
 * This works with a local cache because callbacks will get run by the same server for any individual vote.
 */
const USER_AUTO_RATE_LIMIT_CACHE: Record<string, UserAutoRateLimitCacheRecord> = {};

function isNewRateLimitStricter(newRateLimit: RateLimitInfo | null, oldRateLimit: RateLimitInfo | null) {
  if (!newRateLimit) return false;
  if (!oldRateLimit) return true;

  return newRateLimit.nextEligible.getTime() > oldRateLimit.nextEligible.getTime();
}

function clearStaleCachedRateLimits() {
  const now = Date.now();
  Object.entries(USER_AUTO_RATE_LIMIT_CACHE).forEach(([userId, cacheEntry]) => {
    if (moment(now).subtract(5, 'minutes').isAfter(moment(cacheEntry.cachedAt))) {
      delete USER_AUTO_RATE_LIMIT_CACHE[userId];
    }
  });
}

function triggerReviewForNewRateLimit(userId: string, message: string, context: ResolverContext) {
  void triggerReview(userId);
  void appendToSunshineNotes({
    moderatedUserId: userId,
    adminName: 'Automod',
    text: message,
    context,
  });
}

/**
 * Used by the `createBefore` vote callback
 */
export async function cacheRateLimitInfoForUsers(userIds: string[], postId: string | null, context: ResolverContext) {
  const votedOnUsers = (await loadByIds(context, 'Users', userIds)).filter((user): user is DbUser => !!user);

  await Promise.all(votedOnUsers.map(async (user) => {
    const [activePostRateLimitInfo, activeCommentRateLimitInfo] = await Promise.all([
      rateLimitDateWhenUserNextAbleToPost(user),
      rateLimitDateWhenUserNextAbleToComment(user, postId, context)
    ]);

    USER_AUTO_RATE_LIMIT_CACHE[user._id] = {
      activePostRateLimitInfo,
      activeCommentRateLimitInfo,
      cachedAt: Date.now()
    };
  }));
}

/**
 * Used by the `castVoteAsync` vote callback
 */
export async function compareCachedRateLimitsForReview(userIds: string[], postId: string | null, context: ResolverContext) {
  const now = Date.now();

  clearStaleCachedRateLimits();
  const votedOnUsers = (await loadByIds(context, 'Users', userIds)).filter((user): user is DbUser => !!user);

  await Promise.all(votedOnUsers.map(async (user) => {
    const [activePostRateLimitInfo, activeCommentRateLimitInfo] = await Promise.all([
      rateLimitDateWhenUserNextAbleToPost(user),
      rateLimitDateWhenUserNextAbleToComment(user, postId, context)
    ]);

    const cachedRateLimitInfo = USER_AUTO_RATE_LIMIT_CACHE[user._id];
    // This is technically not atomic/safe, since it risks deleting a new record that was inserted after fetching it on the line above
    // But in practice that's not going to happen, and the only downside is extraneously adding a user to the review queue
    delete USER_AUTO_RATE_LIMIT_CACHE[user._id];

    if (!activePostRateLimitInfo && !activeCommentRateLimitInfo) {
      return;
    }

    const {
      cachedAt,
      activePostRateLimitInfo: cachedPostRateLimitInfo,
      activeCommentRateLimitInfo: cachedCommentRateLimitInfo
    } = cachedRateLimitInfo;

    if (cachedAt > now) {
      return;
    }

    if (isNewRateLimitStricter(activePostRateLimitInfo, cachedPostRateLimitInfo)) {
      triggerReviewForNewRateLimit(user._id, 'User triggered a stricter post rate limit', context);
    }

    if (isNewRateLimitStricter(activeCommentRateLimitInfo, cachedCommentRateLimitInfo)) {
      triggerReviewForNewRateLimit(user._id, 'User triggered a stricter comment rate limit', context);
    }
  }));
}