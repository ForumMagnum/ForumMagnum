import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { getFragment, getFragmentName } from 'meteor/vulcan:core';

export default function withModerateComment(options) {

  const fragment = options.fragment || getFragment(options.fragmentName),
        fragmentName = getFragmentName(fragment)

  return graphql(gql`
    mutation moderateComment($commentId: String, $deleted: Boolean, $deletedReason: String) {
      moderateComment(commentId: $commentId, deleted: $deleted, deletedReason: $deletedReason) {
        ...${fragmentName}
      }
    }
    ${fragment}
  `, {
    alias: 'withModerateComment',
    props: ({ ownProps, mutate }) => ({
      moderateCommentMutation: (args) => {
        const { commentId, deleted, deletedReason } = args;
        return mutate({
          variables: { commentId, deleted, deletedReason }
        });
      }
    }),
  });

}
