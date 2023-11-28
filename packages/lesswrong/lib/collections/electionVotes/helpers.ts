/**
 * Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
 * the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
 * valuable as the second candidate (and vice versa if AtoB is false).
 *
 * CompareStateUI allows strings because this is needed to allow intermediate values like "0." as the user is typing.
 */
export type CompareStateUI = Record<string, {multiplier: number | string, AtoB: boolean}>;
/**
 * Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
 * the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
 * valuable as the second candidate (and vice versa if AtoB is false).
 */
export type CompareState = Record<string, {multiplier: number, AtoB: boolean}>;

export const getCompareKey = (candidate1: ElectionCandidateBasicInfo, candidate2: ElectionCandidateBasicInfo) => {
  return `${candidate1._id}-${candidate2._id}`;
}

export const getInitialCompareState = (candidatePairs: ElectionCandidateBasicInfo[][]): CompareStateUI => {
  return Object.fromEntries(
    candidatePairs.map(([candidate, otherCandidate]) => {
      const key = getCompareKey(candidate, otherCandidate);
      return [key, {multiplier: 1, AtoB: true}];
    })
  );
}

export const convertCompareStateToVote = (compareState: CompareState): Record<string, number> => {
  const pairs = Object.keys(compareState).map(key => {
    const [candidate1Id, candidate2Id] = key.split("-");
    const {multiplier, AtoB} = compareState[key];
    const secondTimesFirstMultiplier = AtoB ? 1 / multiplier : multiplier;
    return [candidate1Id, candidate2Id, secondTimesFirstMultiplier];
  }) as [string, string, number][];

  console.log("pairs", pairs);

  // Process them in an order like [[A, B, x], [B, C, y], [C, D, z]], and throw an error if this ordering isn't possible
  // A (the head id) appears only once, and in the first position. D (the tail id) appears only once, and in the last position.
  const headIds = pairs.map(([headId]) => headId)
  const tailIds = pairs.map(([, tailId]) => tailId)
  const allExpectedIds = new Set([...headIds, ...tailIds]);

  const headId = headIds.find(id => !tailIds.includes(id));
  const tailId = tailIds.find(id => !headIds.includes(id));

  if (!headId || !tailId) {
    throw new Error("No unique head and tail ids found");
  }

  const vote = {
    [headId]: 1,
  };

  let currentId = headId;
  while (currentId !== tailId) {
    // Find the pair based on the id of the first element
    const pair = pairs.find(([id]) => id === currentId);
    if (!pair) {
      throw new Error("No next pair found");
    }
    // Note: firstId == currentId here
    const [firstId, secondId, secondTimesFirstMultiplier] = pair;

    if (vote[secondId]) {
      throw new Error("Second id already found");
    }

    const firstValue = vote[firstId];
    const secondValue = firstValue * secondTimesFirstMultiplier;
    vote[secondId] = secondValue;
    currentId = secondId;
  }

  console.log("vote", vote);

  // Assert all the ids are present
  const voteIds = Object.keys(vote);
  if (voteIds.length !== allExpectedIds.size || !voteIds.every(id => allExpectedIds.has(id))) {
    throw new Error("Vote ids don't match expected ids");
  }

  // Normalize (to a total of 100_000) and round
  const total = Object.values(vote).reduce((sum, value) => sum + value, 0);
  const normalizedVote = Object.fromEntries(
    Object.entries(vote).map(([id, value]) => [id, Math.round((value / total) * 100_000)])
  );

  return normalizedVote;
}
