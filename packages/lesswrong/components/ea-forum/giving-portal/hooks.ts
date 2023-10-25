import { useMulti } from "../../../lib/crud/withMulti";

const givingSeason23ElectionName = "givingSeason23";

export const useElectionCandidates = (
  sortBy: ElectionCandidatesSort = "mostPreVoted",
) => {
  return useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: givingSeason23ElectionName,
      sortBy,
    },
  });
}

// TODO: Should this have separate logic to useElectionCandidates?
export const useDonationOpportunities = useElectionCandidates;
