import React, { useState, useCallback, useRef } from 'react';
import { useMessages } from '../common/withMessages';
import { useDialog } from '../common/withDialog';
import { useMutation, DocumentNode } from '@apollo/client';
import { setVoteClient } from '../../lib/voting/vote';
import { isAF } from '../../lib/instanceSettings';
import { getDefaultVotingSystem } from '@/lib/voting/getVotingSystem';
import type { VotingSystem } from '@/lib/voting/votingSystems';
import * as _ from 'underscore';
import { VotingProps } from './votingProps';
import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames';
import VotingPatternsWarningPopup from "./VotingPatternsWarningPopup";
import { gql } from '@/lib/generated/gql-codegen';

const performVoteCommentMutation = gql(`
  mutation performVoteComment($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteComment(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteComment
      }
      showVotingPatternWarning
    }
  }
`)

const performVotePostMutation = gql(`
  mutation performVotePost($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVotePost(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVotePost
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteTagRelMutation = gql(`
  mutation performVoteTagRel($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteTagRel(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteTagRel
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteRevisionMutation = gql(`
  mutation performVoteRevision($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteRevision(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteRevision
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteElectionCandidateMutation = gql(`
  mutation performVoteElectionCandidate($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteElectionCandidate(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteElectionCandidate
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteTagMutation = gql(`
  mutation performVoteTag($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteTag(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteTag
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteMultiDocumentMutation = gql(`
  mutation performVoteMultiDocument($documentId: String, $voteType: String, $extendedVote: JSON) {
    performVoteMultiDocument(documentId: $documentId, voteType: $voteType, extendedVote: $extendedVote) {
      document {
        ...WithVoteMultiDocument
      }
      showVotingPatternWarning
    }
  }
`)

const performVoteMutations = {
  Comment: performVoteCommentMutation,
  Post: performVotePostMutation,
  TagRel: performVoteTagRelMutation,
  Revision: performVoteRevisionMutation,
  ElectionCandidate: performVoteElectionCandidateMutation,
  Tag: performVoteTagMutation,
  MultiDocument: performVoteMultiDocumentMutation,
} satisfies Record<typeof collectionNameToTypeName[VoteableCollectionName], DocumentNode>;

export const useVote = <T extends VoteableTypeClient>(document: T, collectionName: VoteableCollectionName, votingSystem?: VotingSystem): VotingProps<T> => {
  const messages = useMessages();
  const [optimisticResponseDocument, setOptimisticResponseDocument] = useState<any>(null);
  const mutationCounts = useRef({optimisticMutationIndex: 0, completedMutationIndex: 0});
  const typeName = collectionNameToTypeName[collectionName];
  const query = performVoteMutations[typeName];
  const votingSystemOrDefault = votingSystem || getDefaultVotingSystem();
  const {openDialog} = useDialog();
  
  const showVotingPatternWarningPopup= useCallback(() => {
    openDialog({
      name: "VotingPatternsWarningPopup",
      contents: ({onClose}) => <VotingPatternsWarningPopup onClose={onClose}/>,
      closeOnNavigate: true,
    });
  }, [openDialog]);
  
  const [mutate] = useMutation(query, {
    onCompleted: useCallback((mutationResult: AnyBecauseHard) => {
      if (++mutationCounts.current.completedMutationIndex === mutationCounts.current.optimisticMutationIndex) {
        setOptimisticResponseDocument(null)
      }
      
      const mutationName = `performVote${typeName}`;
      if (mutationResult?.[mutationName]?.showVotingPatternWarning) {
        showVotingPatternWarningPopup();
      }
    }, [typeName, showVotingPatternWarningPopup]),
  });
  
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

    try {
      mutationCounts.current.optimisticMutationIndex++;
      setOptimisticResponseDocument(newDocument);
      await mutate({
        variables: {
          documentId: document._id,
          voteType, extendedVote,
        },
      })
    } catch(e) {
      const errorMessage = _.map(e.graphQLErrors, (gqlErr: any)=>gqlErr.message).join("; ");
      messages.flash({ messageString: errorMessage });
      setOptimisticResponseDocument(null);
    }
  }, [messages, mutate, collectionName, votingSystemOrDefault]);

  const result = optimisticResponseDocument || document;
  return {
    vote, collectionName,
    document: result,
    baseScore: (isAF ? result.afBaseScore : result.baseScore) || 0,
    voteCount: (result.voteCount) || 0,
  };
}
