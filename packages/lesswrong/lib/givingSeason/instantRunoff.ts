import minBy from "lodash/minBy";
import { weightedRandomPick } from "../abTestImpl";
import { ACTIVE_DONATION_ELECTION, DONATION_ELECTION_NUM_WINNERS } from ".";


/**
 * Record of `{_id: ranking}`, from 1 (top preference) downwards
 */
export type IRVote = Record<string, number>
export type IRVoteCount = Record<string, number>
export type IRPossibleVoteCounts = Record<number, Record<string, number>>

function tallyVotes({votes, eliminatedCandidates}: {votes: IRVote[], eliminatedCandidates: Set<string>}) {
  const candidateScores: Record<string, number> = {};

  for (const vote of votes) {
    const prunedVote = Object.fromEntries(
      Object.entries(vote).filter(([candidate]) => !eliminatedCandidates.has(candidate))
    );

    const topCandidate = minBy(Object.entries(prunedVote), ([, ranking]) => ranking)?.[0]

    if (!topCandidate) continue;

    if (candidateScores[topCandidate]) {
      candidateScores[topCandidate] += 1;
    } else {
      candidateScores[topCandidate] = 1;
    }
  }

  // Note: Candidates with a score of 0 are not included
  return candidateScores;
}

export function instantRunoffResults({ votes, winners }: { votes: IRVote[]; winners: number; }): Record<string, number> {
  const eliminatedCandidates: Set<string> = new Set();

  let voteCount = tallyVotes({votes, eliminatedCandidates});

  while (Object.keys(voteCount).length > winners) {
    const minScore = Math.min(...Object.values(voteCount));

    const candidatesWithMinScore = Object.entries(voteCount)
      .filter(([, score]) => score === minScore)
      .map(([candidate]) => candidate);

    const candidateToEliminate =
      candidatesWithMinScore.length > 1
        ? weightedRandomPick(Object.fromEntries(candidatesWithMinScore.map((c) => [c, 1])), ACTIVE_DONATION_ELECTION)
        : candidatesWithMinScore[0];

    eliminatedCandidates.add(candidateToEliminate);

    voteCount = tallyVotes({votes, eliminatedCandidates});
  }

  return voteCount;
}

/**
 * On the frontend, clicking "show more" needs to display what the results would look like if fewer
 * candidates were eliminated. Here we calculate all these possibilities upfront, starting with
 * `ELECTION_WINNERS` (the actual number of winners) and going up to the point where no candidates are eliminated.
 *
 * @returns `results` with the format {[numWinners]: voteCounts, ...}, where `voteCounts` is itself an object
 * like `{id1: voteCount1, id2: voteCount2, ...}`
 */
export function instantRunoffAllPossibleResults(votes: IRVote[]) {
  const results: Record<number, Record<string, number>> = {};

  let winners = DONATION_ELECTION_NUM_WINNERS;
  let previousWinnersCount = 0;
  let currentWinnersCount = 0;

  while (currentWinnersCount !== previousWinnersCount || winners === DONATION_ELECTION_NUM_WINNERS) {
    const voteCounts = instantRunoffResults({ votes, winners });

    previousWinnersCount = currentWinnersCount;
    currentWinnersCount = Object.keys(voteCounts).length;

    if (previousWinnersCount !== currentWinnersCount) {
      results[winners] = voteCounts;
    }

    winners++;
  }

  return results;
}
