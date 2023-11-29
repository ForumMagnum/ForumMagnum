import { gql, useQuery } from "@apollo/client";
import { UseMultiOptions, useMulti } from "../../../lib/crud/withMulti";
import { eaGivingSeason23ElectionName, timelineSpec } from "../../../lib/eaGivingSeason";
import { isEAForum } from "../../../lib/instanceSettings";
import { useCurrentTime } from "../../../lib/utils/timeUtil";
import moment from "moment";
import { useCurrentUser } from "../../common/withUser";
import { useCookiesWithConsent } from "../../hooks/useCookiesWithConsent";
import { CLIENT_ID_COOKIE } from "../../../lib/cookies/cookies";
import { stableSeedrandom } from "../../../lib/stableSeedrandom";

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
  sortBy: ElectionCandidatesSort | "random" = "mostPreVoted",
  options?: Partial<UseMultiOptions<"ElectionCandidateBasicInfo", "ElectionCandidates">>,
) => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  const clientId = cookies[CLIENT_ID_COOKIE];

  const {results, ...retVal} = useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: eaGivingSeason23ElectionName,
      sortBy: sortBy === "random" ? "name" : sortBy,
    },
    limit: 30,
    ...options,
  });

  let resultsCopy = results ? [...results] : undefined;
  if (sortBy === "random") {
    const randomSeed = currentUser?.abTestKey ?? clientId ?? "default";
    const rng = stableSeedrandom(randomSeed);
    resultsCopy?.sort(() => rng.next() - 0.5);
  }

  return {
    results: resultsCopy,
    ...retVal,
  };
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
