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

import { UltraFeedSettingsType } from '../../components/ultraFeed/ultraFeedSettingsTypes';
import { 
  PreDisplayFeedComment, 
  PreDisplayFeedCommentThread, 
  FeedCommentsThread, 
  FeedCommentMetaInfo, 
  FeedCommentFromDb,
  FeedItemSourceType
} from '../../components/ultraFeed/ultraFeedTypes';

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
    // Highlight if not viewed AND not interacted with AND postedAt is within last 7 days
    const postedAtRecently = comment.metaInfo?.postedAt && comment.metaInfo?.postedAt > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const shouldHighlight = !comment.metaInfo?.lastViewed && !comment.metaInfo?.lastInteracted && postedAtRecently;
    const displayStatus = expandedCommentIds.has(comment.commentId) ? 'expanded' : 'collapsed';

    const newMetaInfo: FeedCommentMetaInfo = {
      sources: comment.metaInfo?.sources ?? null,
      directDescendentCount: comment.metaInfo?.directDescendentCount ?? 0,
      lastServed: comment.metaInfo?.lastServed ?? null,
      lastViewed: comment.metaInfo?.lastViewed ?? null,
      lastInteracted: comment.metaInfo?.lastInteracted ?? null,
      postedAt: comment.metaInfo?.postedAt ?? null,
      displayStatus: displayStatus,
      highlight: shouldHighlight ?? false,
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

// Type definition for a comment after initial scoring
interface IntermediateScoredComment extends FeedCommentFromDb {
  score: number;
}

// Type definition for a comment after thread building (includes metaInfo)
interface FinalScoredComment extends IntermediateScoredComment {
  metaInfo: FeedCommentMetaInfo | null;
}

// Type definition for a thread composed of final scored comments
interface FinalScoredCommentThread extends Array<FinalScoredComment> {}

// Type definition for a prioritized thread containing final scored comments
interface PrioritizedThread {
  thread: FinalScoredCommentThread;
  score: number;
  topLevelId: string;
}

// Add a type for the prepared thread that includes a primary source
interface PreparedFeedCommentsThread extends FeedCommentsThread {
  primarySource: FeedItemSourceType | null; // Add a field for the representative source
}

/**
 * Calculates the score for an individual comment based on decay and seen status,
 * using provided settings.
 */
function calculateCommentScore(
  comment: FeedCommentFromDb,
  settings: Pick<UltraFeedSettingsType, 'commentDecayFactor' | 'commentDecayBiasHours' | 'commentSeenPenalty' | 'quickTakeBoost'>
): number {
  if (!comment.postedAt) {
    return 0; // Cannot score without a timestamp
  }

  const ageMillis = new Date().getTime() - comment.postedAt.getTime();
  const ageHours = Math.max(0, ageMillis / (1000 * 60 * 60));
  const baseScore = comment.baseScore ?? 0;

  // Calculate HN-style time decay using settings
  const denominator = Math.pow(ageHours + settings.commentDecayBiasHours, settings.commentDecayFactor);
  let decayedScore = 0;
  if (denominator > 0 && Number.isFinite(denominator)) {
    decayedScore = (baseScore + 1) / denominator;
  }

  // Apply quick take boost if applicable
  const boost = comment.shortform ? settings.quickTakeBoost : 1.0;
  const boostedScore = decayedScore * boost;

  // Apply seen penalty
  const hasBeenSeen = comment.lastViewed !== null;
  const finalScore = boostedScore * (hasBeenSeen ? settings.commentSeenPenalty : 1.0);

  return Number.isFinite(finalScore) && finalScore >= 0 ? finalScore : 0;
}

/**
 * Scores a list of comments using the current algorithm.
 */
function scoreComments(
  comments: FeedCommentFromDb[],
  settings: Pick<UltraFeedSettingsType, 'commentDecayFactor' | 'commentDecayBiasHours' | 'commentSeenPenalty' | 'quickTakeBoost'>
): IntermediateScoredComment[] { 
  return comments.map(comment => ({
    ...comment,
    score: calculateCommentScore(comment, settings),
  }));
}

/**
 * Builds all linear threads from scored comments and calculates a score for each thread.
 */
function buildAndScoreThreads(
  scoredComments: IntermediateScoredComment[]
): PrioritizedThread[] { 
  // Group comments by their effective top-level ID
  const groups: Record<string, IntermediateScoredComment[]> = {};
  for (const comment of scoredComments) {
    const topId = comment.topLevelCommentId ?? comment.commentId;
    if (!groups[topId]) {
      groups[topId] = [];
    }
    groups[topId].push(comment);
  }

  const allPossibleFinalThreads: FinalScoredCommentThread[] = []; // Use Final type
  // Map uses Intermediate type
  const commentsById = new Map<string, IntermediateScoredComment>(scoredComments.map(c => [c.commentId, c])); 

  for (const [_topLevelId, groupComments] of Object.entries(groups)) {
    if (!groupComments || groupComments.length === 0) continue;

    // Call the existing function to build pre-display threads
    const generatedPreDisplayThreads = buildDistinctLinearThreads(groupComments);

    // Map the result back to FinalScoredCommentThread format, merging metaInfo
    for (const preDisplayThread of generatedPreDisplayThreads) {
      // Map to FinalScoredComment[]
      const finalScoredThread: FinalScoredComment[] = preDisplayThread
        .map(preDisplayComment => {
          const originalScoredCommentBase = commentsById.get(preDisplayComment.commentId);
          if (!originalScoredCommentBase) {
            // eslint-disable-next-line no-console
            console.warn(`buildDistinctLinearThreads returned comment ${preDisplayComment.commentId} not found in original map. Filtering out.`);
            return null; 
          }
          // Create FinalScoredComment with metaInfo
          return { 
            ...originalScoredCommentBase, 
            metaInfo: preDisplayComment.metaInfo
          } as FinalScoredComment; // Assert type here after merging
        })
        .filter(Boolean) as FinalScoredComment[];
      
      if (finalScoredThread.length > 0) {
        allPossibleFinalThreads.push(finalScoredThread);
      }
    }
  }

  // Calculate score for each valid thread path
  const scoredThreads: PrioritizedThread[] = allPossibleFinalThreads.map(thread => {
    const threadScore = thread.reduce((sum, comment) => sum + comment.score, 0);
    const topLevelId = thread[0].topLevelCommentId ?? thread[0].commentId;
    return { thread, score: threadScore, topLevelId }; 
  });

  return scoredThreads;
}

/**
 * Selects the highest-scoring thread for each top-level discussion and sorts them.
 */
function selectBestThreads(
  allScoredThreads: PrioritizedThread[]
): PrioritizedThread[] {
  // Group by topLevelId to select the best path
  const groupedByTopLevel: Record<string, PrioritizedThread[]> = {};
  for (const scoredThread of allScoredThreads) {
    if (!groupedByTopLevel[scoredThread.topLevelId]) {
      groupedByTopLevel[scoredThread.topLevelId] = [];
    }
    groupedByTopLevel[scoredThread.topLevelId].push(scoredThread);
  }

  // Select the best thread (highest score) from each group
  const representativeThreads: PrioritizedThread[] = [];
  for (const topLevelId in groupedByTopLevel) {
    const group = groupedByTopLevel[topLevelId];
    if (group.length === 0) continue;

    const bestInGroup = group.reduce((best, current) => {
      return current.score > best.score ? current : best;
    });
    representativeThreads.push(bestInGroup);
  }

  // Sort the representative threads by score (descending)
  const finalRankedThreads = representativeThreads.sort((a, b) => b.score - a.score);
  
  return finalRankedThreads;
}

/**
 * Prepares a single ranked thread for display by determining expansion and highlighting.
 * Also determines a primary source for the thread.
 */
function prepareThreadForDisplay(
  rankedThreadInfo: PrioritizedThread
): PreparedFeedCommentsThread | null { // Return new type
  const thread = rankedThreadInfo.thread;
  const numComments = thread.length;
  if (numComments === 0) return null;

  // Determine primary source (e.g., from the first comment)
  // If the first comment has no source, the thread gets no primary source.
  const firstCommentSource = thread[0]?.sources?.[0] as FeedItemSourceType | undefined;
  const primarySource = firstCommentSource ?? null; // Use first source or null

  const expandedCommentIds = new Set<string>();

  // 1. Identify unviewed comments and sort by BASE SCORE (karma) descending
  const unviewedComments = thread
    .filter(comment => !comment.lastViewed && !comment.lastInteracted) 
    .sort((a, b) => (b.baseScore ?? 0) - (a.baseScore ?? 0)); 

  // 2. Determine if the first comment is unviewed
  const firstComment = thread[0];
  const isFirstCommentUnviewed = firstComment && !firstComment.lastViewed && !firstComment.lastInteracted;

  // 3. Apply expansion rules (similar to original)
  if (unviewedComments.length > 0) {
    const highestKarmaUnviewed = unviewedComments[0];
    expandedCommentIds.add(highestKarmaUnviewed.commentId);

    if (isFirstCommentUnviewed && firstComment.commentId !== highestKarmaUnviewed.commentId && expandedCommentIds.size < 2) {
      expandedCommentIds.add(firstComment.commentId);
    } else if (unviewedComments.length > 1 && expandedCommentIds.size < 2) {
      expandedCommentIds.add(unviewedComments[1].commentId);
    }
  }
  
  // 4. Map to final comment structure with display status and highlight
  const finalComments: PreDisplayFeedComment[] = thread.map((comment): PreDisplayFeedComment => {
    const postedAtRecently = comment.postedAt && comment.postedAt > new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const shouldHighlight = !comment.lastViewed && !comment.lastInteracted && postedAtRecently;
    const displayStatus = expandedCommentIds.has(comment.commentId) ? 'expanded' : 'collapsed';

    // Construct the MetaInfo needed for display
    const newMetaInfo: FeedCommentMetaInfo = {
      sources: comment.sources as FeedItemSourceType[],
      directDescendentCount: comment.metaInfo?.directDescendentCount ?? 0, 
      lastServed: comment.lastServed, 
      lastViewed: comment.lastViewed,
      lastInteracted: comment.lastInteracted,
      postedAt: comment.postedAt,
      displayStatus: displayStatus,
      highlight: shouldHighlight ?? false,
    };

    return {
      commentId: comment.commentId,
      postId: comment.postId,
      baseScore: comment.baseScore,
      topLevelCommentId: comment.topLevelCommentId,
      metaInfo: newMetaInfo,
    };
  });

  return {
    comments: finalComments,
    primarySource: primarySource, // Include the primary source
  };
}

/**
 * Builds comment threads for the UltraFeed using the current algorithm.
 * Fetches data, scores comments, builds threads, ranks threads, prepares for display.
 */
export async function getUltraFeedCommentThreads(
  context: ResolverContext,
  limit = 20,
  settings: UltraFeedSettingsType
): Promise<PreparedFeedCommentsThread[]> { // Return array of new type
  const userId = context.userId;
  if (!userId) {
    return [];
  }

  // --- Step 1: Fetch Data ---
  const commentsRepo = context.repos.comments;
  const rawCommentsData = await commentsRepo.getCommentsForFeed(userId, 1000);

  // --- Step 2: Score Individual Comments ---
  const relevantSettings = { 
    commentDecayFactor: settings.commentDecayFactor, 
    commentDecayBiasHours: settings.commentDecayBiasHours, 
    commentSeenPenalty: settings.commentSeenPenalty,
    quickTakeBoost: settings.quickTakeBoost 
  };
  const scoredComments = scoreComments(rawCommentsData, relevantSettings); 

  // --- Steps 3 & 4a: Build and Score Threads --- 
  const allScoredThreads = buildAndScoreThreads(scoredComments); 

  // --- Step 4b: Select Best Threads --- 
  const finalRankedThreads = selectBestThreads(allScoredThreads); 

  // --- Step 5: Prepare for Display --- 
  const displayThreads = finalRankedThreads
    .slice(0, limit) 
    .map(rankedThreadInfo => prepareThreadForDisplay(rankedThreadInfo))
    .filter(Boolean) as PreparedFeedCommentsThread[];

  return displayThreads;
} 
