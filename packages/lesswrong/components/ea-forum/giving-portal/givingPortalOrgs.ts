import { useMulti } from "../../../lib/crud/withMulti";

export const useElectionCandidates = () => {
  return useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {},
  });
}

// TODO: Should this have separate logic to useElectionCandidates?
export const useDonationOpportunities = useElectionCandidates;
