import React from 'react';
import { useMessages } from '../common/withMessages';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { performVoteClient } from '../../lib/voting/vote';
import { VoteableCollections } from '../../lib/make_voteable';
import { getCollection, getFragmentText } from '../../lib/vulcan-lib';
import * as _ from 'underscore';
import { Random } from 'meteor/random';

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

export const useVote = (collectionName: CollectionNameString) => {
  const messages = useMessages();
  const collection = getCollection(collectionName);
  const query = getVoteMutationQuery(collection);
  const [mutate] = useMutation(query);
  
  const vote = React.useCallback(({document, voteType, collection, currentUser, voteId = Random.id()}) => {
    const newDocument = performVoteClient({collection, document, user: currentUser, voteType, voteId});

    try {
      mutate({
        variables: {
          documentId: document._id,
          voteType,
          collectionName: collection.options.collectionName,
          voteId,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          vote: newDocument,
        }
      })
    } catch(e) {
      const errorMessage = _.map(e.graphQLErrors, (gqlErr: any)=>gqlErr.message).join("; ");
      messages.flash({ messageString: errorMessage });
    }
  }, [messages, mutate]);
  
  return vote;
}
