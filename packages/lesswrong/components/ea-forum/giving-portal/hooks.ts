import { gql, useQuery } from "@apollo/client";
import { UseMultiOptions, useMulti } from "../../../lib/crud/withMulti";
import { eaGivingSeason23ElectionName, timelineSpec } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import moment from "moment";

export type ElectionAmountRaised = {
  raisedForElectionFund: number,
  electionFundTarget: number,
  totalRaised: number,
  totalTarget: number,
}

export type ElectionAmountRaisedQueryResult = {
  ElectionAmountRaised: ElectionAmountRaised;
}

export const useElectionCandidates = (
  sortBy: ElectionCandidatesSort = "mostPreVoted",
  options?: Partial<UseMultiOptions<"ElectionCandidateBasicInfo", "ElectionCandidates">>,
) => {
  return useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: eaGivingSeason23ElectionName,
      sortBy,
    },
    limit: 30,
    ...options,
  });
}

export const useDonationOpportunities = useElectionCandidates;

export const useAmountRaised = (electionName: string) => {
  const { data, loading, error } = useQuery<ElectionAmountRaisedQueryResult>(gql`
    query ElectionAmountRaised($electionName: String!) {
      ElectionAmountRaised(electionName: $electionName) {
        raisedForElectionFund
        electionFundTarget
        totalRaised
        totalTarget
      }
    }
  `, {
    variables: { electionName },
  });

  return {
    data: data?.ElectionAmountRaised ?? {
      raisedForElectionFund: 0,
      electionFundTarget: 0,
      totalRaised: 0,
      totalTarget: 0,
    },
    loading,
    error
  };
}

export const useIsGivingSeason = () => {
  const now = useCurrentTime();
  return isEAForum &&
    moment.utc(timelineSpec.start).isBefore(now) &&
    moment.utc(timelineSpec.end).isAfter(now);
}
