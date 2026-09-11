import type { ThreadPreselectionInfo } from '@/components/ultraFeed/ultraFeedTypes';

interface ThreadCandidate {
  score: number;
  thread: Array<{ commentId: string; lastViewed: Date | null; lastInteracted: Date | null }>;
}

/** Describes the exact exclusions used by normal selection as well as the Debug view. */
export function explainThreadPreselection(candidates: ThreadCandidate[], limit: number, servedIds: Set<string>): ThreadPreselectionInfo[] {
  let viableRank = 0;
  return candidates.map((candidate, index) => {
    const reasons: string[] = [];
    if (!Number.isFinite(candidate.score) || candidate.score <= 0) reasons.push('non-positive score');
    if (candidate.thread.every(comment => comment.lastViewed || comment.lastInteracted)) reasons.push('all comments seen');
    if (candidate.thread.every(comment => servedIds.has(comment.commentId))) reasons.push('already served in this session');
    if (reasons.length === 0 && ++viableRank > limit) reasons.push('candidate limit');
    return { score: candidate.score, rank: index + 1, candidateLimit: limit, selected: reasons.length === 0, reasons };
  });
}
