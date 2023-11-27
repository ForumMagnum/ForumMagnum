import { useCallback } from "react";
import { useMulti } from "../../../lib/crud/withMulti";
import { useUpdate } from "../../../lib/crud/withUpdate";
import { useCurrentUser } from "../../common/withUser";

export const useElectionVote = (electionName: string) => {
  const currentUser = useCurrentUser();

  const { results, loading, error, refetch } = useMulti({
    terms: {
      userId: currentUser?._id,
      electionName,
    },
    collectionName: "ElectionVotes",
    fragmentName: "ElectionVoteInfo",
    limit: 1,
    skip: !currentUser,
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
