import { weightedRandomPick } from "../abTestImpl";

/**
 * Record of `{_id: ranking}`, from 1 (top preference) downwards
 */
export type IRVote = Record<string, number>
export type IRVoteCount = Record<string, number>
export type IRPossibleVoteCounts = Record<number, Record<string, number>>

export function countInstantRunoffVotes(possibleVoteCounts: IRPossibleVoteCounts) {
  const highestKey = Math.max(...Object.keys(possibleVoteCounts).map(Number));
  return (possibleVoteCounts[highestKey] && Object.values(possibleVoteCounts[highestKey]).reduce((a, b) => a + b, 0)) ?? 0;
}

/**
 * On the frontend, clicking "show more" needs to display what the results would look like if fewer
 * candidates were eliminated. Here we calculate all these possibilities upfront, eliminating
 * down to 1 winner and recording snapshots at each step.
 *
 * @param votes - Array of votes, each mapping candidate ID to ranking (1 = top preference)
 * @returns `results` with the format {[numWinners]: voteCounts, ...}, where `voteCounts` is itself an object
 * like `{id1: voteCount1, id2: voteCount2, ...}`
 */
export function instantRunoffAllPossibleResults(votes: IRVote[]) {
  const TIE_BREAK_SEED = "givingSeason";

  // For each vote, precompute sorted list of candidates by preference
  // (lowest ranking = highest preference) and track current position in that list
  const ballots: { prefs: string[]; pos: number }[] = [];
  for (const vote of votes) {
    const sorted = Object.entries(vote).sort((a, b) => a[1] - b[1]);
    ballots.push({ prefs: sorted.map(([c]) => c), pos: 0 });
  }

  const eliminated = new Set<string>();
  // candidate -> set of ballot indices that currently have this candidate as **top** choice
  const votersByCandidate = new Map<string, Set<number>>();
  // candidate -> current vote count
  const scores = new Map<string, number>();

  // Initial tally
  for (let i = 0; i < ballots.length; i++) {
    const top = ballots[i].prefs[0];
    if (top) {
      if (!votersByCandidate.has(top)) {
        votersByCandidate.set(top, new Set());
      }
      votersByCandidate.get(top)!.add(i);
      scores.set(top, (scores.get(top) ?? 0) + 1);
    }
  }

  // Record snapshots as we eliminate candidates, keyed by candidate count
  const results: Record<number, Record<string, number>> = {};
  results[scores.size] = Object.fromEntries(scores);

  // Eliminate until we reach 1 winner. In practice we have three winners, but snapshots are
  // stored at every elimination so we can select that from the returned object
  while (scores.size > 1) {
    const minScore = Math.min(...scores.values());

    // Find candidates with minimum score and sort for deterministic tie-breaking
    const candidatesWithMinScore: string[] = [];
    for (const [candidate, score] of scores) {
      if (score === minScore) candidatesWithMinScore.push(candidate);
    }
    candidatesWithMinScore.sort();

    // Pick one to eliminate (deterministically via seeded random if tie)
    const toEliminate =
      candidatesWithMinScore.length > 1
        ? weightedRandomPick(
            Object.fromEntries(candidatesWithMinScore.map((c) => [c, 1])),
            TIE_BREAK_SEED
          )
        : candidatesWithMinScore[0];

    // Get voters who had this candidate as top choice
    const affectedVoters = votersByCandidate.get(toEliminate) ?? new Set();

    // Mark as eliminated and remove from tracking
    eliminated.add(toEliminate);
    scores.delete(toEliminate);
    votersByCandidate.delete(toEliminate);

    // Redistribute affected votes to their next valid preference
    for (const ballotIdx of affectedVoters) {
      const ballot = ballots[ballotIdx];
      // Advance position past eliminated candidates
      ballot.pos++;
      while (ballot.pos < ballot.prefs.length && eliminated.has(ballot.prefs[ballot.pos])) {
        ballot.pos++;
      }
      const newTop = ballot.prefs[ballot.pos];
      if (newTop) {
        // Transfer vote to new top choice
        if (!votersByCandidate.has(newTop)) {
          votersByCandidate.set(newTop, new Set());
        }
        votersByCandidate.get(newTop)!.add(ballotIdx);
        scores.set(newTop, (scores.get(newTop) ?? 0) + 1);
      }
    }

    // Record snapshot at this number of winners
    if (!(scores.size in results)) {
      results[scores.size] = Object.fromEntries(scores);
    }
  }

  return results;
}
