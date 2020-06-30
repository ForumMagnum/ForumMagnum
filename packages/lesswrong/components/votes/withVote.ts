import { useState, useCallback } from 'react';
import { useMessages } from '../common/withMessages';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { performVoteClient } from '../../lib/voting/vote';
import { getCollection, getFragmentText } from '../../lib/vulcan-lib';
import * as _ from 'underscore';
import { Random } from 'meteor/random';
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

export const useVote = (document: any, collectionName: CollectionNameString): {
  vote: any,
  collection: any,
  document: any,
  baseScore: number,
  voteCount: number,
}=> {
  const messages = useMessages();
  const [optimisticResponseDocument, setOptimisticResponseDocument] = useState<any>(null);
  const collection = getCollection(collectionName);
  const query = getVoteMutationQuery(collection);
  const [mutate] = useMutation(query, {
    onCompleted: useCallback(() => {
      setOptimisticResponseDocument(null)
    }, []),
  });
  
  const vote = useCallback(({document, voteType, collection, currentUser, voteId = Random.id()}) => {
    const newDocument = performVoteClient({collection, document, user: currentUser, voteType, voteId});

    try {
      mutate({
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
  }, [messages, mutate]);
  
  const af = forumTypeSetting.get() === 'AlignmentForum'
  const result = optimisticResponseDocument || document;
  return {
    vote, collection,
    document: result,
    baseScore: (af ? result.afBaseScore : result.baseScore) || 0,
    voteCount: (af ? result.afVoteCount : result.voteCount) || 0,
  };
}
