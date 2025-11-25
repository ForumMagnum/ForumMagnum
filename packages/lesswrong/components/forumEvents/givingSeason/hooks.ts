import { UseMultiOptions, useMulti } from "../../../lib/crud/withMulti";
import { useCurrentUser } from "../../common/withUser";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { CLIENT_ID_COOKIE } from "@/lib/cookies/cookies";
import seedrandom from "@/lib/seedrandom";
import { ACTIVE_DONATION_ELECTION } from "@/lib/givingSeason";

export const useElectionCandidates = ({
  sortBy = "mostPreVoted",
  options,
}: {
  sortBy?: ElectionCandidatesSort | "random";
  options?: Partial<UseMultiOptions<"ElectionCandidateBasicInfo", "ElectionCandidates">>;
} = {}) => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  const clientId = cookies[CLIENT_ID_COOKIE];

  const {results, ...retVal} = useMulti({
    collectionName: "ElectionCandidates",
    fragmentName: "ElectionCandidateBasicInfo",
    terms: {
      electionName: ACTIVE_DONATION_ELECTION,
      sortBy: sortBy === "random" ? "name" : sortBy,
    },
    limit: 100,
    // There is an SSR mismatch bug that occurs on safari when using the random sort
    ssr: false,
    ...options,
  });

  let resultsCopy = results ? [...results] : undefined;
  if (sortBy === "random") {
    const rng = seedrandom(currentUser?.abTestKey ?? clientId);
    resultsCopy?.sort(() => rng() - 0.5);
  }

  return {
    results: resultsCopy,
    ...retVal,
  };
}
