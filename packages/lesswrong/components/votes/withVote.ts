import { useState, useCallback } from 'react';
import { useMessages } from '../common/withMessages';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { performVoteClient } from '../../lib/voting/vote';
import { getCollection, getFragmentText } from '../../lib/vulcan-lib';
import * as _ from 'underscore';
import { randomId } from '../../lib/random';
import { forumTypeSetting } from '../../lib/instanceSettings';

const getVoteMutationQuery = (collection) => {
  return gql`
    mutation vote($documentId: String, $voteType: String, $collectionName: String, $voteId: String) {
      vote(documentId: $documentId, voteType: $voteType, collectionName: $collectionName, voteId: $voteId) {
        ... on ${collection.typeName} {
          ...WithVote${collection.typeName}
        }
      }
    }
    ${getFragmentText(`WithVote${collection.typeName}`)}
  `
}

export const useVote = <T extends VoteableTypeClient>(document: T, collectionName: CollectionNameString): {
  vote: (props: {document: T, voteType: string, collectionName: CollectionNameString, currentUser: UsersCurrent, voteId?: string})=>void,
  collectionName: CollectionNameString,
  document: T,
  baseScore: number,
  voteCount: number,
} => {
  const messages = useMessages();
  const [optimisticResponseDocument, setOptimisticResponseDocument] = useState<any>(null);
  const collection = getCollection(collectionName);
  const query = getVoteMutationQuery(collection);
  const [mutate] = useMutation(query, {
    onCompleted: useCallback(() => {
      setOptimisticResponseDocument(null)
    }, []),
  });
  
  const vote = useCallback(({document, voteType, collectionName, currentUser, voteId = randomId()}) => {
    const newDocument = performVoteClient({collection, document, user: currentUser, voteType, voteId});

    try {
      void mutate({
        variables: {
          documentId: document._id,
          voteType,
          collectionName: collection.options.collectionName,
          voteId,
        },
      })
      setOptimisticResponseDocument(newDocument);
    } catch(e) {
      const errorMessage = _.map(e.graphQLErrors, (gqlErr: any)=>gqlErr.message).join("; ");
      messages.flash({ messageString: errorMessage });
    }
  }, [messages, mutate, collection]);
  
  const af = forumTypeSetting.get() === 'AlignmentForum'
  const result = optimisticResponseDocument || document;
  return {
    vote, collectionName,
    document: result,
    baseScore: (af ? result.afBaseScore : result.baseScore) || 0,
    voteCount: (result.voteCount) || 0,
  };
}
