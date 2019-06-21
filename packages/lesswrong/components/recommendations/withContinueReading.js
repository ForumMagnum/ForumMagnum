import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { getFragment } from 'meteor/vulcan:core';

export const withContinueReading = component => {
  // FIXME: For some unclear reason, using a ...fragment in the 'sequence' part
  // of this query doesn't work (leads to a 400 Bad Request), so this is expanded
  // out to a short list of individual fields.
  const continueReadingQuery = gql`
    query ContinueReadingQuery {
      ContinueReading {
        sequence {
          _id
          title
          gridImageId
          canonicalCollectionSlug
        }
        collection {
          _id
          title
          slug
          gridImageId
        }
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

  return graphql(continueReadingQuery,
    {
      alias: "withContinueReading",
      options: (props) => ({
        variables: {}
      }),
      props(props) {
        return {
          continueReadingLoading: props.data.loading,
          continueReading: props.data.ContinueReading,
        }
      }
    }
  )(component);
}
