import { useState, useCallback, useRef } from 'react';
import { useDialog } from '../common/withDialog';
import { gql } from '@apollo/client';
import { setVoteClient } from '../../lib/voting/vote';
import { collectionNameToTypeName, getFragmentText } from '../../lib/vulcan-lib';
import { isAF } from '../../lib/instanceSettings';
import { VotingSystem, getDefaultVotingSystem } from '../../lib/voting/votingSystems';
import * as _ from 'underscore';
import { VotingProps } from './votingProps';
import { useMutate } from '../hooks/useMutate';

const getVoteMutationQuery = (typeName: string) => {
  const mutationName = `performVote${typeName}`;
  
  return gql`
    mutation ${mutationName}($documentId: String, $voteType: String, $extendedVote: JSON) {
      ${mutationName}(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
        document {
          ...WithVote${typeName}
        }
        showVotingPatternWarning
      }
    }
    ${getFragmentText(`WithVote${typeName}` as any)}
  `
}

export const useVote = <T extends VoteableTypeClient>(document: T, collectionName: VoteableCollectionName, votingSystem?: VotingSystem): VotingProps<T> => {
  const [optimisticResponseDocument, setOptimisticResponseDocument] = useState<any>(null);
  const mutationCounts = useRef({optimisticMutationIndex: 0, completedMutationIndex: 0});
  const typeName = collectionNameToTypeName(collectionName);
  const votingSystemOrDefault = votingSystem || getDefaultVotingSystem();
  const {openDialog} = useDialog();
  const {mutate} = useMutate();
  
  const showVotingPatternWarningPopup = useCallback(() => {
    openDialog({
      componentName: "VotingPatternsWarningPopup",
      componentProps: {},
      closeOnNavigate: true,
    });
  }, [openDialog]);
  
  const vote = useCallback(async ({document, voteType, extendedVote=null, currentUser}: {
    document: T,
    voteType: string,
    extendedVote?: any,
    currentUser: UsersCurrent,
  }) => {
    // Cast a vote. Because the vote buttons are easy to mash repeatedly (and
    // the strong-voting mechanic encourages this), there could be multiple
    // overlapping votes in-flight at once. We keep count of how many mutations
    // we've sent out and how many responses we've gotten back, so that the
    // result of an earlier vote does not overwrite the optimistic response of
    // a later vote.
    // FIXME: Currently the server is not guaranteed to process votes in the
    // same order they're received (if they're in separate http requests), which
    // means that if you double-click a vote button, you can get a weird result
    // due to votes being processed out of order.
    
    const newDocument = await setVoteClient({collectionName, document, user: currentUser, voteType, extendedVote, votingSystem: votingSystemOrDefault });

    mutationCounts.current.optimisticMutationIndex++;
    setOptimisticResponseDocument(newDocument);

    const { result, error } = await mutate({
      mutation: getVoteMutationQuery(typeName),
      variables: {
        documentId: document._id,
        voteType, extendedVote,
      },
      errorHandling: "flashMessageAndReturn"
    })
    if (error) {
      setOptimisticResponseDocument(null);
      return;
    }
    if (++mutationCounts.current.completedMutationIndex === mutationCounts.current.optimisticMutationIndex) {
      setOptimisticResponseDocument(null)
    }
    
    const mutationName = `performVote${typeName}`;
    if (result.data?.[mutationName]?.showVotingPatternWarning) {
      showVotingPatternWarningPopup();
    }
  }, [mutate, collectionName, typeName, votingSystemOrDefault, showVotingPatternWarningPopup]);

  const result = optimisticResponseDocument || document;
  return {
    vote, collectionName,
    document: result,
    baseScore: (isAF ? result.afBaseScore : result.baseScore) || 0,
    voteCount: (result.voteCount) || 0,
  };
}
