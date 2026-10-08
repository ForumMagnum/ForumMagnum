import { FeedFullPost, FeedItemSourceType, ThreadEngagementStats } from '@/components/ultraFeed/ultraFeedTypes';
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
  RankedItemMetadata,
  MappablePreparedThread,
} from './ultraFeedRankingTypes';
import {
  RankingConfig,
  DEFAULT_RANKING_CONFIG,
  DiversityConstraints,
  DEFAULT_DIVERSITY_CONSTRAINTS,
} from './ultraFeedRankingConfig';


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
    const isRead = !!(c.metaInfo?.lastViewed || c.metaInfo?.lastInteracted);
    const primarySource = (c.metaInfo?.sources?.[0] as FeedItemSourceType | undefined);
    const userSubscribedToAuthor = !!c.metaInfo?.fromSubscribedUser;
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
 * Score a single post based on its properties and configured scoring parameters.
 * See ultraFeedRankingConfig.ts for more details on the parameters.
 */
function scorePost(
  post: PostRankableItem,
  config: RankingConfig
): { score: number; breakdown: PostScoreBreakdown } {
  const postConfig = config.posts;
  const startingValue = config.startingValue;

  const subscribedBonus = post.userSubscribedToAuthor ? postConfig.subscribedBonus : 0;

  // TODO: Not yet implemented - will be calculated from user's tag reading history when available
  const topicAffinityBonus = 0;

  const isRecombeePost = post.sources.includes('recombee-lesswrong-ultrafeed');
  const isSubscriptionPost = post.sources.includes('subscriptionsPosts');
  
  let karmaBonus = 0;
  let timeDecayKarmaDetails: PostScoreBreakdown["timeDecayKarmaDetails"] | undefined;

  if (isRecombeePost || isSubscriptionPost || post.ageHrs === null) {
    karmaBonus = Math.min(
      Math.pow(post.karma, postConfig.karmaSuperlinearExponent) / postConfig.karmaDivisor,
      postConfig.karmaMaxBonus
    );
  } else {
    const denominator = Math.pow(post.ageHrs + postConfig.timeDecayBias, postConfig.timeDecayExponent);
    const numerator = Math.pow(postConfig.timeDecayScale, postConfig.timeDecayExponent);
    if (denominator > 0 && Number.isFinite(denominator)) {
      const timeDecayMultiplier = numerator / denominator;
      karmaBonus = Math.min(post.karma * timeDecayMultiplier, postConfig.karmaMaxBonus);
      timeDecayKarmaDetails = {
        karma: post.karma,
        timeDecayMultiplier,
      };
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
      timeDecayKarmaDetails,
      typeMultiplier: postConfig.typeMultiplier,
    },
  };
}


/**
 * Score a single comment thread based on its rankable signals.
 * See ultraFeedRankingConfig.ts for more details on the parameters.
 */
function scoreThread(
  thread: ThreadRankableItem,
  config: RankingConfig
): { score: number; breakdown: ThreadScoreBreakdown } {
  const cfg = config.threads;
  const startingValue = config.startingValue;

  const unreadSubscribedComments = thread.comments.filter(c => !c.isRead && c.userSubscribedToAuthor);
  const unreadSubscribedCommentBonus = unreadSubscribedComments.length * cfg.subscribedCommentBonus;

  const engagement = thread.engagement;
  let engagementContinuationBonus = 0;
  if (engagement) {
    if (engagement.participationCount > 0) {
      engagementContinuationBonus = cfg.engagementParticipationBonus;
    } else if (engagement.votingActivityScore > 0) {
      engagementContinuationBonus = cfg.engagementVotingBonus;
    } else if (engagement.viewScore > 0) {
      engagementContinuationBonus = cfg.engagementViewingBonus;
    }
  }

  // TODO: Need to add hasRepliesToYou to ThreadRankableItem, stubbed to false for now
  const hasRepliesToYou = false; // TODO: Implement
  const repliesToYouBonus = hasRepliesToYou ? cfg.repliesToYouBonus : 0;

  // TODO: Need to add isYourPost to ThreadRankableItem, stubbed to false for now
  const isYourPost = false; // TODO: Implement
  const yourPostActivityBonus = isYourPost ? cfg.yourPostBonus : 0;

  const unreadComments = thread.comments.filter(c => !c.isRead);
  const numerator = Math.pow(cfg.timeDecayScale, cfg.timeDecayExponent);
  const decayedCommentScores = unreadComments
    .map(comment => {
      const denominator = Math.pow(comment.ageHrs + cfg.timeDecayBias, cfg.timeDecayExponent);
      if (denominator <= 0 || !Number.isFinite(denominator)) {
        return null;
      }

      const timeDecayMultiplier = numerator / denominator;
      return {
        karma: comment.karma,
        decayedKarma: comment.karma * timeDecayMultiplier,
      };
    })
    .filter((commentScore): commentScore is { karma: number; decayedKarma: number } => !!commentScore)
    .sort((a, b) => b.decayedKarma - a.decayedKarma);

  let rankWeightedKarma = 0;
  let rankWeightedDecayedKarma = 0;
  decayedCommentScores.forEach((commentScore, index) => {
    const rankWeight = Math.pow(0.5, index);
    rankWeightedKarma += commentScore.karma * rankWeight;
    rankWeightedDecayedKarma += commentScore.decayedKarma * rankWeight;
  });

  const timeDecayKarmaDetails: ThreadScoreBreakdown["timeDecayKarmaDetails"] | undefined = decayedCommentScores.length > 0
    ? {
      karma: rankWeightedKarma,
      timeDecayMultiplier: rankWeightedKarma === 0 ? 0 : rankWeightedDecayedKarma / rankWeightedKarma,
    }
    : undefined;
  let overallKarmaBonus = rankWeightedDecayedKarma;
  overallKarmaBonus = Math.min(overallKarmaBonus, cfg.karmaMaxBonus);

  const topicAffinityBonus = 0;
  const topLevelComment = thread.comments.find(c => c.commentId === thread.comments[0]?.commentId);
  const isQuicktake = thread.stats.hasShortform;
  const topLevelCommentIsUnread = topLevelComment ? !topLevelComment.isRead : false;
  const quicktakeBonus = (isQuicktake && topLevelCommentIsUnread) ? cfg.quicktakeBonus : 0;
  const typeMultiplier = isQuicktake ? 1.0 : cfg.typeMultiplier;

  const isReadPost = engagement?.isOnReadPost ?? false;
  const readPostContextBonus = isReadPost ? cfg.readPostContextBonus : 0;

  const additiveTotal = startingValue + unreadSubscribedCommentBonus + engagementContinuationBonus +
    repliesToYouBonus + yourPostActivityBonus + overallKarmaBonus + topicAffinityBonus +
    quicktakeBonus + readPostContextBonus;

  let repetitionPenaltyMultiplier = 1.0;
  if (engagement?.servingHoursAgo && engagement.servingHoursAgo.length > 0) {
    for (const hoursAgo of engagement.servingHoursAgo) {
      const decayFactor = 1 / (1 + (hoursAgo / cfg.repetitionDecayHours));
      repetitionPenaltyMultiplier *= (1 - (cfg.repetitionPenaltyStrength * decayFactor));
    }
  }

  const total = additiveTotal * repetitionPenaltyMultiplier * typeMultiplier;

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
      timeDecayKarmaDetails,
      repetitionPenaltyMultiplier,
      typeMultiplier,
    },
  };
}

interface PostScoredItem {
  itemType: 'post';
  id: string;
  score: number;
  item: PostRankableItem;
  breakdown: PostScoreBreakdown;
}

interface ThreadScoredItem {
  itemType: 'commentThread';
  id: string;
  score: number;
  item: ThreadRankableItem;
  breakdown: ThreadScoreBreakdown;
}

type ScoredItem = PostScoredItem | ThreadScoredItem;

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
  
  const recentTypes: RankableItemType[] = [];
  const recentSubscribed: boolean[] = [];
  const recentSources: string[] = [];
  
  while (selectedWithMetadata.length < totalItems && available.length > 0) {
    const currentPosition = selectedWithMetadata.length;
    const appliedConstraints: string[] = [];
    const windowStart = Math.floor(currentPosition / constraints.guaranteedSlotsPerWindow.windowSize) * constraints.guaranteedSlotsPerWindow.windowSize;
    const positionInWindow = currentPosition - windowStart;
    
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
    
    const lastNTypes = recentTypes.slice(-constraints.maxConsecutiveSameType);
    const needsTypeDiversity = lastNTypes.length >= constraints.maxConsecutiveSameType &&
      lastNTypes.every(t => t === lastNTypes[0]);
    const bannedType = needsTypeDiversity ? lastNTypes[0] : undefined;
    
    const lastNSubscribed = recentSubscribed.slice(-constraints.subscriptionDiversityWindow);
    const needsNonSubscribed = lastNSubscribed.length >= constraints.subscriptionDiversityWindow &&
      lastNSubscribed.every(s => s);
    
    const lastNSources = recentSources.slice(-constraints.sourceDiversityWindow);
    const needsDifferentSource = lastNSources.length >= constraints.sourceDiversityWindow &&
      lastNSources.every(s => s === lastNSources[0] && s !== '');
    const requiredDifferentSourceKey = needsDifferentSource ? lastNSources[0] : undefined;
    
    let selectedItem: ScoredItem | undefined;
    let attemptedConstraint: string | undefined;
    
    if (needsSpotlight) {
      attemptedConstraint = 'forced-spotlight';
      selectedItem = available.find(si => 
        !selectedSet.has(si.id) &&
        si.item.sources?.includes('spotlights' as FeedItemSourceType)
      );
      if (selectedItem) {
        appliedConstraints.push('forced-spotlight');
      }
    } else if (needsBookmark) {
      attemptedConstraint = 'forced-bookmark';
      const availableBookmarks = available.filter(si => 
        !selectedSet.has(si.id) &&
        si.item.sources?.includes('bookmarks' as FeedItemSourceType)
      );
      if (availableBookmarks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableBookmarks.length);
        selectedItem = availableBookmarks[randomIndex];
        appliedConstraints.push('forced-bookmark');
      }
    } else if (needsTypeDiversity) {
      attemptedConstraint = 'type-diversity';
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        return si.item.itemType !== bannedType;
      });
      if (selectedItem) {
        appliedConstraints.push('type-diversity');
      }
    } else if (needsNonSubscribed) {
      attemptedConstraint = 'subscription-diversity';
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        if (si.item.itemType === 'post' || si.item.itemType === 'commentThread') {
          return !si.item.userSubscribedToAuthor;
        }
        return true;
      });
      if (selectedItem) {
        appliedConstraints.push('subscription-diversity');
      }
    } else if (needsDifferentSource) {
      attemptedConstraint = 'source-diversity';
      selectedItem = available.find(si => {
        if (selectedSet.has(si.id)) return false;
        const sourceKey = normalizeSourcesKey(si.item.sources);
        return sourceKey !== requiredDifferentSourceKey;
      });
      if (selectedItem) {
        appliedConstraints.push('source-diversity');
      }
    } else {
      selectedItem = available.find(si => !selectedSet.has(si.id));
    }
    
    if (!selectedItem) {
      selectedItem = available.find(si => !selectedSet.has(si.id));
      if (selectedItem && attemptedConstraint) {
        appliedConstraints.push(`no-match-for-${attemptedConstraint}`);
      }
    }
    
    if (!selectedItem) break;
    
    selectedWithMetadata.push({
      id: selectedItem.id,
      appliedConstraints,
      position: currentPosition,
    });
    selectedSet.add(selectedItem.id);
    
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
 * Returns items with their score breakdowns for display/analysis.
 */
export function scoreItems(
  items: RankableItem[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG
): ScoredItem[] {
  return items.map(item => {
    if (item.itemType === 'post') {
      const scoreResult = scorePost(item, config);
      return {
        itemType: 'post',
        id: item.id,
        score: scoreResult.score,
        item,
        breakdown: scoreResult.breakdown,
      };
    }

    const scoreResult = scoreThread(item, config);
    return { 
      itemType: 'commentThread',
      id: item.id, 
      score: scoreResult.score, 
      item,
      breakdown: scoreResult.breakdown,
    };
  });
}

function scoredItemToMetadata(
  scoredItem: ScoredItem,
  selectionConstraints: string[],
  position: number,
): RankedItemMetadata {
  if (scoredItem.itemType === 'commentThread') {
    return {
      rankedItemType: 'commentThread',
      scoreBreakdown: scoredItem.breakdown,
      selectionConstraints,
      position,
    };
  }

  return {
    rankedItemType: 'post',
    scoreBreakdown: scoredItem.breakdown,
    selectionConstraints,
    position,
  };
}

export function scoreAllUltraFeedItems(
  items: RankableItem[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
): Array<{ id: string; metadata: RankedItemMetadata }> {
  const scoredItems = scoreItems(items, config);
  scoredItems.sort((a, b) => b.score - a.score);

  return scoredItems.map((scoredItem, position) => ({
    id: scoredItem.id,
    metadata: scoredItemToMetadata(scoredItem, [], position),
  }));
}

export function rankUltraFeedItems(
  items: RankableItem[],
  totalItems: number,
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
  diversityConstraints: DiversityConstraints = DEFAULT_DIVERSITY_CONSTRAINTS
): Array<{ id: string; metadata?: RankedItemMetadata }> {
  const scoredItems = scoreItems(items, config);


  scoredItems.sort((a, b) => b.score - a.score);

  const selectedWithConstraints = selectWithDiversityConstraints(scoredItems, totalItems, diversityConstraints);
  
  return selectedWithConstraints.map(({ id, appliedConstraints, position }) => {
    const scoredItem = scoredItems.find(si => si.id === id);
    if (!scoredItem) {
      throw new Error(`rankUltraFeedItems: Could not find scored item for id ${id}`);
    }
    
    return {
      id,
      metadata: scoredItemToMetadata(scoredItem, appliedConstraints, position),
    };
  });
}


