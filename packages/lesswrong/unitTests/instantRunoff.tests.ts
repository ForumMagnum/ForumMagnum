import minBy from 'lodash/minBy';
import { weightedRandomPick } from "@/lib/abTestImpl";
import { instantRunoffAllPossibleResults, IRVote } from "@/lib/givingSeason/instantRunoff";

// Same fixed seed as used in the main implementation
const TIE_BREAK_SEED = "givingSeason";

/**
 * Reference implementation of IRV (original O(n^2) algorithm).
 */
function tallyVotesReference({ votes, eliminatedCandidates }: { votes: IRVote[], eliminatedCandidates: Set<string> }) {
  const candidateScores: Record<string, number> = {};
  for (const vote of votes) {
    const prunedVote = Object.fromEntries(
      Object.entries(vote).filter(([candidate]) => !eliminatedCandidates.has(candidate))
    );
    const topCandidate = minBy(Object.entries(prunedVote), ([, ranking]) => ranking)?.[0];
    if (!topCandidate) continue;
    candidateScores[topCandidate] = (candidateScores[topCandidate] ?? 0) + 1;
  }
  return candidateScores;
}

function instantRunoffResultsReference({ votes, winners }: { votes: IRVote[]; winners: number }): Record<string, number> {
  const eliminatedCandidates: Set<string> = new Set();
  let voteCount = tallyVotesReference({ votes, eliminatedCandidates });

  while (Object.keys(voteCount).length > winners) {
    const minScore = Math.min(...Object.values(voteCount));
    const candidatesWithMinScore = Object.entries(voteCount)
      .filter(([, score]) => score === minScore)
      .map(([candidate]) => candidate)
      .sort(); // Sort for deterministic tie-breaking

    const candidateToEliminate =
      candidatesWithMinScore.length > 1
        ? weightedRandomPick(Object.fromEntries(candidatesWithMinScore.map((c) => [c, 1])), TIE_BREAK_SEED)
        : candidatesWithMinScore[0];

    eliminatedCandidates.add(candidateToEliminate);
    voteCount = tallyVotesReference({ votes, eliminatedCandidates });
  }
  return voteCount;
}

describe('instantRunoffAllPossibleResults', () => {
  it('should return the correct winner when there is a clear majority', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2, 'C': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'B': 1, 'A': 2, 'C': 3 },
      { 'A': 1, 'B': 2, 'C': 3 }
    ];

    // Expected results after each elimination round:
    // Initial: {'A': 3, 'B': 1, 'C': 0}. C has no first-preference votes so not in initial tally
    // After eliminating B: {'A': 4}

    const results = instantRunoffAllPossibleResults(votes);
    expect(results[1]).toEqual({ 'A': 4 });
  });

  it('should handle tie-breaking in a stable manner', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2 },
      { 'B': 1, 'A': 2 },
      { 'C': 1, 'A': 2 }
    ];

    // Initial: {'A': 1, 'B': 1, 'C': 1} - three-way tie
    // With hardcoded seed "givingSeason" and sorted candidates, 'B' is eliminated first,
    // then 'C', leaving 'A' with all 3 votes

    const results = instantRunoffAllPossibleResults(votes);
    expect(results[1]).toEqual({ 'A': 3 });
  });

  it('should return multiple winners at different elimination levels', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2, 'C': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'A': 1, 'C': 2, 'B': 3 },
      { 'B': 1, 'A': 2, 'C': 3 },
      { 'B': 1, 'A': 3, 'C': 2 },
      { 'C': 1, 'A': 2, 'B': 3 },
    ];

    // Initial: {'A': 3, 'B': 2, 'C': 1}
    // After eliminating C: {'A': 4, 'B': 2}
    // After eliminating B: {'A': 6}

    const results = instantRunoffAllPossibleResults(votes);
    expect(results[3]).toEqual({ 'A': 3, 'B': 2, 'C': 1 });
    expect(results[2]).toEqual({ 'A': 4, 'B': 2 });
    expect(results[1]).toEqual({ 'A': 6 });
  });

  it('should handle no votes', () => {
    const votes: IRVote[] = [];
    const results = instantRunoffAllPossibleResults(votes);
    expect(results).toEqual({ 0: {} });
  });

  it('should handle empty votes', () => {
    const votes: IRVote[] = [
      {},
      { 'A': 1, 'B': 2 },
      {},
      { 'B': 1, 'A': 2 }
    ];
    const results = instantRunoffAllPossibleResults(votes);
    expect(results[2]).toEqual({ 'A': 1, 'B': 1 });
  });

  it('should record snapshots at each elimination step', () => {
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2, 'C': 3, 'D': 4 },
      { 'B': 1, 'A': 2, 'C': 3, 'D': 4 },
      { 'C': 1, 'A': 2, 'B': 3, 'D': 4 },
      { 'D': 1, 'A': 2, 'B': 3, 'C': 4 },
    ];

    const results = instantRunoffAllPossibleResults(votes);
    
    // Should have snapshots for 4, 3, 2, and 1 winners
    expect(Object.keys(results).map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    expect(Object.keys(results[4]).length).toBe(4);
    expect(Object.keys(results[1]).length).toBe(1);
  });

  it('should produce identical results to reference implementation', () => {
    // Complex test data with ties and vote transfers
    const votes: IRVote[] = [
      { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 },
      { 'A': 1, 'C': 2, 'B': 3, 'E': 4, 'D': 5 },
      { 'B': 1, 'A': 2, 'C': 3, 'D': 4, 'E': 5 },
      { 'B': 1, 'D': 2, 'A': 3, 'C': 4, 'E': 5 },
      { 'C': 1, 'A': 2, 'B': 3, 'D': 4, 'E': 5 },
      { 'D': 1, 'E': 2, 'A': 3, 'B': 4, 'C': 5 },
      { 'E': 1, 'D': 2, 'C': 3, 'B': 4, 'A': 5 },
      { 'A': 1, 'E': 2, 'D': 3, 'C': 4, 'B': 5 },
      { 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'A': 5 },
      { 'C': 1, 'B': 2, 'A': 3, 'D': 4, 'E': 5 },
    ];

    const optimizedResults = instantRunoffAllPossibleResults(votes);

    // Compare with reference implementation at each winner count
    for (const numWinners of Object.keys(optimizedResults).map(Number)) {
      if (numWinners === 0) continue;
      
      const ref = instantRunoffResultsReference({ votes, winners: numWinners });
      const opt = optimizedResults[numWinners];

      // Same candidates
      expect(Object.keys(opt).sort()).toEqual(Object.keys(ref).sort());

      // Same scores
      for (const candidate of Object.keys(ref)) {
        expect(opt[candidate]).toBe(ref[candidate]);
      }
    }
  });
});
