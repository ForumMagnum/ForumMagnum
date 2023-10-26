import { useMulti } from "../../../lib/crud/withMulti";
import { eaGivingSeason23ElectionName } from "../../../lib/eaGivingSeason";

export const useElectionCandidates = () => {
  return useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: eaGivingSeason23ElectionName,
    },
  });
}

// TODO: Should this have separate logic to useElectionCandidates?
export const useDonationOpportunities = useElectionCandidates;

export const useAmountRaised = () => {
  // TODO: Query for the actual amount
  return {
    raisedForElectionFund: 3720,
    donationTarget: 15000,
    totalRaised: 10250,
  };
}
