/**
 * Helpers for UltraFeed thread prioritization and preparation.
 * 
 * Of all files, this is the most vibe-coded and most-placeholder-y
 * 
 * Contains logic for:
 * - Calculating thread health scores
 * - Determining user state relative to threads
 * - Prioritizing threads for display
 * - Deciding which comments to expand/highlight
 */

import { PreDisplayFeedComment, PreDisplayFeedCommentThread, FeedCommentsThread, FeedCommentMetaInfo } from '../../components/ultraFeed/ultraFeedTypes';

// Define local parameters for UltraFeed time decay which is same formula as HN to down-weight older threads
const ULTRAFEED_SCORE_BIAS = 3; // Similar to SCORE_BIAS elsewhere, adjusts starting decay
const ULTRAFEED_TIME_DECAY_FACTOR = 2.00; // Controls the rate of decay, higher means faster decay

// Define multipliers for prioritization reasons
const MULTIPLIER_ENGAGED_UPDATE = 5;
const MULTIPLIER_UNAWARE_HEALTHY = 3; // Base multiplier for new/unseen threads
const MULTIPLIER_VIEWED_UPDATE = 4;
const MULTIPLIER_ENGAGED_STALE = 1.1;
const MULTIPLIER_STALE = 0.1;
const MULTIPLIER_NOVELTY_BOOST = 1.2; // Extra boost if content is unserved

// Define weights for base score components in health calculation, these are summed up to form the "baseScore" for the thread
const WEIGHT_SUM_KARMA = 1.0;
const WEIGHT_MAX_KARMA = 0.5;
const WEIGHT_AVG_TOP3 = 2.0; 

// Define the different reasons a thread might be prioritized
export type PrioritizationReason =
  | 'EngagedUpdate'       // New comments since user last interacted
  | 'UnviewedHealthy'     // High "health", user never viewed/interacted (served or unserved)
  | 'ViewedUpdate'        // New comments since user last viewed this thread
  | 'EngagedStale'        // User engaged, nothing new, but resurfacing
  | 'Fallback';           // Default reason if none of the above apply strongly

export interface ThreadStatistics {
  commentCount: number;
  maxKarma: number;
  sumKarma: number;
  sumKarmaSquared: number;
  averageKarma: number;
  averageTop3Comments: number;
}

/**
 * Extended information about a prioritized thread.
 */
export interface PrioritizedThreadInfo {
  thread: PreDisplayFeedCommentThread;
  stats: ThreadStatistics;
  priorityScore: number;
  reason: PrioritizationReason;
  latestUserInteractionTs: Date | null; // Max lastInteracted for the user in this thread
  latestUserViewTs: Date | null;        // Max lastViewed for the user in this thread
  newestCommentTs: Date | null;         // Max postedAt within the thread
}

// User's relationship with a thread based on interaction history.
type UserState = 'Unaware' | 'Aware' | 'Viewed' | 'Engaged' | 'Stale';

export function getThreadStatistics(thread: PreDisplayFeedCommentThread): ThreadStatistics {
  if (!thread || thread.length === 0) {
    return {
      commentCount: 0, maxKarma: 0, sumKarma: 0, sumKarmaSquared: 0, averageKarma: 0, averageTop3Comments: 0
    };
  }

  const commentCount = thread.length;
  const karmaValues = thread.map((comment: PreDisplayFeedComment) => comment.baseScore || 0);

  const maxKarma = karmaValues.length > 0 ? Math.max(...karmaValues) : 0;
  const sumKarma = karmaValues.reduce((sum: number, score: number) => sum + score, 0);
  const sumKarmaSquared = karmaValues.reduce((sum: number, score: number) => sum + (score * score), 0);

  const numTopComments = Math.min(3, karmaValues.length);
  const sumTop3Comments = karmaValues.slice(0, numTopComments).reduce((sum: number, score: number) => sum + score, 0);
  const averageTop3Comments = numTopComments > 0 ? sumTop3Comments / numTopComments : 0;

  const averageKarma = commentCount > 0 ? sumKarma / commentCount : 0;

  return { commentCount, maxKarma, sumKarma, sumKarmaSquared, averageKarma, averageTop3Comments };
}

/**
 * Calculate an objective "health" score for a thread using HN time decay.
 * Higher scores indicate more active, high-quality threads, biased towards recency.
 */
function calculateThreadHealthScore(thread: PreDisplayFeedCommentThread, stats: ThreadStatistics): number {
  // Find newest comment timestamp
  let newestCommentTs: Date | null = null;
  thread.forEach((comment: PreDisplayFeedComment) => {
    const postedAt = comment.metaInfo?.postedAt;
    // Use instanceof check for type safety before comparison
    if (postedAt instanceof Date && (!newestCommentTs || postedAt > newestCommentTs)) {
      newestCommentTs = postedAt;
    }
  });

  if (!newestCommentTs) {
    return 0;
  }

  const ageMillis = new Date().getTime() - (newestCommentTs as Date).getTime();
  let ageInHours = ageMillis / (1000 * 60 * 60);

  ageInHours = Math.max(0, ageInHours);

  // --- Calculate a composite base score incorporating different stats ---
  const baseScore = 
    (stats.sumKarma * WEIGHT_SUM_KARMA) +
    (stats.maxKarma * WEIGHT_MAX_KARMA) +
    (stats.averageTop3Comments * WEIGHT_AVG_TOP3);

  // Apply HN algorithm to the composite base score
  const denominator = Math.pow(ageInHours + ULTRAFEED_SCORE_BIAS, ULTRAFEED_TIME_DECAY_FACTOR);

  // Handle potential division by zero or invalid exponentiation result
  if (denominator <= 0 || !Number.isFinite(denominator)) {
    return 0;
  }

  const healthScore = baseScore / denominator;

  // Return the calculated health score, ensuring it's a non-negative finite number
  return Number.isFinite(healthScore) && healthScore >= 0 ? healthScore : 0;
}

/**
 * Determine a user's state relative to a thread based on interaction history.
 */
function determineUserState(
  thread: PreDisplayFeedCommentThread,
  newestCommentTs: Date | null
): { 
  state: UserState; 
  latestUserInteractionTs: Date | null;
  latestUserViewTs: Date | null;
  latestUserServedTs: Date | null;
  hasUnserved: boolean;
} {
  // Track latest timestamps for different interactions
  let latestUserInteractionTs: Date | null = null;
  let latestUserViewTs: Date | null = null;
  let latestUserServedTs: Date | null = null;
  let hasUnserved = false;

  // Find latest interaction timestamps across all comments
  thread.forEach((comment: PreDisplayFeedComment) => {
    const meta = comment.metaInfo;
    
    if (meta?.lastInteracted instanceof Date && (!latestUserInteractionTs || meta.lastInteracted > latestUserInteractionTs)) {
      latestUserInteractionTs = meta.lastInteracted;
    }
    
    if (meta?.lastViewed instanceof Date && (!latestUserViewTs || meta.lastViewed > latestUserViewTs)) {
      latestUserViewTs = meta.lastViewed;
    }
    
    if (meta?.lastServed instanceof Date && (!latestUserServedTs || meta.lastServed > latestUserServedTs)) {
      latestUserServedTs = meta.lastServed;
    }
    
    if (meta?.lastServed === null) {
      hasUnserved = true;
    }
  });

  const newestCommentTime = newestCommentTs ? (newestCommentTs as Date).getTime() : 0;
  const interactionTime = latestUserInteractionTs ? (latestUserInteractionTs as Date).getTime() : 0;
  const viewTime = latestUserViewTs ? (latestUserViewTs as Date).getTime() : 0;

  let state: UserState;
  
  if (!latestUserServedTs) {
    state = 'Unaware';
  } else if (!latestUserViewTs && !latestUserInteractionTs) {
    state = 'Aware';
  } else if (latestUserInteractionTs && interactionTime >= viewTime) {
    state = (newestCommentTime > interactionTime) ? 'Engaged' : 'Stale';
  } else if (latestUserViewTs) {
    state = (newestCommentTime > viewTime) ? 'Viewed' : 'Stale';
  } else {
    state = 'Aware';
  }

  return {
    state,
    latestUserInteractionTs,
    latestUserViewTs,
    latestUserServedTs,
    hasUnserved
  };
}

/**
 * Prioritize threads based on health, user state, and novelty.
 * Ensures only the single highest-priority linear path for each top-level
 * comment ID is included in the final sorted list.
 * Returns threads sorted by priority with metadata for presentation.
 */
export function prioritizeThreads(threads: PreDisplayFeedCommentThread[]): PrioritizedThreadInfo[] {
  const allPrioritizedInfos: PrioritizedThreadInfo[] = [];

  for (const thread of threads) {
    if (!thread || thread.length === 0) continue;

    const stats = getThreadStatistics(thread);

    let newestCommentTs: Date | null = null;
    thread.forEach((comment: PreDisplayFeedComment) => {
      const postedAt = comment.metaInfo?.postedAt;
      if (postedAt instanceof Date && (!newestCommentTs || postedAt > newestCommentTs)) {
        newestCommentTs = postedAt;
      }
    });

    const threadHealthScore = calculateThreadHealthScore(thread, stats);

    const {
      state: userState,
      latestUserInteractionTs,
      latestUserViewTs,
      hasUnserved
    } = determineUserState(thread, newestCommentTs);

    // --- Determine prioritization reason & score ---
    let reason: PrioritizationReason = 'Fallback';
    let priorityScore = threadHealthScore; // Base score

    // --- Determine user state adjustments (Multiplicative) ---
    const newestCommentTime = newestCommentTs ? (newestCommentTs as Date).getTime() : 0;
    const interactionTime = latestUserInteractionTs ? (latestUserInteractionTs as Date).getTime() : 0;
    const viewTime = latestUserViewTs ? (latestUserViewTs as Date).getTime() : 0;

    const hasNewSinceInteraction = newestCommentTime > 0 && interactionTime > 0 && newestCommentTime > interactionTime;
    const hasNewSinceView = newestCommentTime > 0 && viewTime > 0 && newestCommentTime > viewTime;

    const noveltyBoostMultiplier = hasUnserved ? MULTIPLIER_NOVELTY_BOOST : 1.0;

    if (userState === 'Engaged' && hasNewSinceInteraction) {
      reason = 'EngagedUpdate';
      priorityScore *= MULTIPLIER_ENGAGED_UPDATE;
    } else if (userState === 'Unaware' || userState === 'Aware') {
      reason = 'UnviewedHealthy';
      priorityScore *= (MULTIPLIER_UNAWARE_HEALTHY * noveltyBoostMultiplier);
    } else if (userState === 'Viewed' && hasNewSinceView) {
      reason = 'ViewedUpdate';
      priorityScore *= MULTIPLIER_VIEWED_UPDATE;
    } else if (userState === 'Engaged' && !hasNewSinceInteraction) {
      reason = 'EngagedStale';
      priorityScore *= MULTIPLIER_ENGAGED_STALE;
    } else if (userState === 'Stale') {
      priorityScore *= MULTIPLIER_STALE;
    }

    priorityScore += (Math.random() * priorityScore * 0.1); // Add randomness

    allPrioritizedInfos.push({
      thread,
      stats,
      priorityScore,
      reason,
      latestUserInteractionTs,
      latestUserViewTs,
      newestCommentTs,
    });
  }

  const groupedByTopLevel: Record<string, PrioritizedThreadInfo[]> = {};
  for (const info of allPrioritizedInfos) {
    const firstComment = info.thread[0];
    if (!firstComment) continue;
    const topLevelId = firstComment.topLevelCommentId ?? firstComment.commentId;
    if (!groupedByTopLevel[topLevelId]) {
      groupedByTopLevel[topLevelId] = [];
    }
    groupedByTopLevel[topLevelId].push(info);
  }

  // Select the best thread from each group
  const representativeThreads: PrioritizedThreadInfo[] = [];
  for (const topLevelId in groupedByTopLevel) {
    const group = groupedByTopLevel[topLevelId];
    if (group.length === 0) continue;

    // Find the thread with the highest priority score within the group
    const bestInGroup = group.reduce((best, current) => {
      return current.priorityScore > best.priorityScore ? current : best;
    });
    representativeThreads.push(bestInGroup);
  }

  return representativeThreads.sort((a, b) => b.priorityScore - a.priorityScore);
}

function findFirstCommentNewerThan(thread: PreDisplayFeedCommentThread, referenceDate: Date | null): PreDisplayFeedComment | null {
  if (!referenceDate) return null;
  
  return thread.find((comment: PreDisplayFeedComment) => {
    const postedAt = comment.metaInfo?.postedAt;
    return postedAt instanceof Date && postedAt > referenceDate;
  }) || null;
}

function findLastInteractedComment(thread: PreDisplayFeedCommentThread): PreDisplayFeedComment | null {
  return thread.reduce((latest: PreDisplayFeedComment | null, current: PreDisplayFeedComment) => {
    const currentTs = current.metaInfo?.lastInteracted;
    const latestTs = latest?.metaInfo?.lastInteracted;
    if (currentTs instanceof Date && (!latestTs || currentTs > latestTs)) {
      return current;
    }
    return latest;
  }, null);
}

function findNewestComment(thread: PreDisplayFeedCommentThread): PreDisplayFeedComment | null {
  return thread.reduce((latest: PreDisplayFeedComment | null, current: PreDisplayFeedComment) => {
    const currentTs = current.metaInfo?.postedAt;
    const latestTs = latest?.metaInfo?.postedAt;
    if (currentTs instanceof Date && (!latestTs || currentTs > latestTs)) {
      return current;
    }
    return latest;
  }, null);
}

/**
 * Determine which comments to expand and highlight based on comment view status and karma.
 */
export function prepareCommentThreadForResolver(
  prioritizedInfo: PrioritizedThreadInfo
): FeedCommentsThread {
  const { thread } = prioritizedInfo;
  const numComments = thread.length;

  // --- Development Sanity Check: Log if receiving a fully viewed thread ---
  const allCommentsViewedOrInteracted = numComments > 0 && thread.every(
    comment => comment.metaInfo?.lastViewed || comment.metaInfo?.lastInteracted
  );
  if (allCommentsViewedOrInteracted) {
    const firstCommentId = thread[0].commentId;
    const topLevelId = thread[0].topLevelCommentId ?? firstCommentId;
    console.warn(`prepareCommentThreadForResolver (WARN): Received fully viewed/interacted thread ${topLevelId} (first comment: ${firstCommentId}). This should have been filtered upstream.`);
    // Note: Processing continues, but this log indicates a potential upstream issue.
  }
  // --- End Sanity Check ---

  if (numComments === 0) {
    return {
      comments: [],
    };
  }

  const expandedCommentIds = new Set<string>();

  // 1. Identify unviewed comments and sort by karma
  const unviewedComments = thread
    .filter(comment => !comment.metaInfo?.lastViewed && !comment.metaInfo?.lastInteracted)
    .sort((a, b) => (b.baseScore ?? 0) - (a.baseScore ?? 0)); // Descending karma

  // 2. Determine if the first comment is unviewed
  const firstComment = thread[0];
  const isFirstCommentUnviewed = firstComment && !firstComment.metaInfo?.lastViewed && !firstComment.metaInfo?.lastInteracted;

  // 3. Apply expansion rules
  if (unviewedComments.length > 0) {
    const highestKarmaUnviewed = unviewedComments[0];
    expandedCommentIds.add(highestKarmaUnviewed.commentId);

    if (isFirstCommentUnviewed && firstComment.commentId !== highestKarmaUnviewed.commentId) {
      // Expand first comment if it's unviewed and different from the highest karma one
      expandedCommentIds.add(firstComment.commentId);
    } else if (unviewedComments.length > 1 && expandedCommentIds.size < 2) {
      // Expand second highest karma if first was viewed/same, and we have space
      expandedCommentIds.add(unviewedComments[1].commentId);
    }
  }


  // --- Process Comments: Add highlight and displayStatus flags in one pass ---
  const finalComments = thread.map((comment): PreDisplayFeedComment => {
    // Highlight if not viewed AND not interacted with
    const shouldHighlight = !comment.metaInfo?.lastViewed && !comment.metaInfo?.lastInteracted;

    // Expand based on the new logic derived above
    const displayStatus = expandedCommentIds.has(comment.commentId) ? 'expanded' : 'collapsed';

    const newMetaInfo: FeedCommentMetaInfo = {
      sources: comment.metaInfo?.sources ?? null,
      siblingCount: comment.metaInfo?.siblingCount ?? null,
      lastServed: comment.metaInfo?.lastServed ?? null,
      lastViewed: comment.metaInfo?.lastViewed ?? null,
      lastInteracted: comment.metaInfo?.lastInteracted ?? null,
      postedAt: comment.metaInfo?.postedAt ?? null,
      displayStatus: displayStatus,
      highlight: shouldHighlight,
    };

    return {
      ...comment,
      metaInfo: newMetaInfo,
    };
  });

  return {
    comments: finalComments,
  };
} 
