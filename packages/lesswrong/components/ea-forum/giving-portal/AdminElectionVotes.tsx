import React, { useState } from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { useMulti } from "../../../lib/crud/withMulti";
import { useAmountRaised, useElectionCandidates } from "./hooks";
import sum from "lodash/sum";
import { eaGivingSeason23ElectionName } from "../../../lib/eaGivingSeason";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  numWinners: {
    display: "flex",
    gap: "16px",
  },
  table: {
    borderCollapse: "collapse",
    "& td, th": {
      padding: 8,
      textAlign: "left",
    },
  },
});

function approximatelyEqual(a: number, b: number, fractionalError = 1e-6) {
  return Math.abs(a - b) < Math.max(Math.abs(a), Math.abs(b)) * fractionalError;
}

const normalizeVotes = (
  votes: Record<string, number | null>[],
  remainingCandidates: ElectionCandidateBasicInfo[]
): Record<string, number>[] => {
  const uniformVote = remainingCandidates.reduce((acc, { _id }) => {
    acc[_id] = 1 / remainingCandidates.length;
    return acc;
  }, {} as Record<string, number>);

  const normalizedVotes = votes.map((vote) => {
    const totalValue = sum(Object.values(vote).filter((val) => val !== null)) ?? 0;

    // If all the candidates they voted for have been eliminated, give them a vote that
    // is uniform across all candidates
    if (!totalValue) return uniformVote;

    const normalizedVote = Object.entries(vote).reduce((acc, [candidate, val]) => {
      if (!val) return acc; // Filter out null or zero values

      acc[candidate] = val / totalValue;
      return acc;
    }, {} as Record<string, number>);

    return normalizedVote;
  });

  // Assert:
  // 1. The vote has been normalized to 1
  // 2. No votes have been added or removed
  if (normalizedVotes.length !== votes.length) {
    throw new Error("Votes have been added or removed");
  }

  for (const vote of normalizedVotes) {
    const totalValue = sum(Object.values(vote));

    if (!approximatelyEqual(totalValue, 1)) {
      throw new Error(`Vote has not been normalized to 1: ${JSON.stringify(vote)}`);
    }
  }

  return normalizedVotes;
};

const aggregateVotes = (votes: Record<string, number>[]): Record<string, number> => {
  const aggregatedVote = votes.reduce((acc, vote) => {
    for (const [candidate, val] of Object.entries(vote)) {
      acc[candidate] = (acc[candidate] ?? 0) + val;
    }
    return acc;
  }, {} as Record<string, number>);

  // Assert the sum of the aggregated vote is equal to the number of votes
  const totalValue = sum(Object.values(aggregatedVote));
  if (!approximatelyEqual(totalValue, votes.length)) {
    throw new Error(`Vote has not been aggregated correctly: ${JSON.stringify(aggregatedVote)}`);
  }

  return aggregatedVote;
};

const getSortedWinners = (
  votes: Record<string, number | null>[],
  candidates: ElectionCandidateBasicInfo[],
  numWinners: number
) => {
  let votesWithEliminatedCandidates = [...votes];
  let remainingCandidates = [...candidates];
  let calculatedVote = {} as Record<string, number>;
  let sortedVote = [] as [string, number][];
  let i = 0;

  do {
    const normalizedVotes = normalizeVotes(votesWithEliminatedCandidates, remainingCandidates);
    const aggregatedVote = aggregateVotes(normalizedVotes);
    calculatedVote = normalizeVotes([aggregatedVote], remainingCandidates)[0];

    sortedVote = Object.entries(calculatedVote).sort(([, voteAmountA], [, voteAmountB]) => voteAmountB - voteAmountA);
    const eliminatedCandidateId = sortedVote[sortedVote.length - 1][0];

    // Remove eliminated candidate from input votes
    votesWithEliminatedCandidates = votesWithEliminatedCandidates.map((vote) => {
      const { [eliminatedCandidateId]: _, ...rest } = vote;
      return rest;
    });
    remainingCandidates = remainingCandidates.filter(({ _id }) => _id !== eliminatedCandidateId);

    if (i++ > 1000) {
      throw new Error("Too many iterations");
    }
  } while (Object.keys(calculatedVote).length > numWinners);

  if (sortedVote.length !== numWinners) {
    throw new Error("Incorrect number of winners");
  }

  return sortedVote;
};

const AdminElectionVotes = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { Error404, SingleColumnSection } = Components;

  const currentUser = useCurrentUser();
  const { results, totalCount } = useMulti({
    terms: { view: "allSubmittedVotes", electionName: eaGivingSeason23ElectionName },
    collectionName: "ElectionVotes",
    fragmentName: "ElectionVoteInfo",
    enableTotal: true,
    limit: 1000,
    fetchPolicy: "network-only",
  });
  const { results: candidates } = useElectionCandidates("name");
  const { data: amountRaised } = useAmountRaised(eaGivingSeason23ElectionName);
  const [numWinners, setNumWinners] = useState<number>(3);

  if (!userIsAdmin(currentUser)) {
    return <Error404 />;
  }

  if (!results || !candidates || !amountRaised?.raisedForElectionFund) {
    return null;
  }

  if (results.length !== totalCount) {
    throw new Error("Total count does not match number of results");
  }

  const inputVotes = results.map(({ vote }) => vote) as Record<string, number | null>[];

  const sortedVote = getSortedWinners(inputVotes, candidates, numWinners);

  // Sort high to low and turn into rows
  const displayedVote = sortedVote.map(([_id, val]) => {
    const candidate = candidates.find(({ _id: candidateId }) => candidateId === _id);

    if (!candidate) {
      throw new Error("Candidate not found");
    }

    return [candidate, val] as [ElectionCandidateBasicInfo, number];
  });

  const { SectionTitle } = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <SectionTitle title="Donation Election 2023 results" />
      <div>Total votes: {totalCount}</div>
      <div className={classes.numWinners}>
        <div>Number of winners: {numWinners}</div>
        <button onClick={() => setNumWinners(Math.min(numWinners + 1, candidates.length))}>Increase</button>
        <button onClick={() => setNumWinners(Math.max(numWinners - 1, 1))}>Decrease</button>
      </div>
      <table className={classes.table}>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>% of fund</th>
            <th>Amount ($)</th>
          </tr>
        </thead>
        <tbody>
          {displayedVote.map(([candidate, val]) => (
            <tr key={candidate._id}>
              <td>
                <a href={candidate.gwwcLink ?? ""} target="_blank" rel="noopener noreferrer">
                  {candidate.name}
                </a>
              </td>
              <td>{(val * 100).toFixed(1)}</td>
              <td>{parseFloat((val * amountRaised.raisedForElectionFund).toFixed(2)).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SingleColumnSection>
  );
};

const AdminElectionVotesComponent = registerComponent("AdminElectionVotes", AdminElectionVotes, { styles });

declare global {
  interface ComponentTypes {
    AdminElectionVotes: typeof AdminElectionVotesComponent;
  }
}
