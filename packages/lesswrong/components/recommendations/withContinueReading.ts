import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import { getFragment } from '../../lib/vulcan-lib';

export const useContinueReading = () => {
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
  
  const { data, loading, error } = useQuery(continueReadingQuery, {
    ssr: true,
  });
  
  return {
    continueReading: data.ContinueReading,
    loading, error
  };
}
