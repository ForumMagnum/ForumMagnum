/**
 * Helpers for UltraFeed thread prioritization and preparation.
 * 
 * Contains logic for:
 * - Scoring comments based on decay and user settings
 * - Building linear threads from comment data
 * - Selecting the best thread per top-level comment
 * - Preparing threads for display (expansion/highlighting)
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

import * as crypto from 'crypto';

  /**
   * Generates a stable hash ID for a comment thread based on its comment IDs (sensitive to sort order).
   * This MUST match the hash generation logic used in the resolver when checking against served threads.
   */
  export function generateThreadHash(commentIds: string[]): string {
    if (!commentIds || commentIds.length === 0) {
      // Return a consistent identifier for empty/invalid threads
      return 'empty_thread_hash';
    }

    const hash = crypto.createHash('sha256');
    hash.update(commentIds.join(','));
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
  primarySource: FeedItemSourceType | null;
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
  const hasBeenSeenOrInteracted = comment.lastViewed !== null || comment.lastInteracted !== null;
  const finalScore = boostedScore * (hasBeenSeenOrInteracted ? settings.commentSeenPenalty : 1.0);

  return Number.isFinite(finalScore) && finalScore >= 0 ? finalScore : 0;
}

/**
 * Calculates the aggregate score for a thread based on settings.
 */
function calculateThreadScore(
  thread: FinalScoredComment[],
  aggregation: UltraFeedSettingsType['threadScoreAggregation'],
  firstN: number
): number {
  if (!thread || thread.length === 0) {
    return 0;
  }

  // Select relevant comments (top N by score or all)
  let commentsToScore: FinalScoredComment[];
  if (firstN > 0 && thread.length > firstN) {
    // Sort by individual comment score descending and take top N
    commentsToScore = [...thread]
      .sort((a, b) => b.score - a.score)
      .slice(0, firstN);
  } else {
    commentsToScore = thread;
  }

  if (commentsToScore.length === 0) {
    return 0;
  }

  // Calculate score based on aggregation method
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
  scoredComments: IntermediateScoredComment[],
  settings: Pick<UltraFeedSettingsType, 'threadScoreAggregation' | 'threadScoreFirstN'>
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

  const allPossibleFinalThreads: FinalScoredComment[][] = [];
  const commentsById = new Map<string, IntermediateScoredComment>(scoredComments.map(c => [c.commentId, c])); 

  for (const [_topLevelId, groupComments] of Object.entries(groups)) {
    if (!groupComments || groupComments.length === 0) continue;

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
        allPossibleFinalThreads.push(finalScoredThread);
      }
    }
  }

  const scoredThreads: PrioritizedThread[] = allPossibleFinalThreads.map(thread => {
    const threadScore = calculateThreadScore(thread, settings.threadScoreAggregation, settings.threadScoreFirstN);
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
    primarySource
  };
}

/**
 * Builds comment threads for the UltraFeed using the current algorithm.
 * Fetches data, scores comments, builds threads, ranks threads, prepares for display.
 */
export async function getUltraFeedCommentThreads(
  context: ResolverContext,
  limit = 20,
  settings: UltraFeedSettingsType,
  servedThreadHashes: Set<string> = new Set()
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
  const threadScoringSettings = {
    threadScoreAggregation: settings.threadScoreAggregation,
    threadScoreFirstN: settings.threadScoreFirstN
  };
  const allScoredThreads = buildAndScoreThreads(scoredComments, threadScoringSettings); 

  // --- Step 4b: Select Best Threads --- 
  const finalRankedThreads = selectBestThreads(allScoredThreads); 

  // --- Step 5: Prepare for Display --- 
  // Filter out served threads
  const unservedRankedThreads = finalRankedThreads.filter(rankedThreadInfo => {
    const thread = rankedThreadInfo.thread;
    if (!thread || thread.length === 0) return false;
    const commentIds = thread.map(c => c.commentId);
    const threadHash = generateThreadHash(commentIds);
    return !servedThreadHashes.has(threadHash);
  });
  
  const displayThreads = unservedRankedThreads
    .slice(0, limit) 
    .map(rankedThreadInfo => prepareThreadForDisplay(rankedThreadInfo))
    .filter(rankedThreadInfo => !!rankedThreadInfo);

  return displayThreads;
} 
