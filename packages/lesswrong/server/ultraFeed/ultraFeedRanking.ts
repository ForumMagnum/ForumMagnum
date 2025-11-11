import { FeedFullPost, PreDisplayFeedComment, FeedItemSourceType, ThreadEngagementStats } from '@/components/ultraFeed/ultraFeedTypes';
import { generateThreadHash } from './ultraFeedThreadHelpers';
import moment from 'moment';
import uniq from 'lodash/uniq';
import type {
  RankableItemType,
  PostRankableItem,
  CommentRankableItem,
  ThreadRankableItem,
  RankableItem,
  PostScoreBreakdown,
  ThreadScoreBreakdown,
  ScoreBreakdown,
  RankedItemMetadata,
  MappablePreparedThread,
} from './ultraFeedRankingTypes';
import {
  RankingConfig,
  DEFAULT_RANKING_CONFIG,
  DiversityConstraints,
  DEFAULT_DIVERSITY_CONSTRAINTS,
} from './ultraFeedRankingConfig';


/**
 * Map a FeedFullPost into a PostRankableItem
 */
export function toPostRankable(
  item: FeedFullPost,
  now: Date = new Date(),
): PostRankableItem {
  const post = item.post;
  if (!post?._id) {
    throw new Error('toPostRankable: missing post._id');
  }

  const sources = item.postMetaInfo?.sources;
  const ageHrs = post.postedAt ? moment(now).diff(post.postedAt, 'hours') : 0;
  const isRead = Boolean(item.postMetaInfo?.lastViewed || item.postMetaInfo?.lastInteracted);
  const userSubscribedToAuthor = sources.includes('subscriptionsPosts' as FeedItemSourceType);

  const rankable: PostRankableItem = {
    id: post._id,
    itemType: 'post',
    postId: post._id,
    sources,
    ageHrs,
    isRead,
    userSubscribedToAuthor,
    karma: post.baseScore ?? 0,
  };

  return rankable;
}

/**
 * Map a prepared thread (with PreDisplayFeedComment[]) into a ThreadRankableItem.
 * Optionally supply engagement signals if available to the caller.
 */
export function toThreadRankable(
  thread: MappablePreparedThread,
  engagement?: ThreadEngagementStats,
  now: Date = new Date(),
): ThreadRankableItem {
  const commentIds = thread.comments.map(c => c.commentId)
  const threadId = generateThreadHash(commentIds);

  const perComment: CommentRankableItem[] = thread.comments.map((c): CommentRankableItem => {
    const postedAt = c.metaInfo?.postedAt ?? null;
    const ageHrs = postedAt ? moment(now).diff(postedAt, 'hours') : 0;
    const isRead = Boolean(c.metaInfo?.lastViewed || c.metaInfo?.lastInteracted);
    const primarySource = (c.metaInfo?.sources?.[0] as FeedItemSourceType | undefined);
    const userSubscribedToAuthor = Boolean(c.metaInfo?.sources?.includes('subscriptionsComments' as const));
    return {
      commentId: c.commentId,
      ageHrs,
      isRead,
      userSubscribedToAuthor,
      karma: c.baseScore ?? 0,
      primarySource,
      descendentCount: c.metaInfo?.descendentCount,
      directDescendentCount: c.metaInfo?.directDescendentCount,
    };
  });

  const allSources = uniq([
    ...(thread.primarySource ? [thread.primarySource] : []),
    ...perComment
      .map(c => c.primarySource)
      .filter((s): s is FeedItemSourceType => !!s),
  ]);

  const mostRecentPostedAt: Date | null = thread.comments
    .map(c => c.metaInfo?.postedAt)
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  const ageHrs = mostRecentPostedAt ? moment(now).diff(mostRecentPostedAt, 'hours') : 0;
  const commentCount = perComment.length;
  const unviewedCount = perComment.filter(c => !c.isRead).length;
  const hasShortform = allSources.includes('quicktakes' as FeedItemSourceType);
  const maxCommentKarma = perComment.reduce<number | undefined>((max, c) => {
    const val = c.karma ?? 0;
    return max === undefined ? val : Math.max(max, val);
  }, undefined);

  const isRead = perComment.every(c => c.isRead);
  const userSubscribedToAuthor = perComment.some(c => c.userSubscribedToAuthor);

  const rankable: ThreadRankableItem = {
    id: threadId,
    itemType: 'commentThread',
    threadId,
    sources: allSources,
    ageHrs,
    isRead,
    userSubscribedToAuthor,
    engagement,
    stats: {
      commentCount,
      unviewedCount,
      lastActivityAgeHrs: ageHrs,
      hasShortform,
      maxCommentKarma,
    },
    comments: perComment,
  };

  return rankable;
}

/**
 * Score a single post based on its rankable signals.
 * 
 * Score terms (additive, then typeMultiplier applied):
 * - startingValue: Starting point for all posts
 * - subscribedBonus: Large boost if post is from a subscribed author
 * - karmaBonus: For hacker-news posts: HN-style decay karma/(age+bias)^factor
 *               For subscriptionsPosts/recombee/ageless: Legacy superlinear bonus (no decay)
 * - topicAffinityBonus: Boost based on match with user's topic interests (via tags)
 * - typeMultiplier: Multiplier applied to final additive total
 */
function scorePost(
  post: PostRankableItem,
  config: RankingConfig
): { score: number; breakdown: PostScoreBreakdown } {
  const postConfig = config.posts;
  const startingValue = config.startingValue;

  const subscribedBonus = post.userSubscribedToAuthor ? postConfig.subscribedBonus : 0;

  // Topic affinity bonus: based on post tags matching user's reading history
  // TODO: Not yet implemented - will be calculated from user's tag reading history when available
  const topicAffinityBonus = 0;

  // Determine scoring approach based on source
  const isRecombeePost = post.sources.includes('recombee-lesswrong-custom');
  const isSubscriptionPost = post.sources.includes('subscriptionsPosts');
  
  let karmaBonus = 0;

  if (isRecombeePost || isSubscriptionPost || post.ageHrs === null) {
    // Recombee posts, subscription posts, and ageless items (spotlights, bookmarks): 
    // use legacy karma bonus (no time decay)
    karmaBonus = Math.min(
      Math.pow(post.karma, postConfig.karmaSuperlinearExponent) / postConfig.karmaDivisor,
      postConfig.karmaMaxBonus
    );
  } else {
    // Hacker-news posts: use hyperbolic time decay with cap
    // Formula: karmaBonus = min(karma * scale^exponent / (ageHrs + bias)^exponent, maxBonus)
    const denominator = Math.pow(post.ageHrs + postConfig.timeDecayBias, postConfig.timeDecayExponent);
    const numerator = Math.pow(postConfig.timeDecayScale, postConfig.timeDecayExponent);
    if (denominator > 0 && Number.isFinite(denominator)) {
      karmaBonus = Math.min(post.karma * numerator / denominator, postConfig.karmaMaxBonus);
    }
  }

  const additiveTotal = startingValue + subscribedBonus + karmaBonus + topicAffinityBonus;
  const total = additiveTotal * postConfig.typeMultiplier;

  return {
    score: total,
    breakdown: {
      total,
      terms: {
        subscribedBonus,
        karmaBonus,
        topicAffinityBonus,
      },
      typeMultiplier: postConfig.typeMultiplier,
    },
  };
}


/**
 * Score a single comment thread based on its rankable signals.
 * 
 * Score terms (additive, then repetitionPenaltyMultiplier, then typeMultiplier):
 * - startingValue: Starting point for all threads
 * - unreadSubscribedCommentBonus: Flat bonus per unread subscribed comment (no decay)
 * - engagementContinuationBonus: Boost if you've previously participated/voted/viewed this thread
 * - repliesToYouBonus: High-priority boost if someone replied to your comment(s)
 * - yourPostActivityBonus: High-priority boost for new comments on your post
 * - overallKarmaBonus: HN-style decayed sum of ALL unread comments: sum(karma/(age+bias)^exponent)
 * - topicAffinityBonus: Boost based on post topic matching user interests (TODO: not implemented)
 * - quicktakeBonus: Boost for shortform/quicktake threads (only if top-level comment is unread)
 * - readPostContextBonus: Small boost if you've read the post (you have context)
 * - repetitionPenaltyMultiplier: Multiplicative penalty for recently served threads
 * - typeMultiplier: Multiplier applied to final score
 */
function scoreThread(
  thread: ThreadRankableItem,
  config: RankingConfig
): { score: number; breakdown: ThreadScoreBreakdown } {
  const cfg = config.threads;
  const startingValue = config.startingValue;

  // 1. Unread subscribed comment bonus: subscribedCommentBonus per unread subscribed comment
  // Flat bonus regardless of karma or age - subscriptions are priority
  const unreadSubscribedComments = thread.comments.filter(c => !c.isRead && c.userSubscribedToAuthor);
  const unreadSubscribedCommentBonus = unreadSubscribedComments.length * cfg.subscribedCommentBonus;

  // 2. Engagement continuation bonus: tiered based on your strongest prior engagement
  // Participation (commented) > Voting > Viewing
  const engagement = thread.engagement;
  let engagementContinuationBonus = 0;
  if (engagement) {
    if (engagement.participationCount > 0) {
      engagementContinuationBonus = cfg.engagementParticipationBonus; // 20 pts
    } else if (engagement.votingActivityScore > 0) {
      engagementContinuationBonus = cfg.engagementVotingBonus; // 10 pts
    } else if (engagement.viewScore > 0) {
      engagementContinuationBonus = cfg.engagementViewingBonus; // 5 pts
    }
  }

  // 3. Replies to you: high-priority signal if someone replied to your comment(s)
  // TODO: Need to add hasRepliesToYou to ThreadRankableItem, stubbed to false for now
  const hasRepliesToYou = false; // TODO: Implement
  const repliesToYouBonus = hasRepliesToYou ? cfg.repliesToYouBonus : 0;

  // 4. Your post activity: high-priority signal for new comments on a post you wrote
  // TODO: Need to add isYourPost to ThreadRankableItem, stubbed to false for now
  const isYourPost = false; // TODO: Implement
  const yourPostActivityBonus = isYourPost ? cfg.yourPostBonus : 0;

  // 5. Overall karma bonus: hyperbolic time-decayed sum for ALL unread comments
  // Formula: min(sum(karma * scale^exponent / (ageHrs + bias)^exponent), maxBonus)
  // This applies to both subscribed and non-subscribed comments
  // (subscribed comments also get the flat bonus above)
  const unreadComments = thread.comments.filter(c => !c.isRead);
  let overallKarmaBonus = 0;
  const numerator = Math.pow(cfg.timeDecayScale, cfg.timeDecayExponent);
  for (const comment of unreadComments) {
    const denominator = Math.pow(comment.ageHrs + cfg.timeDecayBias, cfg.timeDecayExponent);
    if (denominator > 0 && Number.isFinite(denominator)) {
      overallKarmaBonus += comment.karma * numerator / denominator;
    }
  }
  // Apply cap to total karma bonus
  overallKarmaBonus = Math.min(overallKarmaBonus, cfg.karmaMaxBonus);

  // 6. Topic affinity bonus: based on post tags (TODO: not implemented yet)
  const topicAffinityBonus = 0; // TODO: Implement when post data available

  // 7. Quicktake bonus: boost for shortform/quicktake threads
  // Only applies if the top-level comment itself is a quicktake AND is unread
  const topLevelComment = thread.comments.find(c => c.commentId === thread.comments[0]?.commentId);
  const isQuicktake = thread.stats.hasShortform;
  const topLevelCommentIsUnread = topLevelComment ? !topLevelComment.isRead : false;
  const quicktakeBonus = (isQuicktake && topLevelCommentIsUnread) ? cfg.quicktakeBonus : 0;

  // 8. Read post context bonus: small boost if you've read the post (you have context)
  const isReadPost = engagement?.isOnReadPost ?? false;
  const readPostContextBonus = isReadPost ? cfg.readPostContextBonus : 0;

  // Calculate additive total before repetition
  const additiveTotal = startingValue + unreadSubscribedCommentBonus + engagementContinuationBonus +
    repliesToYouBonus + yourPostActivityBonus + overallKarmaBonus + topicAffinityBonus +
    quicktakeBonus + readPostContextBonus;

  // 10. Repetition penalty: multiplicative penalty for recently served threads
  // Applied AFTER all additive terms to ensure it dominates
  // For each recent serving: multiply by (1 - penaltyStrength * decayFactor)
  // where decayFactor = 1/(1 + hoursAgo/repetitionDecayHours)
  // Examples with default config (penaltyStrength=0.8, decayHours=6):
  //   served 0 hrs ago → ×0.2 (80% reduction), 3 hrs ago → ×0.5, 6 hrs ago → ×0.7
  let repetitionPenaltyMultiplier = 1.0;
  if (engagement?.servingHoursAgo && engagement.servingHoursAgo.length > 0) {
    for (const hoursAgo of engagement.servingHoursAgo) {
      const decayFactor = 1 / (1 + (hoursAgo / cfg.repetitionDecayHours));
      repetitionPenaltyMultiplier *= (1 - (cfg.repetitionPenaltyStrength * decayFactor));
    }
  }

  const total = additiveTotal * repetitionPenaltyMultiplier * cfg.typeMultiplier;

  return {
    score: total,
    breakdown: {
      total,
      terms: {
        unreadSubscribedCommentBonus,
        engagementContinuationBonus,
        repliesToYouBonus,
        yourPostActivityBonus,
        overallKarmaBonus,
        topicAffinityBonus,
        quicktakeBonus,
        readPostContextBonus,
      },
      repetitionPenaltyMultiplier,
      typeMultiplier: cfg.typeMultiplier,
    },
  };
}

interface ScoredItem {
  id: string;
  score: number;
  item: RankableItem;
  breakdown: ScoreBreakdown;
}

/**
 * Normalize sources array for comparison by sorting.
 * This ensures that e.g. ['hacker-news', 'subscriptionsPosts'] matches ['subscriptionsPosts', 'hacker-news'].
 */
function normalizeSourcesKey(sources?: FeedItemSourceType[]): string {
  if (!sources || sources.length === 0) return '';
  return [...sources].sort().join(',');
}

/**
 * Greedy selection with diversity constraints.
 * Picks items one by one, respecting diversity rules.
 * Returns items with their applied constraints.
 */
function selectWithDiversityConstraints(
  scoredItems: ScoredItem[],
  totalItems: number,
  constraints: DiversityConstraints
): Array<{ id: string; appliedConstraints: string[]; position: number }> {
  const selectedWithMetadata: Array<{ id: string; appliedConstraints: string[]; position: number }> = [];
  const selectedSet = new Set<string>();
  const available = [...scoredItems];
  
  // Track recent selections for diversity
  const recentTypes: RankableItemType[] = [];
  const recentSubscribed: boolean[] = [];
  const recentSources: string[] = []; // normalized source keys
  
  while (selectedWithMetadata.length < totalItems && available.length > 0) {
    const currentPosition = selectedWithMetadata.length;
    const appliedConstraints: string[] = [];
    const windowStart = Math.floor(currentPosition / constraints.guaranteedSlotsPerWindow.windowSize) * constraints.guaranteedSlotsPerWindow.windowSize;
    const positionInWindow = currentPosition - windowStart;
    
    // Check if we need to force a bookmark or spotlight for this window
    const selectedInWindow = selectedWithMetadata.slice(windowStart, currentPosition).map(s => s.id);
    const bookmarksInWindow = selectedInWindow.filter(id => {
      const scoredItem = scoredItems.find(si => si.id === id);
      return scoredItem?.item.sources?.includes('bookmarks' as FeedItemSourceType);
    }).length;
    const spotlightsInWindow = selectedInWindow.filter(id => {
      const scoredItem = scoredItems.find(si => si.id === id);
      return scoredItem?.item.sources?.includes('spotlights' as FeedItemSourceType);
    }).length;
    
    // Force bookmark/spotlight near end of window if not already present
    // With windowSize=20: Spotlight at position 17 (18th item), bookmark at position 19 (20th item)
    const needsSpotlight = positionInWindow === (constraints.guaranteedSlotsPerWindow.windowSize - 3) && 
      spotlightsInWindow < constraints.guaranteedSlotsPerWindow.spotlights;
    
    const needsBookmark = positionInWindow === (constraints.guaranteedSlotsPerWindow.windowSize - 1) && 
      bookmarksInWindow < constraints.guaranteedSlotsPerWindow.bookmarks;
    
    // Check if we need type diversity
    const lastNTypes = recentTypes.slice(-constraints.maxConsecutiveSameType);
    const needsTypeDiversity = lastNTypes.length >= constraints.maxConsecutiveSameType &&
      lastNTypes.every(t => t === lastNTypes[0]);
    const bannedType = needsTypeDiversity ? lastNTypes[0] : undefined;
    
    // Check if we need subscription diversity
    const lastNSubscribed = recentSubscribed.slice(-constraints.subscriptionDiversityWindow);
    const needsNonSubscribed = lastNSubscribed.length >= constraints.subscriptionDiversityWindow &&
      lastNSubscribed.every(s => s);
    
    // Check if we need source diversity
    const lastNSources = recentSources.slice(-constraints.sourceDiversityWindow);
    const needsDifferentSource = lastNSources.length >= constraints.sourceDiversityWindow &&
      lastNSources.every(s => s === lastNSources[0] && s !== '');
    const requiredDifferentSourceKey = needsDifferentSource ? lastNSources[0] : undefined;
    
    let selectedItem: ScoredItem | undefined;
    let attemptedConstraint: string | undefined;
    
    if (needsSpotlight) {
      attemptedConstraint = 'forced-spotlight';
      // Find highest-scoring spotlight
      selectedItem = available.find(si => 
        !selectedSet.has(si.id) &&
        si.item.sources?.includes('spotlights' as FeedItemSourceType)
      );
      if (selectedItem) {
        appliedConstraints.push('forced-spotlight');
      }
    } else if (needsBookmark) {
      attemptedConstraint = 'forced-bookmark';
      // Find highest-scoring bookmark
      selectedItem = available.find(si => 
        !selectedSet.has(si.id) &&
        si.item.sources?.includes('bookmarks' as FeedItemSourceType)
      );
      if (selectedItem) {
        appliedConstraints.push('forced-bookmark');
      }
    } else if (needsTypeDiversity) {
      attemptedConstraint = 'type-diversity';
      // Find highest-scoring item with different type than recent window
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        return si.item.itemType !== bannedType;
      });
      if (selectedItem) {
        appliedConstraints.push('type-diversity');
      }
    } else if (needsNonSubscribed) {
      attemptedConstraint = 'subscription-diversity';
      // Find highest-scoring non-subscribed item
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        if (si.item.itemType === 'post' || si.item.itemType === 'commentThread') {
          return !si.item.userSubscribedToAuthor;
        }
        return true; // spotlights/bookmarks count as non-subscribed
      });
      if (selectedItem) {
        appliedConstraints.push('subscription-diversity');
      }
    } else if (needsDifferentSource) {
      attemptedConstraint = 'source-diversity';
      // Find highest-scoring item with different sources than recent window
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        const sourceKey = normalizeSourcesKey(si.item.sources);
        return sourceKey !== requiredDifferentSourceKey;
      });
      if (selectedItem) {
        appliedConstraints.push('source-diversity');
      }
    } else {
      // Normal selection: pick highest-scoring item
      selectedItem = available.find(si => !selectedSet.has(si.id));
    }
    
    if (!selectedItem) {
      // No item found matching constraints, pick best available
      selectedItem = available.find(si => !selectedSet.has(si.id));
      if (selectedItem && attemptedConstraint) {
        appliedConstraints.push(`no-match-for-${attemptedConstraint}`);
      }
    }
    
    if (!selectedItem) break; // No more items available
    
    // Add to selected with metadata
    selectedWithMetadata.push({
      id: selectedItem.id,
      appliedConstraints,
      position: currentPosition,
    });
    selectedSet.add(selectedItem.id);
    
    // Track for diversity
    recentTypes.push(selectedItem.item.itemType);
    const isSubscribed = selectedItem.item.itemType === 'post' 
      ? selectedItem.item.userSubscribedToAuthor
      : selectedItem.item.itemType === 'commentThread'
        ? selectedItem.item.userSubscribedToAuthor
        : false;
    recentSubscribed.push(isSubscribed);
    recentSources.push(normalizeSourcesKey(selectedItem.item.sources));
  }
  
  return selectedWithMetadata;
}

/**
 * Score items without applying constraints or ordering.
 * Applies a global score cap (config.maxScore) to all items.
 * Returns items with their score breakdowns for display/analysis.
 */
export function scoreItems(
  items: RankableItem[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): ScoredItem[] {
  return items.map(item => {
    let scoreResult: { score: number; breakdown: ScoreBreakdown };
    
    if (item.itemType === 'post') {
      scoreResult = scorePost(item, config);
    } else if (item.itemType === 'commentThread') {
      scoreResult = scoreThread(item, config);
    } else {
      // Spotlights get baseline score with minimal breakdown
      scoreResult = {
        score: 1,
        breakdown: {
          total: 1,
          terms: {
            subscribedBonus: 0,
            karmaBonus: 0,
            topicAffinityBonus: 0,
          },
          typeMultiplier: 1.0,
        },
      };
    }
    
    // Apply global cap
    const cappedScore = Math.min(scoreResult.score, config.maxScore);
    
    return { 
      id: item.id, 
      score: cappedScore, 
      item,
      breakdown: scoreResult.breakdown,
    };
  });
}

/**
 * Rank UltraFeed items using a scoring algorithm with diversity constraints.
 * Returns ordered items with their ranking metadata (score breakdown and constraints).
 */
export function rankUltraFeedItems(
  items: RankableItem[],
  totalItems: number,
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
  diversityConstraints: DiversityConstraints = DEFAULT_DIVERSITY_CONSTRAINTS
): Array<{ id: string; metadata?: RankedItemMetadata }> {
  // Score all items
  const scoredItems = scoreItems(items, config);

  // Filter out items with zero or negative scores
  const positiveScoreItems = scoredItems.filter(item => item.score > 0);

  // Sort by score descending
  positiveScoreItems.sort((a, b) => b.score - a.score);

  // Apply diversity constraints via greedy selection
  const selectedWithConstraints = selectWithDiversityConstraints(positiveScoreItems, totalItems, diversityConstraints);
  
  // Build final result with complete metadata
  return selectedWithConstraints.map(({ id, appliedConstraints, position }) => {
    const scoredItem = positiveScoreItems.find(si => si.id === id);
    if (!scoredItem) {
      throw new Error(`rankUltraFeedItems: Could not find scored item for id ${id}`);
    }
    
    // TypeScript note: scoreItems() guarantees that commentThread items get ThreadScoreBreakdown
    // and all other items get PostScoreBreakdown. This mapping maintains that invariant.
    if (scoredItem.item.itemType === 'commentThread') {
      return {
        id,
        metadata: {
          rankedItemType: 'commentThread' as const,
          scoreBreakdown: scoredItem.breakdown as ThreadScoreBreakdown,
          selectionConstraints: appliedConstraints,
          position,
        },
      };
    }
    
    // All non-commentThread items (posts, spotlights, subscriptionSuggestions) use PostScoreBreakdown
    return {
      id,
      metadata: {
        rankedItemType: 'post' as const,
        scoreBreakdown: scoredItem.breakdown as PostScoreBreakdown,
        selectionConstraints: appliedConstraints,
        position,
      },
    };
  });
}


