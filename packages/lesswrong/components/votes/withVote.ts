import React from 'react';
import { useMessages } from '../common/withMessages';
import { useMutation } from 'react-apollo';
import gql from 'graphql-tag';
import { performVoteClient } from '../../lib/voting/vote';
import { VoteableCollections } from '../../lib/make_voteable';
import { getFragmentText } from '../../lib/vulcan-lib';
import * as _ from 'underscore';
import { Random } from 'meteor/random';

const getVoteMutationQuery = () => {
  return gql`
    mutation vote($documentId: String, $voteType: String, $collectionName: String, $voteId: String) {
      vote(documentId: $documentId, voteType: $voteType, collectionName: $collectionName, voteId: $voteId) {
        ${VoteableCollections.map(collection => `
          ... on ${collection.typeName} {
            ...WithVote${collection.typeName}
          }
        `).join('\n')}
      }
    }
    ${VoteableCollections.map(collection => `
      ${getFragmentText(`WithVote${collection.typeName}`)}
    `).join("\n")}
  `
}

export const useVote = () => {
  const messages = useMessages();
  const query = getVoteMutationQuery();
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
      const errorMessage = _.map(e.graphQLErrors, gqlErr=>gqlErr.message).join("; ");
      messages.flash({ messageString: errorMessage });
    }
  }, [messages, mutate]);
  return vote;
}
