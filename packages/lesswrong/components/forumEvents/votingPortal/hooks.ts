import { useCallback } from "react";
import { UseMultiOptions, useMulti } from "../../../lib/crud/withMulti";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { useCurrentUser } from "../../common/withUser";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import { CLIENT_ID_COOKIE } from "@/lib/cookies/cookies";
import seedrandom from "@/lib/seedrandom";
import { ACTIVE_DONATION_ELECTION } from "@/lib/givingSeason";

// TODO: Check this date - last year it was the time that the election was announced
const votingAccountCreationCutoff = new Date("2024-10-23T19:00:00Z");

const userCanVoteInDonationElection = (
  user: UsersCurrent | DbUser | null,
) =>
  !!user && new Date(user.createdAt).getTime() < votingAccountCreationCutoff.getTime()

type NullablePartial<T> = { [K in keyof T]?: T[K]|null|undefined }

export const useElectionVote = (
  electionName = ACTIVE_DONATION_ELECTION,
) => {
  const currentUser = useCurrentUser();

  const { results, loading, error, refetch } = useMulti({
    terms: {
      userId: currentUser?._id,
      electionName,
    },
    collectionName: "ElectionVotes",
    fragmentName: "ElectionVoteInfo",
    limit: 1,
    skip: !currentUser || !userCanVoteInDonationElection(currentUser),
    createIfMissing: {
      electionName,
      userId: currentUser?._id,
      vote: {}
    },
  });
  const voteDocument = results?.[0];

  const {mutate: updateVoteDb} = useUpdate({
    collectionName: "ElectionVotes",
    fragmentName: 'ElectionVoteInfo',
  });

  const updateVote = useCallback(async (data: NullablePartial<DbElectionVote>) => {
    if (!voteDocument) {
      return;
    }

    await updateVoteDb({
      selector: {
        _id: voteDocument._id,
      },
      data,
    });

    refetch();
  }, [voteDocument, refetch, updateVoteDb]);

  return {
    electionVote: voteDocument,
    updateVote,
    loading,
    error,
  };
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
      electionName: ACTIVE_DONATION_ELECTION,
      sortBy: sortBy === "random" ? "name" : sortBy,
    },
    limit: 30,
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
