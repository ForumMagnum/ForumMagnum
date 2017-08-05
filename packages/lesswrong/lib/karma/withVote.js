import React, { PropTypes, Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { operateOnItem } from './vote.js';
import { GraphQLSchema, Utils } from 'meteor/vulcan:core';

const logging = true;
const log = logging ? console.log : () => null;

GraphQLSchema.addMutation('vote(documentId: String, userId: String, voteType: String, weight: Int) : Vote');

const NEW_VOTE_MUTATION = gql`
  mutation newVote($documentId: String, $documentType: String, $userId: String, $voteType: String, $weight: Int) {
    newVote(documentId: $documentId, documentType: $documentType, userId: $userId, voteType: $voteType, weight: $weight) {
      _id
      votedAt
      userId
      documentId
      documentType
      voteType
      weight
    }
  }
`;

const withNewVote  = graphql(NEW_VOTE_MUTATION, {
  props: ({ownProps, mutate}) => ({
    newVote: ({documentId, documentType, userId, voteType, weight}) => {
      log("newVote", {documentId, documentType, userId, voteType, weight});
      return mutate({
        variables: {
          documentId,
          documentType,
          userId,
          voteType,
          weight
        },
        optimisticResponse: {
          __typename: 'Mutation',
          newVote: {
            __typename: 'Vote',
            votedAt: new Date(),
            documentId,
            documentType,
            userId,
            voteType,
            weight
          },
        },
        update: (store, { data: { newVote } }) => {
          // log("update store", "second", second);
          votesQuery = gql`
          query votesListQuery {
            votesList(terms: {view: "votesForDocument", documentId: $documentId, limit:10, itemsPerPage:10}) {
              _id
              votedAt
              userId
              documentId
              documentType
              voteType
              weight
            }
          }`;

          const data = store.readQuery({
            query: votesQuery,
            variables: {
              documentId: newVote.documentId
            }
          });

          // Add our vote to end.
          log("vote", newVote);
          data.votesList.push(newVote);
          log("voteList before write", data);
          // Write our data back to the cache.
          store.writeQuery({
            query: votesQuery,
            data
          });
          log("query written");
        },
      })
    }
  }),
});;

const UPDATE_VOTE_MUTATION = gql`
  mutation updateVote($id: String, $documentId: String, $documentType: String, $userId: String, $voteType: String, $weight: Int) {
    updateVote(id: $id, documentId: $documentId, documentType: $documentType, userId: $userId, voteType: $voteType, weight: $weight) {
      _id
      votedAt
      userId
      documentId
      documentType
      voteType
      weight
    }
  }
`;

const withUpdateVote = graphql(UPDATE_VOTE_MUTATION, {
  props: ({ownProps, mutate}) => ({
    updateVote: ({id, documentId, documentType, userId, voteType, weight}) => {
      log("updateVote", {id, documentId, documentType, userId, voteType, weight});

      return mutate({
        variables: {
          id,
          documentId,
          documentType,
          userId,
          voteType,
          weight
        },
        optimisticResponse: {
          __typename: 'Mutation',
          updateVote: {
            __typename: 'Vote',
            documentId,
            documentType,
            userId,
            voteType,
            weight
          },
        }
      })
    }
  }),
});

const withVote = component => {
  return withUpdateVote(withNewVote(component));
};

export default withVote;
