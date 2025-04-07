/**
 * Helpers for UltraFeed thread prioritization and preparation.
 * 
 * Contains logic for:
 * - Calculating thread health scores
 * - Determining user state relative to threads
 * - Prioritizing threads for display
 * - Deciding which comments to expand/highlight
 */

import { PreDisplayFeedComment, PreDisplayFeedCommentThread, FeedCommentsThread } from '../../components/ultraFeed/ultraFeedTypes';

// Define local parameters for UltraFeed time decay - allows independent tuning
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
const WEIGHT_SUM_KARMA = 1.0; // Weight for total karma
const WEIGHT_MAX_KARMA = 0.5; // Weight for the single highest karma comment
const WEIGHT_AVG_TOP3 = 2.0;  // Weight for the average karma of top comments

// Define the different reasons a thread might be prioritized
export type PrioritizationReason =
  | 'EngagedUpdate'       // New comments since user last interacted
  | 'UnawareHealthy'      // High "health", user never served thread
  | 'AwareHealthy'        // High "health", user served but never viewed/interacted
  | 'ViewedUpdate'        // New comments since user last viewed
  | 'EngagedStale'        // User engaged, nothing new, but resurfacing
  | 'Fallback';           // Default reason if none of the above apply strongly

/**
 * Statistics about a thread used for prioritization.
 */
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
  // Store key timestamps calculated during prioritization
  latestUserInteractionTs: Date | null; // Max lastInteracted for the user in this thread
  latestUserViewTs: Date | null;        // Max lastViewed for the user in this thread
  newestCommentTs: Date | null;         // Max postedAt within the thread
}

/**
 * User's relationship with a thread based on interaction history.
 */
type UserState = 'Unaware' | 'Aware' | 'Viewed' | 'Engaged' | 'Stale';

/**
 * Calculate basic statistics for a thread.
 */
export function getThreadStatistics(thread: PreDisplayFeedCommentThread): ThreadStatistics {
  // Handle edge case of empty threads
  if (!thread || thread.length === 0) {
    return {
      commentCount: 0, maxKarma: 0, sumKarma: 0, sumKarmaSquared: 0, averageKarma: 0, averageTop3Comments: 0
    };
  }

  const commentCount = thread.length;
  const karmaValues = thread.map((comment: PreDisplayFeedComment) => comment.baseScore || 0);

  // Handle potential empty karmaValues array (though covered by thread check)
  const maxKarma = karmaValues.length > 0 ? Math.max(...karmaValues) : 0;
  const sumKarma = karmaValues.reduce((sum: number, score: number) => sum + score, 0);
  const sumKarmaSquared = karmaValues.reduce((sum: number, score: number) => sum + (score * score), 0);

  const numTopComments = Math.min(3, karmaValues.length);
  const sumTop3Comments = karmaValues.slice(0, numTopComments).reduce((sum: number, score: number) => sum + score, 0);
  // Fix: Ensure divisor is not zero
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

  // If no valid timestamp, the thread has effectively zero health/recency
  if (!newestCommentTs) {
    return 0;
  }

  // Calculate age in hours using type assertion after the null check
  const ageMillis = new Date().getTime() - (newestCommentTs as Date).getTime();
  let ageInHours = ageMillis / (1000 * 60 * 60);

  // Ensure age is non-negative (e.g., handle clock skew)
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

  // Convert timestamps to numbers for comparison
  const newestCommentTime = newestCommentTs ? (newestCommentTs as Date).getTime() : 0;
  const interactionTime = latestUserInteractionTs ? (latestUserInteractionTs as Date).getTime() : 0;
  const viewTime = latestUserViewTs ? (latestUserViewTs as Date).getTime() : 0;

  // Determine user state based on interaction history
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
    state = 'Aware'; // Fallback
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

  // 1. Calculate priority info for ALL linear threads initially
  for (const thread of threads) {
    if (!thread || thread.length === 0) continue;

    const stats = getThreadStatistics(thread);

    // --- Find newest comment timestamp ---
    let newestCommentTs: Date | null = null;
    thread.forEach((comment: PreDisplayFeedComment) => {
      const postedAt = comment.metaInfo?.postedAt;
      if (postedAt instanceof Date && (!newestCommentTs || postedAt > newestCommentTs)) {
        newestCommentTs = postedAt;
      }
    });

    // --- Calculate thread health score ---
    const threadHealthScore = calculateThreadHealthScore(thread, stats);

    // --- Determine user state and key timestamps ---
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
      reason = userState === 'Unaware' ? 'UnawareHealthy' : 'AwareHealthy';
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

  // 2. Group by topLevelCommentId
  const groupedByTopLevel: Record<string, PrioritizedThreadInfo[]> = {};
  for (const info of allPrioritizedInfos) {
    // Use the first comment's topLevelCommentId (or its own ID if null) as the key
    const firstComment = info.thread[0];
    if (!firstComment) continue; // Should not happen, but safeguard
    // TODO: Confirm this key logic is correct based on how threads are built
    const topLevelId = firstComment.topLevelCommentId ?? firstComment.commentId;
    if (!groupedByTopLevel[topLevelId]) {
      groupedByTopLevel[topLevelId] = [];
    }
    groupedByTopLevel[topLevelId].push(info);
  }

  // 3. Select the best thread from each group
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

  // 4. Sort the representative threads by priority score
  return representativeThreads.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Find the first comment in a thread with a posted date newer than a reference date.
 */
function findFirstCommentNewerThan(thread: PreDisplayFeedCommentThread, referenceDate: Date | null): PreDisplayFeedComment | null {
  if (!referenceDate) return null;
  
  return thread.find((comment: PreDisplayFeedComment) => {
    const postedAt = comment.metaInfo?.postedAt;
    return postedAt instanceof Date && postedAt > referenceDate;
  }) || null;
}

/**
 * Find the comment a user last interacted with in a thread.
 */
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

/**
 * Find the newest comment in a thread based on posted date.
 */
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
 * Determine which comments to expand and highlight based on prioritization reason.
 */
export function prepareCommentThreadForResolver(
  prioritizedInfo: PrioritizedThreadInfo
): FeedCommentsThread {
  const { thread, reason, latestUserInteractionTs, latestUserViewTs } = prioritizedInfo;
  const numComments = thread.length;
  
  if (numComments === 0) {
    // Should not happen if filtered earlier, but handle defensively
    return { 
      comments: [],
    };
  }

  // --- Determine 1-2 comments to expand based on reason ---
  const expandedCommentIds = new Set<string>();
  const firstCommentId = thread[0].commentId;
  
  // Always expand the first comment for context (unless specified otherwise in logic)
  expandedCommentIds.add(firstCommentId);
  
  let primaryCandidateId: string | null = null;

  try {
    switch (reason) {
      case 'EngagedUpdate': {
        // Find first comment newer than last interaction
        const firstNew = findFirstCommentNewerThan(thread, latestUserInteractionTs);
        primaryCandidateId = firstNew?.commentId ?? null;
        
        // Also add the comment the user last interacted with (if different from first)
        const lastInteractedComment = findLastInteractedComment(thread);
        if (lastInteractedComment && lastInteractedComment.commentId !== firstCommentId) {
          expandedCommentIds.add(lastInteractedComment.commentId);
        }
        break;
      }
      case 'UnawareHealthy':
      case 'AwareHealthy': {
        // Find newest comment
        const newest = findNewestComment(thread);
        primaryCandidateId = newest?.commentId ?? null;
        break;
      }
      case 'ViewedUpdate': {
        // Find first comment newer than last view
        const firstNew = findFirstCommentNewerThan(thread, latestUserViewTs);
        primaryCandidateId = firstNew?.commentId ?? null;
        break;
      }
      case 'EngagedStale': {
        // Find comment user last interacted with
        const lastInteractedComment = findLastInteractedComment(thread);
        primaryCandidateId = lastInteractedComment?.commentId ?? null;
        break;
      }
      case 'Fallback':
      default: {
        // Default: Expand newest if different from first
        const newest = findNewestComment(thread);
        primaryCandidateId = newest?.commentId ?? null;
        break;
      }
    }

    // Add primary candidate if valid and not already included
    if (primaryCandidateId && primaryCandidateId !== firstCommentId) {
      expandedCommentIds.add(primaryCandidateId);
    }

    // Ensure we don't exceed 2 expanded comments
    while (expandedCommentIds.size > 2) {
      // Remove comments that aren't the first or primary (shouldn't happen with current logic)
      const idsToRemove = Array.from(expandedCommentIds).filter(
        id => id !== firstCommentId && id !== primaryCandidateId
      );
      
      if (idsToRemove.length > 0) {
        expandedCommentIds.delete(idsToRemove[0]);
      } else {
        // Shouldn't happen, but break to prevent infinite loop
        break;
      }
    }
  } catch (error) {
    console.error("Error determining expanded comments:", error, { reason, thread });
    // Fallback: just expand the first comment
    expandedCommentIds.clear();
    expandedCommentIds.add(firstCommentId);
  }

  return {
    comments: thread,
  };
} 
