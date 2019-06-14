import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

export const withDismissRecommendation = component => {
  return graphql(gql`
    mutation dismissRecommendation($postId: String) {
      dismissRecommendation(postId: $postId)
    }
  `, {
    props: ({ownProps, mutate}) => ({
      dismissRecommendation: async ({postId}) => {
        await mutate({
          variables: {
            postId: postId
          },
        });
      }
    })
  })(component);
}
