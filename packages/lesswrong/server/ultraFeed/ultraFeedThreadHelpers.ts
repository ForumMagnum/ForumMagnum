/**
 * Helpers for UltraFeed thread prioritization and preparation.
 * 
 * Contains logic for:
 * - Scoring comments based on decay and user settings
 * - Building linear threads from comment data
 * - Selecting the best thread per top-level comment
 * - Preparing threads for display (expansion/highlighting)
 */

// Safety limits for recursive thread building
const MAX_DEPTH = 50;
const MAX_TOTAL_PATHS = 1000;

import { UltraFeedResolverSettings, CommentScoringSettings, ThreadInterestModelSettings } from '../../components/ultraFeed/ultraFeedSettingsTypes';
import { 
  PreDisplayFeedComment, 
  PreDisplayFeedCommentThread, 
  FeedCommentsThread, 
  FeedCommentMetaInfo, 
  FeedCommentFromDb,
  FeedItemSourceType,
  FeedItemDisplayStatus,
  ThreadEngagementStats,
} from '../../components/ultraFeed/ultraFeedTypes';
import * as crypto from 'crypto';

/**
 * Generates a stable hash ID for a comment thread based on its comment IDs. This creates a consistent identifier for each unique thread composition.
 */
export function generateThreadHash(commentIds: string[]): string {
  if (!commentIds || commentIds.length === 0) {
    return 'empty_thread_hash';
  }
  
  const sortedIds = [...commentIds].sort();
  const hash = crypto.createHash('sha256');
  hash.update(sortedIds.join(','));
  return hash.digest('hex');
}

/**
 * Builds distinct linear comment threads from a set of comments
 * (Each thread is a valid path from root to leaf)
 */
export function buildDistinctLinearThreads(
  candidates: FeedCommentFromDb[]
): PreDisplayFeedCommentThread[] {
  if (!candidates.length) return [];

  let totalPathsGenerated = 0;

  const children: Record<string, string[]> = {};
  for (const c of candidates) {
    const parent = c.parentCommentId ?? "root";
    if (!children[parent]) {
      children[parent] = [];
    }
    children[parent].push(c.commentId);
  }

  const enhancedCandidates: PreDisplayFeedComment[] = candidates.map(candidate => {
    const descendentCount = candidate.descendentCount ?? 0;
    const directDescendentCount = children[candidate.commentId] ? children[candidate.commentId].length : 0;

    return {
      commentId: candidate.commentId,
      postId: candidate.postId,
      baseScore: candidate.baseScore,
      parentCommentId: candidate.parentCommentId ?? undefined,
      topLevelCommentId: candidate.topLevelCommentId,
      metaInfo: {
        sources: candidate.sources as FeedItemSourceType[],
        descendentCount,
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

  const buildCommentThreads = (
    currentId: string, 
    visited = new Set<string>(),
    depth = 0
  ): PreDisplayFeedCommentThread[] => {
    if (depth > MAX_DEPTH) {
      // eslint-disable-next-line no-console
      console.warn(`[buildDistinctLinearThreads] Max depth ${MAX_DEPTH} exceeded at comment ${currentId}`);
      return [];
    }

    if (visited.has(currentId)) {
      // eslint-disable-next-line no-console
      console.error(`[buildDistinctLinearThreads] Cycle detected at comment ${currentId}`);
      return [];
    }

    if (totalPathsGenerated >= MAX_TOTAL_PATHS) {
      // eslint-disable-next-line no-console
      console.warn(`[buildDistinctLinearThreads] Max total paths ${MAX_TOTAL_PATHS} reached`);
      return [];
    }

    const currentCandidate = commentsById.get(currentId);
    if (!currentCandidate) return [];

    // Add current node to visited set
    const newVisited = new Set(visited);
    newVisited.add(currentId);

    const childIds = children[currentId] || [];
    if (!childIds.length) {
      totalPathsGenerated++;
      return [[currentCandidate]]; // Leaf node
    }

    const results: PreDisplayFeedCommentThread[] = [];
    for (const cid of childIds) {
      const subPaths = buildCommentThreads(cid, newVisited, depth + 1);
      for (const subPath of subPaths) {
        if (totalPathsGenerated >= MAX_TOTAL_PATHS) {
          break;
        }
        results.push([currentCandidate, ...subPath]);
        totalPathsGenerated++;
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

interface IntermediateScoredComment extends FeedCommentFromDb {
  score: number;
}

interface FinalScoredComment extends IntermediateScoredComment {
  metaInfo: FeedCommentMetaInfo | null;
}

interface PrioritizedThread {
  thread: FinalScoredComment[];
  score: number;
  topLevelId: string;
}

interface PreparedFeedCommentsThread extends FeedCommentsThread {
  primarySource: FeedItemSourceType;
}

/**
 * Calculates the score for an individual comment based on decay and seen status,
 * using provided settings.
 */
function calculateCommentScore(
  comment: FeedCommentFromDb,
  settings: Pick<CommentScoringSettings, 'commentDecayFactor' | 'commentDecayBiasHours' | 'quickTakeBoost' | 'commentSubscribedAuthorMultiplier'>,
  subscribedToUserIds: Set<string>
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

  let boost = comment.shortform ? settings.quickTakeBoost : 1.0;
  
  if (comment.authorId && subscribedToUserIds.has(comment.authorId)) {
    boost *= settings.commentSubscribedAuthorMultiplier; 
  }

  const boostedScore = decayedScore * boost;

  const hasBeenSeenOrInteracted = comment.lastViewed !== null || comment.lastInteracted !== null;
  
  // For negative scores, always count them (even if viewed) and apply 2x multiplier
  if (boostedScore < 0) {
    const negativeScore = boostedScore * 2;
    return Number.isFinite(negativeScore) ? negativeScore : 0;
  }
  
  // For positive scores, zero out if viewed
  const finalScore = boostedScore * (hasBeenSeenOrInteracted ? 0 : 1.0);
  return Number.isFinite(finalScore) && finalScore >= 0 ? finalScore : 0;
}

/**
 * Calculates the aggregate score for a thread based on settings.
 */
function calculateThreadBaseScore(
  thread: FinalScoredComment[],
  aggregation: CommentScoringSettings['threadScoreAggregation'],
  firstN: CommentScoringSettings['threadScoreFirstN']
): number {
  if (!thread || thread.length === 0) {
    return 0;
  }

  let commentsToScore: FinalScoredComment[];
  if (firstN > 0 && thread.length > firstN) {
    commentsToScore = [...thread]
      .sort((a, b) => b.score - a.score)
      .slice(0, firstN);
  } else {
    commentsToScore = thread;
  }

  if (commentsToScore.length === 0) {
    return 0;
  }

  let score = 0;
  const scores = commentsToScore.map(c => c.score);

  switch (aggregation) {
    case 'sum':
      score = scores.reduce((acc, s) => acc + s, 0);
      break;
    case 'max':
      score = Math.max(...scores);
      break;
    case 'logSum':
      const sum = scores.reduce((acc, s) => acc + s, 0);
      score = Math.log(sum + 1); // Add 1 to avoid log(0)
      break;
    case 'avg':
      score = scores.reduce((acc, s) => acc + s, 0) / scores.length;
      break;
    default:
      // Fallback or error handling
      // eslint-disable-next-line no-console
      console.warn(`Unknown thread score aggregation method: ${aggregation}. Falling back to sum.`);
      score = scores.reduce((acc, s) => acc + s, 0);
      break;
  }

  return Number.isFinite(score) && score >= 0 ? score : 0;
}

/**
 * Scores a list of comments using the current algorithm.
 */
function scoreComments(
  comments: FeedCommentFromDb[],
  settings: Pick<CommentScoringSettings, 'commentDecayFactor' | 'commentDecayBiasHours' | 'quickTakeBoost' | 'commentSubscribedAuthorMultiplier'>,
  subscribedToUserIds: Set<string>
): IntermediateScoredComment[] { 
  return comments.map(comment => ({
    ...comment,
    score: calculateCommentScore(comment, settings, subscribedToUserIds),
  }));
}

/**
 * Calculates an engagement-based score multiplier for a thread.
 */
function calculateThreadEngagementMultiplier(
  topLevelId: string,
  engagementStatsMap: Map<string, ThreadEngagementStats>,
  threadInterestModel: ThreadInterestModelSettings
): number {
  let cumulativeProductOfEffects = 1.0;
  const engagementData = engagementStatsMap.get(topLevelId);

  const {
    commentCoeff,
    voteCoeff,
    viewCoeff,
    onReadPostFactor,
    logImpactFactor,
    minOverallMultiplier,
    maxOverallMultiplier,
  } = threadInterestModel;

  if (engagementData) {
    const commentMultiplier = Math.max(0, 1.0 + (engagementData.participationCount * commentCoeff));
    const voteMultiplier = Math.max(0, 1.0 + (engagementData.votingActivityScore * voteCoeff));
    const expansionMultiplier = Math.max(0, 1.0 + (engagementData.viewScore * viewCoeff));

    cumulativeProductOfEffects *= commentMultiplier;
    cumulativeProductOfEffects *= voteMultiplier;
    cumulativeProductOfEffects *= expansionMultiplier;

    if (engagementData.isOnReadPost) {
      cumulativeProductOfEffects *= Math.max(0, onReadPostFactor);
    }
    
    if (engagementData.recentServingCount > 0 && engagementData.servingHoursAgo) {
      let repetitionPenalty = 1.0;
      const repetitionDecayHours = threadInterestModel.repetitionDecayHours;
      const repetitionPenaltyStrength = threadInterestModel.repetitionPenaltyStrength;
      
      for (const hoursAgo of engagementData.servingHoursAgo) {
        // Full penalty at 0 hours, decays as 1/(1 + hoursAgo/bias)
        const decayFactor = 1 / (1 + (hoursAgo / repetitionDecayHours));
        repetitionPenalty *= (1 - (repetitionPenaltyStrength * decayFactor));
      }
      
      cumulativeProductOfEffects *= repetitionPenalty;
    }
  }

  const epsilon = 1e-9; // avoid log(0)
  const logOfProduct = Math.log(Math.max(epsilon, cumulativeProductOfEffects));

  const preliminaryMultiplier = 1.0 + (logOfProduct * logImpactFactor);

  let finalScoreMultiplier = Math.min(maxOverallMultiplier, Math.max(minOverallMultiplier, preliminaryMultiplier));

  if (finalScoreMultiplier <= 0) {
    finalScoreMultiplier = 1.0;
  }

  return finalScoreMultiplier;
}

/**
 * Builds all linear threads from scored comments and calculates a score for each thread.
 */
function buildAndScoreThreads(
  scoredComments: IntermediateScoredComment[],
  settings: Pick<UltraFeedResolverSettings, 'threadInterestModel' | 'commentScoring'>,
  engagementStatsMap: Map<string, ThreadEngagementStats>
): PrioritizedThread[] { 
  const { commentScoring } = settings;
  const threadInterestModel = settings.threadInterestModel; 

  // Group comments by their effective top-level ID
  const groups: Record<string, IntermediateScoredComment[]> = {};
  for (const comment of scoredComments) {
    const topId = comment.topLevelCommentId ?? comment.commentId;
    if (!groups[topId]) {
      groups[topId] = [];
    }
    groups[topId].push(comment);
  }

  const allPossibleFinalThreads: FinalScoredComment[][] = [];
  const commentsById = new Map<string, IntermediateScoredComment>(scoredComments.map(c => [c.commentId, c])); 

  for (const [_topLevelId, groupComments] of Object.entries(groups)) {
    if (!groupComments || groupComments.length === 0) continue;

    // Skip this thread group if the top-level comment has negative karma
    const topLevelComment = groupComments.find(c => c.topLevelCommentId === c.commentId || !c.parentCommentId);
    if (topLevelComment && (topLevelComment.baseScore ?? 0) < 0) {
      continue;
    }

    const generatedPreDisplayThreads = buildDistinctLinearThreads(groupComments);

    for (const preDisplayThread of generatedPreDisplayThreads) {
      const finalScoredThread: FinalScoredComment[] = preDisplayThread
        .map(preDisplayComment => {
          const originalScoredCommentBase = commentsById.get(preDisplayComment.commentId);
          if (!originalScoredCommentBase) {
            // eslint-disable-next-line no-console
            console.warn(`buildDistinctLinearThreads returned comment ${preDisplayComment.commentId} not found in original map. Filtering out.`);
            return null; 
          }
          return { 
            ...originalScoredCommentBase, 
            metaInfo: preDisplayComment.metaInfo
          } as FinalScoredComment;
        })
        .filter(finalScoredComment => !!finalScoredComment);
      
      if (finalScoredThread.length > 0) {
        // Truncate thread at the first negative karma comment
        const firstNegativeIndex = finalScoredThread.findIndex(comment => (comment.baseScore ?? 0) < 0);
        const truncatedThread = firstNegativeIndex === -1 ? finalScoredThread : finalScoredThread.slice(0, firstNegativeIndex);
        
        if (truncatedThread.length > 0) {
          allPossibleFinalThreads.push(truncatedThread);
        }
      }
    }
  }

  const scoredThreads: PrioritizedThread[] = allPossibleFinalThreads.map(thread => {
    const baseThreadScore = calculateThreadBaseScore(thread, commentScoring.threadScoreAggregation, commentScoring.threadScoreFirstN);
    const topLevelId = thread[0].topLevelCommentId ?? thread[0].commentId;

    const engagementMultiplier = calculateThreadEngagementMultiplier(topLevelId, engagementStatsMap, threadInterestModel);
    const finalThreadScore = baseThreadScore * engagementMultiplier;

    return { thread, score: finalThreadScore, topLevelId }; 
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

  // Find the first comment in the thread that was an initial candidate. Threads are ordered root-first, so this finds the candidate closest to the root.
  const initialCandidateComment = thread.find(comment => comment.isInitialCandidate);

  // The primarySource for the entire thread is determined by that single candidate comment.
  const primarySource = (initialCandidateComment?.primarySource ?? thread[0]?.primarySource ?? 'recentComments')

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
    
    let displayStatus: FeedItemDisplayStatus;
    // Safety check - this should be unreachable since we truncate earlier
    if ((comment.baseScore ?? 0) < 0) {
      displayStatus = 'hidden';
    } else if (expandedCommentIds.has(comment.commentId)) {
      displayStatus = 'expanded';
    } else {
      displayStatus = 'collapsed';
    }

    const newMetaInfo: FeedCommentMetaInfo = {
      sources: comment.sources as FeedItemSourceType[],
      descendentCount: comment.metaInfo?.descendentCount ?? 0, 
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
    primarySource: primarySource as FeedItemSourceType,
  };
}

/**
 * Builds comment threads for the UltraFeed using the current algorithm.
 * Fetches data, scores comments, builds threads, ranks threads, prepares for display.
 */
export async function getUltraFeedCommentThreads(
  context: ResolverContext,
  limit = 20,
  settings: UltraFeedResolverSettings,
  initialCandidateLookbackDays: number,
  commentServedEventRecencyHours: number,
  threadEngagementLookbackDays: number
): Promise<PreparedFeedCommentsThread[]> {
  const userId = context.userId;
  if (!userId) {
    return [];
  }

  const commentsRepo = context.repos.comments;

  const rawCommentsDataPromise = commentsRepo.getCommentsForFeed(
    userId, 
    1000, 
    initialCandidateLookbackDays, 
    commentServedEventRecencyHours
  );
  const engagementStatsPromise = commentsRepo.getThreadEngagementStatsForRecentlyActiveThreads(
    userId,
    threadEngagementLookbackDays
  );
  const subscribedToUserIdsPromise = context.Subscriptions.find({
    collectionName: 'Users',
    userId,
    state: 'subscribed',
    type: { $in: ['newActivityForFeed', 'newPosts', 'newComments'] },
    deleted: { $ne: true },
  }, undefined, {
    documentId: 1,
  }).fetch().then(rows => rows.map(row => row.documentId).filter(id => id !== null));

  const [
    rawCommentsData,
    engagementStatsList,
    subscribedToUserIdsList
  ] = await Promise.all([
    rawCommentsDataPromise,
    engagementStatsPromise,
    subscribedToUserIdsPromise
  ]);

  const subscribedToUserIds = new Set(subscribedToUserIdsList);
  const engagementStatsMap = new Map(engagementStatsList.map(stats => [stats.threadTopLevelId, stats]));

  // --- Score Individual Comments ---
  const individualCommentScoringSettings = settings.commentScoring; // Pass the nested object
  const scoredComments = scoreComments(rawCommentsData, individualCommentScoringSettings, subscribedToUserIds);

  // --- Build and Score Threads --- 
  const threadProcessingSettings = {
    commentScoring: settings.commentScoring,
    threadInterestModel: settings.threadInterestModel,
  };
  const allScoredThreads = buildAndScoreThreads(scoredComments, threadProcessingSettings, engagementStatsMap); 

  // --- Select Best Threads --- 
  const finalRankedThreads = selectBestThreads(allScoredThreads); 

  // --- Filter out non-viable threads ---
  const viableThreads = finalRankedThreads.filter(rankedThreadInfo => {
    const thread = rankedThreadInfo.thread;
    
    // Exclude threads with zero or negative scores
    if (rankedThreadInfo.score <= 0) return false;
    
    // Exclude threads where ALL comments have been viewed or interacted with
    const hasUnviewedComment = thread.some(comment => 
      !comment.lastViewed && !comment.lastInteracted
    );
    if (!hasUnviewedComment) return false;
    
    return true;
  });

  // --- Prepare for Display --- 
  const displayThreads = viableThreads
    .slice(0, limit) 
    .map(rankedThreadInfo => prepareThreadForDisplay(rankedThreadInfo))
    .filter(rankedThreadInfo => !!rankedThreadInfo);

  return displayThreads;
} 
