import minBy from "lodash/minBy";
import { weightedRandomPick } from "../abTestImpl";


/**
 * Record of `{_id: ranking}`, from 1 (top preference) downwards
 */
export type IRVote = Record<string, number>

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

export function instantRunoffResults(votes: IRVote[], winners: number): Record<string, number> {
  const eliminatedCandidates: Set<string> = new Set();

  let voteCount = tallyVotes({votes, eliminatedCandidates});

  while (Object.keys(voteCount).length > winners) {
    const minScore = Math.min(...Object.values(voteCount));

    const candidatesWithMinScore = Object.entries(voteCount)
      .filter(([, score]) => score === minScore)
      .map(([candidate]) => candidate);

    const candidateToEliminate =
      candidatesWithMinScore.length > 1
        ? weightedRandomPick(Object.fromEntries(candidatesWithMinScore.map((c) => [c, 1])), "givingSeason24") // TODO make "givingSeason24" a constant elsewhere
        : candidatesWithMinScore[0];

    eliminatedCandidates.add(candidateToEliminate);

    voteCount = tallyVotes({votes, eliminatedCandidates});
  }

  return voteCount;
}
