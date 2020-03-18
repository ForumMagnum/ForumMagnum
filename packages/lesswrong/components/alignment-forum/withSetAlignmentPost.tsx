import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { getFragment, getFragmentName } from '../../lib/vulcan-lib';

export default function withSetAlignmentPost(options) {

  const fragment = options.fragment || getFragment(options.fragmentName),
        fragmentName = getFragmentName(fragment)

  return graphql(gql`
    mutation alignmentPost($postId: String, $af: Boolean) {
      alignmentPost(postId: $postId, af: $af) {
        ...${fragmentName}
      }
    }
    ${fragment}
  `, {
    alias: 'withSetAlignmentPost',
    props: ({ ownProps, mutate }: { ownProps: any, mutate: any }): any => ({
      setAlignmentPostMutation: (args) => {
        const { postId, af } = args;
        return mutate({
          variables: { postId, af }
        });
      }
    }),
  });

}
