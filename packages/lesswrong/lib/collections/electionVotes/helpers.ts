/**
 * Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
 * the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
 * valuable as the second candidate (and vice versa if AtoB is false).
 */
export type CompareState = Record<string, {multiplier: number | string, AtoB: boolean}>;

export const getCompareKey = (candidate1: ElectionCandidateBasicInfo, candidate2: ElectionCandidateBasicInfo) => {
  return `${candidate1._id}-${candidate2._id}`;
}

export const getInitialCompareState = (candidatePairs: ElectionCandidateBasicInfo[][]): CompareState => {
  return Object.fromEntries(
    candidatePairs.map(([candidate, otherCandidate]) => {
      const key = getCompareKey(candidate, otherCandidate);
      return [key, {multiplier: 1, AtoB: true}];
    })
  );
}

// TODO
export const convertCompareStateToVote = (compareState: CompareState): Record<string, number | null> => {
  return {}
}
