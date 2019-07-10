import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { getFragment } from 'meteor/vulcan:core';

export const withPostsByTimeframe = component => {
  // TODO; will we fix this? FIXME: For some unclear reason, using a ...fragment in the 'sequence' part
  // of this query doesn't work (leads to a 400 Bad Request), so this is expanded
  // out to a short list of individual fields.

  const withPostsByTimeframe = gql`
    query PostsByTimeframeQuery {
      PostsByTimeframe {
        lastReadPost {
          ...PostsList
        }
        nextPost {
          ...PostsList
        }
        numRead
        numTotal
        lastReadTime
      }
    }
    ${getFragment("PostsList")}
  `;

  return graphql(withPostsByTimeframe,
    {
      alias: "withPostsByTimeframe",
      options: (props) => ({
        variables: {}
      }),
      props(props) {
        return {
          postsByTimeframeLoading: props.data.loading,
          postsByTimeframe: props.data.PostsByTimeframe,
        }
      }
    }
  )(component);
}
