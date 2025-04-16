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
 * - Building comment threads from raw comment data
 */

import { 
  PreDisplayFeedComment, 
  PreDisplayFeedCommentThread, 
  FeedCommentsThread, 
  FeedCommentMetaInfo, 
  FeedCommentFromDb,
  FeedItemSourceType
} from '../../components/ultraFeed/ultraFeedTypes';
import CommentsRepo from '../../server/repos/CommentsRepo';

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
  latestUserInteractionTs: Date | null;
  latestUserViewTs: Date | null;
  newestCommentTs: Date | null;
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

    const bestInGroup = group.reduce((best, current) => {
      return current.priorityScore > best.priorityScore ? current : best;
    });
    representativeThreads.push(bestInGroup);
  }

  return representativeThreads.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Determine which comments to expand and highlight based on comment view status and karma.
 */
export function prepareCommentThreadForResolver(
  prioritizedInfo: PrioritizedThreadInfo
): FeedCommentsThread {
  const { thread } = prioritizedInfo;
  const numComments = thread.length;

  // Sanity Check: Log if receiving a fully viewed thread TODO: remove after development
  const allCommentsViewedOrInteracted = numComments > 0 && thread.every(
    comment => comment.metaInfo?.lastViewed || comment.metaInfo?.lastInteracted
  );
  if (allCommentsViewedOrInteracted) {
    const firstCommentId = thread[0].commentId;
    const topLevelId = thread[0].topLevelCommentId ?? firstCommentId;
    // eslint-disable-next-line no-console
    console.warn(`prepareCommentThreadForResolver (WARN): Received fully viewed/interacted thread ${topLevelId} (first comment: ${firstCommentId}). This should have been filtered upstream.`);
  }

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


  const finalComments = thread.map((comment): PreDisplayFeedComment => {
    // Highlight if not viewed AND not interacted with
    const shouldHighlight = !comment.metaInfo?.lastViewed && !comment.metaInfo?.lastInteracted;
    const displayStatus = expandedCommentIds.has(comment.commentId) ? 'expanded' : 'collapsed';

    const newMetaInfo: FeedCommentMetaInfo = {
      sources: comment.metaInfo?.sources ?? null,
      directDescendentCount: comment.metaInfo?.directDescendentCount ?? 0,
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

/**
 * Transforms comment data from the database into thread structures
 */
export function getAllCommentThreads(candidates: FeedCommentFromDb[]): PreDisplayFeedComment[][] {
  const groups: Record<string, FeedCommentFromDb[]> = {};
  for (const candidate of candidates) {
    const topId = candidate.topLevelCommentId ?? candidate.commentId;
    if (!groups[topId]) {
      groups[topId] = [];
    }
    groups[topId].push(candidate);
  }

  const allThreads: PreDisplayFeedComment[][] = [];

  for (const [_topLevelId, groupCandidates] of Object.entries(groups)) {
    const generatedThreads = buildDistinctLinearThreads(groupCandidates);

    // Filter out threads where every comment has been seen/interacted with
    const unreadThreads = generatedThreads.filter(thread =>
      // Keep the thread if *at least one* comment is unread
      thread.some(comment =>
        !comment.metaInfo?.lastViewed && !comment.metaInfo?.lastInteracted
      )
    );

    allThreads.push(...unreadThreads);
  }

  return allThreads;
}

/**
 * Builds distinct linear comment threads from a set of comments
 * (Each thread is a valid path from root to leaf)
 */
export function buildDistinctLinearThreads(
  candidates: FeedCommentFromDb[]
): PreDisplayFeedCommentThread[] {
  if (!candidates.length) return [];

  const children: Record<string, string[]> = {};
  for (const c of candidates) {
    const parent = c.parentCommentId ?? "root";
    if (!children[parent]) {
      children[parent] = [];
    }
    children[parent].push(c.commentId);
  }

  const enhancedCandidates: PreDisplayFeedComment[] = candidates.map(candidate => {
    const directDescendentCount = children[candidate.commentId] ? children[candidate.commentId].length : 0;

    return {
      commentId: candidate.commentId,
      postId: candidate.postId,
      baseScore: candidate.baseScore,
      topLevelCommentId: candidate.topLevelCommentId,
      metaInfo: {
        sources: candidate.sources as FeedItemSourceType[],
        directDescendentCount,
        lastServed: candidate.lastServed,
        lastViewed: candidate.lastViewed,
        lastInteracted: candidate.lastInteracted,
        postedAt: candidate.postedAt,
      }
    };
  });

  const commentsById = new Map<string, PreDisplayFeedComment>(
    enhancedCandidates.map((c) => [c.commentId, c])
  );

  const topLevelId = candidates[0].topLevelCommentId;

  if (!topLevelId) {
    // eslint-disable-next-line no-console
    console.warn("buildDistinctLinearThreads: No top-level comment ID found. Returning empty array.");
    return [];
  }

  const buildCommentThreads = (currentId: string): PreDisplayFeedCommentThread[] => {
    const currentCandidate = commentsById.get(currentId);
    if (!currentCandidate) return [];

    const childIds = children[currentId] || [];
    if (!childIds.length) {
      return [[currentCandidate]]; // Leaf node
    }

    const results: PreDisplayFeedCommentThread[] = [];
    for (const cid of childIds) {
      const subPaths = buildCommentThreads(cid);
      for (const subPath of subPaths) {
        results.push([currentCandidate, ...subPath]);
      }
    }
    return results;
  };

  if (!commentsById.has(topLevelId)) {
    // eslint-disable-next-line no-console
    console.warn(`buildDistinctLinearThreads: Top level comment ${topLevelId} not found in candidates map. Thread group might be incomplete or invalid.`);
    return [];
  }

  return buildCommentThreads(topLevelId);
}

/**
 * Builds comment threads for the UltraFeed using raw comment data
 */
export async function getUltraFeedCommentThreads(
  context: ResolverContext,
  limit = 20,
): Promise<FeedCommentsThread[]> {
  const userId = context.userId;

  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn("getUltraFeedCommentThreads: No user ID provided. Returning empty array.");
    return [];
  }

  const commentsRepo = context.repos.comments

  const candidates = await commentsRepo.getCommentsForFeed(userId, 500);
  const threads = getAllCommentThreads(candidates);
  const prioritizedThreadInfos = prioritizeThreads(threads);

  const displayThreads = prioritizedThreadInfos
    .slice(0, limit * 2)
    .map(info => prepareCommentThreadForResolver(info))
    .filter(thread => thread.comments.length > 0);

  return displayThreads.slice(0, limit);
} 
